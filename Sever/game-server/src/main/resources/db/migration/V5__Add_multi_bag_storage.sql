CREATE TABLE IF NOT EXISTS player_container_state (
    player_id BIGINT NOT NULL,
    bag_type VARCHAR(32) NOT NULL,
    capacity INT NOT NULL,
    version BIGINT NOT NULL,
    PRIMARY KEY (player_id, bag_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS player_container_item (
    player_id BIGINT NOT NULL,
    bag_type VARCHAR(32) NOT NULL,
    item_id INT NOT NULL,
    count BIGINT NOT NULL,
    PRIMARY KEY (player_id, bag_type, item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO player_container_state (player_id, bag_type, capacity, version)
SELECT player_id, 'main', capacity, version
FROM player_inventory_state;

INSERT IGNORE INTO player_container_item (player_id, bag_type, item_id, count)
SELECT player_id, 'main', item_id, count
FROM player_inventory_item;
