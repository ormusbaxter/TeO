CREATE DATABASE IF NOT EXISTS teo
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'teo_app'@'%' IDENTIFIED BY 'BITTE_UNBEDINGT_AENDERN';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE ON teo.* TO 'teo_app'@'%';
FLUSH PRIVILEGES;

USE teo;

CREATE TABLE IF NOT EXISTS teo_schema_migrations (
  version INT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL,
  applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (version)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS teo_state (
  id TINYINT UNSIGNED NOT NULL,
  revision BIGINT UNSIGNED NOT NULL DEFAULT 1,
  payload JSON NOT NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_by VARCHAR(40) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT chk_teo_singleton CHECK (id = 1)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS teo_sessions (
  token_hash CHAR(64) NOT NULL,
  user_id VARCHAR(100) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (token_hash),
  INDEX idx_teo_sessions_expires (expires_at),
  INDEX idx_teo_sessions_user (user_id)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS teo_audit_log (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_type VARCHAR(80) NOT NULL,
  actor_user_id VARCHAR(100) NULL,
  actor_username VARCHAR(40) NOT NULL,
  revision BIGINT UNSIGNED NULL,
  ip_address VARCHAR(45) NULL,
  details JSON NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  INDEX idx_teo_audit_created (created_at),
  INDEX idx_teo_audit_actor (actor_user_id)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
