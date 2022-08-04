INSERT INTO declaration (siren, year, modified_at, declarant, draft)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (siren, year) DO UPDATE
SET modified_at=$3, draft=$5
