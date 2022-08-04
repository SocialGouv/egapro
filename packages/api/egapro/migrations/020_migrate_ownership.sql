INSERT INTO ownership (siren, email)
(SELECT siren, owner FROM declaration)
ON CONFLICT DO NOTHING;
ALTER TABLE declaration
RENAME COLUMN owner TO declarant;
