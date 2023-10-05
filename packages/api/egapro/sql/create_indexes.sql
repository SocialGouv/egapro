-- declaration
CREATE INDEX IF NOT EXISTS idx_effectifs ON declaration ((data->'entreprise'->'effectifs'->>'tranche'));
CREATE INDEX IF NOT EXISTS idx_declaration_ues_name ON declaration ((data->'entreprise'->'ues'->>'name'))
WHERE data->'entreprise'->'ues'->>'name' IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_status ON declaration (declared_at)
WHERE declared_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_declaration_email ON declaration ((data->'déclarant'->>'email'));
CREATE INDEX IF NOT EXISTS idx_declaration_siren ON declaration (siren);
-- search
CREATE INDEX IF NOT EXISTS idx_ft ON search USING GIN (ft);
CREATE INDEX IF NOT EXISTS idx_region ON search(region);
CREATE INDEX IF NOT EXISTS idx_departement ON search(departement);
CREATE INDEX IF NOT EXISTS idx_naf ON search(section_naf);
CREATE INDEX IF NOT EXISTS idx_declared_at ON search (declared_at);
-- representation_equilibree
CREATE INDEX IF NOT EXISTS idx_email ON representation_equilibree ((data->'déclarant'->>'email'));
CREATE INDEX IF NOT EXISTS idx_siren ON representation_equilibree (siren);
CREATE INDEX IF NOT EXISTS idx_representation_equilibree_status ON representation_equilibree (declared_at)
WHERE declared_at IS NOT NULL;
-- search
CREATE INDEX IF NOT EXISTS idx_representation_equilibree_ft ON search_representation_equilibree USING GIN (ft);
CREATE INDEX IF NOT EXISTS idx_representation_equilibree_region ON search_representation_equilibree(region);
CREATE INDEX IF NOT EXISTS idx_representation_equilibree_departement ON search_representation_equilibree(departement);
CREATE INDEX IF NOT EXISTS idx_representation_equilibree_naf ON search_representation_equilibree(section_naf);
CREATE INDEX IF NOT EXISTS idx_representation_equilibree_declared_at ON search_representation_equilibree (declared_at);