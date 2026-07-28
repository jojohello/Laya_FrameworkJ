CREATE TABLE IF NOT EXISTS player_battle_session (
    session_id CHAR(36) NOT NULL,
    player_id BIGINT NOT NULL,
    stage_id INT NOT NULL,
    status VARCHAR(16) NOT NULL,
    reward_snapshot VARCHAR(2048) NOT NULL DEFAULT '',
    created_at BIGINT NOT NULL,
    completed_at BIGINT NULL,
    PRIMARY KEY (session_id),
    KEY idx_player_battle_session_player_status (player_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
