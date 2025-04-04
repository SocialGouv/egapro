CREATE EXTENSION IF NOT EXISTS unaccent;
DO
$$BEGIN
    CREATE TEXT SEARCH CONFIGURATION ftdict (COPY=simple);
    ALTER TEXT SEARCH CONFIGURATION ftdict ALTER MAPPING FOR hword, hword_part, word WITH unaccent, simple;
EXCEPTION
   WHEN unique_violation THEN
      NULL;  -- ignore error
END;$$;
CREATE TABLE IF NOT EXISTS declaration
(siren TEXT, year INT, modified_at TIMESTAMP WITH TIME ZONE, declared_at TIMESTAMP WITH TIME ZONE, declarant TEXT, data JSONB, draft JSONB, legacy JSONB, ft TSVECTOR,
PRIMARY KEY (siren, year));
CREATE TABLE IF NOT EXISTS representation_equilibree
(siren TEXT, year INT, modified_at TIMESTAMP WITH TIME ZONE, declared_at TIMESTAMP WITH TIME ZONE, data JSONB, ft TSVECTOR,
PRIMARY KEY (siren, year));
CREATE TABLE IF NOT EXISTS simulation
(id uuid PRIMARY KEY, modified_at TIMESTAMP WITH TIME ZONE, data JSONB);

-- search declaration
CREATE TABLE IF NOT EXISTS search
(siren TEXT, year INT, declared_at TIMESTAMP WITH TIME ZONE, ft TSVECTOR, region VARCHAR(2), departement VARCHAR(3), section_naf CHAR, note INT,
PRIMARY KEY (siren, year));
ALTER TABLE search DROP CONSTRAINT IF EXISTS declaration_exists;
ALTER TABLE search ADD CONSTRAINT declaration_exists FOREIGN KEY (siren,year) REFERENCES declaration(siren,year) ON DELETE CASCADE ON UPDATE CASCADE;

-- search representation equilibree
CREATE TABLE IF NOT EXISTS search_representation_equilibree
(siren TEXT, year INT, declared_at TIMESTAMP WITH TIME ZONE, ft TSVECTOR, region VARCHAR(2), departement VARCHAR(3), section_naf CHAR,
PRIMARY KEY (siren, year));
ALTER TABLE search_representation_equilibree DROP CONSTRAINT IF EXISTS representation_equilibree_exists;
ALTER TABLE search_representation_equilibree ADD CONSTRAINT representation_equilibree_exists FOREIGN KEY (siren,year) REFERENCES representation_equilibree(siren,year) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS archive
(siren TEXT, year INT, at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), by TEXT, ip INET, data JSONB);
CREATE TABLE IF NOT EXISTS ownership (siren TEXT, email TEXT, PRIMARY KEY (siren, email));

------------------
create extension if not exists "uuid-ossp";

-- function
create or replace function modified_at_auto()
returns trigger as
$$
begin
    new.modified_at = current_timestamp;
    return new;
end;
$$ language 'plpgsql';

create table if not exists ownership_request
(
    id           uuid                     default uuid_generate_v4()
        constraint ownership_request_pk primary key,
    created_at   timestamp with time zone default now(),
    modified_at  timestamp with time zone default now(),
    siren        text,
    email        text,
    asker_email  text not null,
    status       text not null,
    error_detail JSONB
);

drop trigger if exists trigger_ownership_request_modified_at on ownership_request;

create trigger trigger_ownership_request_modified_at
    before update
    on ownership_request
    for each row
execute procedure modified_at_auto();


create table if not exists referent
(
    id                  uuid                default uuid_generate_v4()
        constraint referent_pk primary key,
    county              text,
    name                text not null,
    principal           boolean not null    default false,
    region              text not null,
    type                text not null,
    value               text not null,
    substitute_name     text,
    substitute_email    text
);

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
-- Comment on table
COMMENT ON TABLE audit.query_log IS 'Logs database queries for auditing purposes';
COMMENT ON COLUMN audit.query_log.operation IS 'operation name';
COMMENT ON COLUMN audit.query_log.table_name IS 'Name of the table being queried or modified';
COMMENT ON COLUMN audit.query_log.query IS 'SQL query being executed';
COMMENT ON COLUMN audit.query_log.params IS 'Parameters used in the query';
COMMENT ON COLUMN audit.query_log.result_count IS 'Number of results returned by the query (only for SELECT operations)';
