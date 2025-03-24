CREATE EXTENSION IF NOT EXISTS file_fdw;
CREATE SCHEMA IF NOT EXISTS audit;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_foreign_server WHERE srvname = 'log_server') THEN
        CREATE SERVER log_server FOREIGN DATA WRAPPER file_fdw;
    END IF;
END;
$$;

drop view if exists audit.sql_query_logs;
DROP FOREIGN TABLE IF EXISTS audit.postgres_csv_logs;
CREATE FOREIGN TABLE audit.postgres_csv_logs (
    log_time TIMESTAMP WITH TIME ZONE,
    username TEXT,
    database_name TEXT,
    process_id INTEGER,
    connection_from TEXT,       -- placeholder dans la table temporaire
    session_id TEXT,
    line_number BIGINT,        -- session_line_num
    command_number TEXT,       -- command_tag
    session_start_time TIMESTAMP WITH TIME ZONE,
    bind_param TEXT,           -- virtual_transaction_id
    log_line_number INTEGER,   -- transaction_id
    log_level TEXT,            -- error_severity
    error_code TEXT,           -- sql_state_code
    message TEXT,
    detail TEXT,
    hint TEXT,
    context TEXT,
    internal_user TEXT,        -- internal_query
    internal_db TEXT,          -- internal_query_pos (type changé en TEXT pour flexibilité)
    source_line TEXT,          -- query
    source_function TEXT,      -- query_pos (type changé en TEXT)
    extra1 TEXT,               -- location
    extra2 TEXT,               -- application_name
    process_name TEXT,         -- extra colonne
    extra3 TEXT,               -- extra colonne
    extra4 INTEGER             -- extra colonne
) SERVER log_server
OPTIONS (
    program 'cat /var/lib/postgresql/data/pg_log/*.csv 2>/dev/null', -- Chemin vers vos fichiers CSV
    format 'csv',
    header 'false', -- Pas d'en-tête dans les logs CSV
    quote '"',
    escape '"',
    null ''
);

CREATE OR REPLACE VIEW audit.sql_query_logs AS
SELECT
    log_time,
    username,
    database_name,
    command_number AS command_tag,
    source_line AS query,
    log_level AS error_severity,
    message
FROM
    audit.postgres_csv_logs
WHERE
    command_number IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'TRUNCATE');