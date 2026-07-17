package com.laya.game.game.functionopen;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public class FunctionOpenRepository {
    private final JdbcTemplate jdbcTemplate;

    public FunctionOpenRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<FunctionOpenState> findOpened(long playerId) {
        return jdbcTemplate.query(
                "SELECT function_id, opened_at, version FROM player_function_open WHERE player_id = ?",
                (rs, rowNum) -> new FunctionOpenState(
                        rs.getInt("function_id"),
                        true,
                        rs.getLong("opened_at"),
                        rs.getLong("version")),
                playerId);
    }

    @Transactional
    public boolean open(long playerId, int functionId) {
        long now = System.currentTimeMillis();
        return jdbcTemplate.update(
                "INSERT IGNORE INTO player_function_open "
                        + "(player_id, function_id, opened_at, version) VALUES (?, ?, ?, 1)",
                playerId, functionId, now) > 0;
    }
}
