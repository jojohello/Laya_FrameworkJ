CREATE TABLE IF NOT EXISTS player_role (
    player_id BIGINT NOT NULL AUTO_INCREMENT,
    user_id VARCHAR(128) NOT NULL,
    name VARCHAR(128) NOT NULL,
    level INT NOT NULL,
    exp BIGINT NOT NULL,
    stamina INT NOT NULL,
    PRIMARY KEY (player_id),
    UNIQUE KEY uk_player_role_user_name (user_id, name),
    KEY idx_player_role_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS player_account_role_state (
    user_id VARCHAR(128) NOT NULL,
    selected_player_id BIGINT NULL,
    PRIMARY KEY (user_id),
    KEY idx_player_account_selected_player (selected_player_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS player_guide_state (
    player_id BIGINT NOT NULL,
    guide_id INT NOT NULL,
    status VARCHAR(32) NOT NULL,
    current_step_id INT NOT NULL,
    script_version INT NOT NULL,
    activated_at BIGINT NOT NULL,
    started_at BIGINT NOT NULL,
    completed_at BIGINT NULL,
    PRIMARY KEY (player_id, guide_id),
    KEY idx_player_guide_queue (player_id, status, activated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS player_function_open (
    player_id BIGINT NOT NULL,
    function_id INT NOT NULL,
    opened_at BIGINT NOT NULL,
    version BIGINT NOT NULL,
    PRIMARY KEY (player_id, function_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS player_wallet_balance (
    player_id BIGINT NOT NULL,
    currency_item_id INT NOT NULL,
    balance BIGINT NOT NULL,
    PRIMARY KEY (player_id, currency_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS player_inventory_item (
    player_id BIGINT NOT NULL,
    item_id INT NOT NULL,
    count BIGINT NOT NULL,
    PRIMARY KEY (player_id, item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
