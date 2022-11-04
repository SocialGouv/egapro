INSERT INTO representation_equilibree (siren, year, modified_at, declared_at, data, ft)
VALUES ($1, $2, $3, $4, $5, to_tsvector('ftdict', $6))
ON CONFLICT (siren, year) DO UPDATE
SET modified_at=$3, declared_at=$4, data=$5, ft=to_tsvector('ftdict', $6)
