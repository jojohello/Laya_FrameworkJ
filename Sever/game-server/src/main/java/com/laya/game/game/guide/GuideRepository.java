package com.laya.game.game.guide;

import jakarta.annotation.PostConstruct;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import com.laya.game.game.player.PlayerRepository;
import java.util.List;

@Repository
public class GuideRepository {
    private final JdbcTemplate jdbcTemplate;

    public GuideRepository(JdbcTemplate jdbcTemplate, PlayerRepository playerRepository) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void initializeSchema() {
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS player_guide_state ("
                + "player_id BIGINT NOT NULL, "
                + "guide_id INT NOT NULL, "
                + "status VARCHAR(32) NOT NULL, "
                + "current_step_id INT NOT NULL, "
                + "script_version INT NOT NULL, "
                + "started_at BIGINT NOT NULL, "
                + "completed_at BIGINT NULL, "
                + "PRIMARY KEY (player_id, guide_id))");
        if (tableExists("player_guide_progress") && tableExists("player_state")
                && !migrationApplied("legacy-guide-to-player-v1")) {
            jdbcTemplate.update("INSERT IGNORE INTO player_guide_state (player_id, guide_id, status, current_step_id, script_version, started_at, completed_at) "
                    + "SELECT role.player_id, progress.guide_id, progress.status, progress.current_step_id, progress.script_version, progress.started_at, progress.completed_at "
                    + "FROM player_guide_progress progress JOIN player_state legacy ON legacy.player_id = progress.player_id "
                    + "JOIN (SELECT user_id, MIN(player_id) player_id FROM player_role GROUP BY user_id HAVING COUNT(*) = 1) role ON role.user_id = legacy.user_id");
            markMigrationApplied("legacy-guide-to-player-v1");
        }
    }

    public List<GuideProgress> findAll(long playerId) {
        return jdbcTemplate.query(
                "SELECT guide_id, status, current_step_id, script_version FROM player_guide_state WHERE player_id = ?",
                (rs, rowNum) -> new GuideProgress(
                        rs.getInt("guide_id"),
                        rs.getString("status"),
                        rs.getInt("current_step_id"),
                        rs.getInt("script_version")),
                playerId);
    }

    public GuideProgress find(long playerId, int guideId) {
        List<GuideProgress> rows = jdbcTemplate.query(
                "SELECT guide_id, status, current_step_id, script_version FROM player_guide_state WHERE player_id = ? AND guide_id = ?",
                (rs, rowNum) -> new GuideProgress(
                        rs.getInt("guide_id"),
                        rs.getString("status"),
                        rs.getInt("current_step_id"),
                        rs.getInt("script_version")),
                playerId, guideId);
        return rows.isEmpty() ? null : rows.get(0);
    }

    public GuideProgress save(long playerId, int guideId, String status, int stepId, int version) {
        long now = System.currentTimeMillis();
        Long completedAt = "completed".equals(status) ? now : null;
        jdbcTemplate.update(
                "INSERT INTO player_guide_state "
                        + "(player_id, guide_id, status, current_step_id, script_version, started_at, completed_at) "
                        + "VALUES (?, ?, ?, ?, ?, ?, ?) "
                        + "ON DUPLICATE KEY UPDATE "
                        + "status = IF(status = 'completed', status, VALUES(status)), "
                        + "current_step_id = GREATEST(current_step_id, VALUES(current_step_id)), "
                        + "script_version = VALUES(script_version), "
                        + "completed_at = IF(status = 'completed', COALESCE(completed_at, VALUES(completed_at)), completed_at)",
                playerId, guideId, status, stepId, version, now, completedAt);
        return find(playerId, guideId);
    }

    private boolean tableExists(String tableName) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?", Integer.class, tableName);
        return count != null && count > 0;
    }

    private boolean migrationApplied(String key) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM game_schema_migration WHERE migration_key = ?", Integer.class, key);
        return count != null && count > 0;
    }

    private void markMigrationApplied(String key) {
        jdbcTemplate.update("INSERT IGNORE INTO game_schema_migration (migration_key, applied_at) VALUES (?, ?)", key, System.currentTimeMillis());
    }
}
