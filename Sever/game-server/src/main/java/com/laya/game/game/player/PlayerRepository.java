package com.laya.game.game.player;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public class PlayerRepository {
    private final JdbcTemplate jdbcTemplate;

    public PlayerRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public PlayerRole resolveOrCreate(String userId) {
        jdbcTemplate.update(
                "INSERT IGNORE INTO player_account_role_state (user_id, selected_player_id) VALUES (?, NULL)",
                userId);
        jdbcTemplate.queryForObject(
                "SELECT user_id FROM player_account_role_state WHERE user_id = ? FOR UPDATE",
                String.class, userId);
        List<PlayerRole> roles = findByUserId(userId);
        if (roles.isEmpty()) {
            jdbcTemplate.update(
                    "INSERT INTO player_role (user_id, name, level, exp, stamina) VALUES (?, ?, 1, 0, 100)",
                    userId, PlayerNameGenerator.createDefaultName());
            roles = findByUserId(userId);
        }
        if (roles.size() != 1) throw new PlayerSelectionRequiredException(userId);
        jdbcTemplate.update(
                "UPDATE player_account_role_state SET selected_player_id = ? WHERE user_id = ?",
                roles.get(0).playerId(), userId);
        return roles.get(0);
    }

    public List<PlayerRole> findByUserId(String userId) {
        return jdbcTemplate.query(
                "SELECT player_id, user_id, name, level, exp, stamina "
                        + "FROM player_role WHERE user_id = ? ORDER BY player_id",
                (rs, rowNum) -> new PlayerRole(
                        rs.getLong("player_id"),
                        rs.getString("user_id"),
                        rs.getString("name"),
                        rs.getInt("level"),
                        rs.getLong("exp"),
                        rs.getInt("stamina")),
                userId);
    }

    public PlayerRole find(long playerId) {
        List<PlayerRole> rows = jdbcTemplate.query(
                "SELECT player_id, user_id, name, level, exp, stamina FROM player_role WHERE player_id = ?",
                (rs, rowNum) -> new PlayerRole(
                        rs.getLong("player_id"),
                        rs.getString("user_id"),
                        rs.getString("name"),
                        rs.getInt("level"),
                        rs.getLong("exp"),
                        rs.getInt("stamina")),
                playerId);
        return rows.isEmpty() ? null : rows.get(0);
    }

    public boolean updateProgress(long playerId, int level, long exp, int stamina) {
        return jdbcTemplate.update(
                "UPDATE player_role SET level = ?, exp = ?, stamina = ? WHERE player_id = ?",
                level, exp, stamina, playerId) > 0;
    }

    public PlayerInitData levelUpFromOne(long playerId) {
        int affected = jdbcTemplate.update(
                "UPDATE player_role SET level = level + 1, exp = 0 WHERE player_id = ? AND level = 1",
                playerId);
        if (affected == 0) return null;
        PlayerRole player = find(playerId);
        return player == null ? null : player.toInitData();
    }
}
