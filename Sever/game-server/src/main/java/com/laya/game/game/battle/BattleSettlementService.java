package com.laya.game.game.battle;

import com.laya.game.game.bag.BagService;
import com.laya.game.game.protocol.payload.bag.BagPayloads;
import com.laya.game.game.config.ConfigManager;
import com.laya.game.game.configStruct.BattleStageConfig;
import com.laya.game.game.configStruct.ItemConfig;
import com.laya.game.game.wallet.WalletInitData;
import com.laya.game.game.wallet.WalletRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Server-owned stage-session lifecycle and idempotent configured reward settlement. */
@Service
public class BattleSettlementService {
    private static final String OPEN = "open";
    private static final String VICTORY = "victory";
    private static final String DEFEAT = "defeat";

    private final JdbcTemplate jdbcTemplate;
    private final ConfigManager configManager;
    private final WalletRepository walletRepository;
    private final BagService bagService;

    public BattleSettlementService(JdbcTemplate jdbcTemplate, ConfigManager configManager,
                                   WalletRepository walletRepository, BagService bagService) {
        this.jdbcTemplate = jdbcTemplate;
        this.configManager = configManager;
        this.walletRepository = walletRepository;
        this.bagService = bagService;
    }

    @Transactional
    public EnterResult enter(long playerId, int stageId) {
        BattleStageConfig stage = configManager.get(BattleStageConfig.class, stageId);
        if (stage == null || !stage.getCanEnter()) return EnterResult.failed("stage_not_available");

        String sessionId = UUID.randomUUID().toString();
        jdbcTemplate.update(
                "INSERT INTO player_battle_session (session_id, player_id, stage_id, status, reward_snapshot, created_at) "
                        + "VALUES (?, ?, ?, ?, '', ?)",
                sessionId, playerId, stageId, OPEN, System.currentTimeMillis());
        return new EnterResult(true, sessionId, stageId, null);
    }

    @Transactional
    public CompleteResult complete(long playerId, String sessionId, boolean victory) {
        SessionRow session = findForUpdate(sessionId);
        if (session == null || session.playerId != playerId) return CompleteResult.failed("battle_session_not_found");

        if (!OPEN.equals(session.status)) {
            return toRecordedResult(session);
        }

        List<BattleReward> rewards = victory ? configuredRewards(session.stageId) : List.of();
        BagPayloads.BagDelta bagDelta = victory ? grantRewards(playerId, rewards) : null;
        String status = victory ? VICTORY : DEFEAT;
        String snapshot = encodeRewards(rewards);
        jdbcTemplate.update(
                "UPDATE player_battle_session SET status = ?, reward_snapshot = ?, completed_at = ? WHERE session_id = ?",
                status, snapshot, System.currentTimeMillis(), sessionId);
        return new CompleteResult(true, victory, true, rewards, walletRepository.findOrCreate(playerId),
                bagDelta, null, null);
    }

    private SessionRow findForUpdate(String sessionId) {
        List<SessionRow> rows = jdbcTemplate.query(
                "SELECT session_id, player_id, stage_id, status, reward_snapshot FROM player_battle_session "
                        + "WHERE session_id = ? FOR UPDATE",
                (rs, rowNum) -> new SessionRow(
                        rs.getString("session_id"), rs.getLong("player_id"), rs.getInt("stage_id"),
                        rs.getString("status"), rs.getString("reward_snapshot")),
                sessionId);
        return rows.isEmpty() ? null : rows.getFirst();
    }

    private CompleteResult toRecordedResult(SessionRow session) {
        boolean victory = VICTORY.equals(session.status);
        List<BattleReward> rewards = decodeRewards(session.rewardSnapshot);
        return new CompleteResult(true, victory, false, rewards, walletRepository.findOrCreate(session.playerId),
                null, bagService.snapshot(session.playerId, BagPayloads.BagType.MAIN), null);
    }

    private List<BattleReward> configuredRewards(int stageId) {
        BattleStageConfig stage = configManager.get(BattleStageConfig.class, stageId);
        if (stage == null) throw new IllegalStateException("stage_not_available");
        return decodeRewards(stage.getVictoryRewards());
    }

    private BagPayloads.BagDelta grantRewards(long playerId, List<BattleReward> rewards) {
        Map<Integer, Long> bagRewards = new LinkedHashMap<>();
        for (BattleReward reward : rewards) {
            ItemConfig item = configManager.get(ItemConfig.class, reward.itemId());
            if (item == null) throw new IllegalStateException("unknown_reward_item:" + reward.itemId());
            if ("Currency".equalsIgnoreCase(item.getType())) {
                walletRepository.changeBalance(playerId, reward.itemId(), reward.quantity());
            } else {
                bagRewards.merge(reward.itemId(), reward.quantity(), Math::addExact);
            }
        }
        return bagService.changeItemCounts(playerId, BagPayloads.BagType.MAIN, bagRewards);
    }

    /** CSV grammar: itemId:quantity;itemId:quantity. Empty means no reward. */
    private List<BattleReward> decodeRewards(String raw) {
        if (raw == null || raw.isBlank()) return List.of();
        Map<Integer, Long> merged = new LinkedHashMap<>();
        for (String entry : raw.split(";")) {
            String[] parts = entry.trim().split(":", -1);
            if (parts.length != 2) throw new IllegalStateException("invalid_reward_entry:" + entry);
            final int itemId;
            final long quantity;
            try {
                itemId = Integer.parseInt(parts[0].trim());
                quantity = Long.parseLong(parts[1].trim());
            } catch (NumberFormatException exception) {
                throw new IllegalStateException("invalid_reward_entry:" + entry, exception);
            }
            if (itemId <= 0 || quantity <= 0) throw new IllegalStateException("invalid_reward_entry:" + entry);
            try {
                merged.merge(itemId, quantity, Math::addExact);
            } catch (ArithmeticException exception) {
                throw new IllegalStateException("reward_quantity_overflow:" + itemId, exception);
            }
        }
        List<BattleReward> rewards = new ArrayList<>();
        merged.forEach((itemId, quantity) -> rewards.add(new BattleReward(itemId, quantity)));
        return rewards;
    }

    private String encodeRewards(List<BattleReward> rewards) {
        StringBuilder encoded = new StringBuilder();
        for (BattleReward reward : rewards) {
            if (!encoded.isEmpty()) encoded.append(';');
            encoded.append(reward.itemId()).append(':').append(reward.quantity());
        }
        return encoded.toString();
    }

    public record EnterResult(boolean success, String battleSessionId, int stageId, String reason) {
        static EnterResult failed(String reason) { return new EnterResult(false, null, 0, reason); }
    }

    public record CompleteResult(boolean success, boolean victory, boolean rewarded,
                                 List<BattleReward> rewards, WalletInitData wallet,
                                 BagPayloads.BagDelta bagDelta, BagPayloads.BagSnapshot bagSnapshot, String reason) {
        static CompleteResult failed(String reason) {
            return new CompleteResult(false, false, false, List.of(), null, null, null, reason);
        }
    }

    private record SessionRow(String sessionId, long playerId, int stageId, String status, String rewardSnapshot) {
    }
}
