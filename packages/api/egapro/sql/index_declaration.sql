INSERT INTO search (siren, year, declared_at, ft, region, departement, section_naf, note)
VALUES ($1, $2, $3, to_tsvector('ftdict', $4), $5, $6, $7, $8)
ON CONFLICT (siren, year) DO UPDATE
SET declared_at=$3, ft=to_tsvector('ftdict', $4), region=$5, departement=$6, section_naf=$7, note=$8
