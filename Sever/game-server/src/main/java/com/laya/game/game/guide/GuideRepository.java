package com.laya.game.game.guide;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class GuideRepository {
    private final JdbcTemplate jdbcTemplate;

    public GuideRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<GuideProgress> findAll(long playerId) {
        return jdbcTemplate.query(
                "SELECT guide_id, status, current_step_id, script_version "
                        + "FROM player_guide_state WHERE player_id = ? ORDER BY activated_at, guide_id",
                (rs, rowNum) -> new GuideProgress(
                        rs.getInt("guide_id"),
                        rs.getString("status"),
                        rs.getInt("current_step_id"),
                        rs.getInt("script_version")),
                playerId);
    }

    public void enqueueIfAbsent(long playerId, int guideId, int version, long activatedAt) {
        jdbcTemplate.update(
                "INSERT IGNORE INTO player_guide_state "
                        + "(player_id, guide_id, status, current_step_id, script_version, "
                        + "activated_at, started_at, completed_at) "
                        + "VALUES (?, ?, 'queued', 0, ?, ?, ?, NULL)",
                playerId, guideId, version, activatedAt, activatedAt);
    }

    public List<Integer> findQueuedIds(long playerId) {
        return jdbcTemplate.queryForList(
                "SELECT guide_id FROM player_guide_state "
                        + "WHERE player_id = ? AND status <> 'completed' ORDER BY activated_at, guide_id",
                Integer.class, playerId);
    }

    public GuideProgress find(long playerId, int guideId) {
        List<GuideProgress> rows = jdbcTemplate.query(
                "SELECT guide_id, status, current_step_id, script_version "
                        + "FROM player_guide_state WHERE player_id = ? AND guide_id = ?",
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
                        + "(player_id, guide_id, status, current_step_id, script_version, "
                        + "activated_at, started_at, completed_at) "
                        + "VALUES (?, ?, ?, ?, ?, ?, ?, ?) "
                        + "ON DUPLICATE KEY UPDATE "
                        + "status = IF(status = 'completed', status, VALUES(status)), "
                        + "current_step_id = GREATEST(current_step_id, VALUES(current_step_id)), "
                        + "script_version = VALUES(script_version), "
                        + "completed_at = IF(status = 'completed', "
                        + "COALESCE(completed_at, VALUES(completed_at)), completed_at)",
                playerId, guideId, status, stepId, version, now, now, completedAt);
        return find(playerId, guideId);
    }
}
