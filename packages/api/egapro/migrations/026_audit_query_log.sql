-- Create audit schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS audit;

-- Create the query_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS audit.query_log(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    username text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    operation text,
    table_name text,
    query text,
    result_count integer,
    params jsonb
);

-- Add index on username for faster lookups
CREATE INDEX IF NOT EXISTS query_log_username_idx ON audit.query_log(username);

-- Add index on created_at for faster time-based queries
CREATE INDEX IF NOT EXISTS query_log_created_at_idx ON audit.query_log(created_at);

CREATE INDEX IF NOT EXISTS query_log_operation_idx ON audit.query_log(operation);
CREATE INDEX IF NOT EXISTS query_log_table_name_idx ON audit.query_log(table_name);

-- Comment on table
COMMENT ON TABLE audit.query_log IS 'Logs database queries for auditing purposes';
COMMENT ON COLUMN audit.query_log.operation IS 'SQL operation type (SELECT, INSERT, UPDATE, DELETE)';
COMMENT ON COLUMN audit.query_log.table_name IS 'Name of the table being queried or modified';
COMMENT ON COLUMN audit.query_log.query IS 'SQL query being executed';
COMMENT ON COLUMN audit.query_log.params IS 'Parameters used in the query';
COMMENT ON COLUMN audit.query_log.result_count IS 'Number of results returned by the query (only for SELECT operations)';
