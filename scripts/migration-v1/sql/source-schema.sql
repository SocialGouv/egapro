CREATE TABLE public.representation_equilibree (
  siren text NOT NULL,
  year integer NOT NULL,
  modified_at timestamp with time zone,
  declared_at timestamp with time zone,
  data jsonb,
  ft tsvector,
  PRIMARY KEY (siren, year)
);

CREATE TABLE public.referent (
  id uuid PRIMARY KEY,
  county text,
  name text NOT NULL,
  principal boolean NOT NULL DEFAULT false,
  region text NOT NULL,
  type text NOT NULL,
  value text NOT NULL,
  substitute_name text,
  substitute_email text
);
