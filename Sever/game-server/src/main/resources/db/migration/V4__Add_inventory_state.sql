CREATE TABLE IF NOT EXISTS player_inventory_state (
    player_id BIGINT NOT NULL,
    capacity INT NOT NULL,
    version BIGINT NOT NULL,
    PRIMARY KEY (player_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO player_inventory_state (player_id, capacity, version)
SELECT DISTINCT player_id, 40, 0
FROM player_inventory_item;
