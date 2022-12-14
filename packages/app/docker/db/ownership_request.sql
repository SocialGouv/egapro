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
