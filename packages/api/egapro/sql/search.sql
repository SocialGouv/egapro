SELECT
    array_agg(declaration.data ORDER BY declaration.year DESC) as data,
    jsonb_object_agg(declaration.year::text, (declaration.data->'déclaration'->>'index')::int) as notes,
    jsonb_object_agg(declaration.year::text, (declaration.data->'indicateurs'->'rémunérations'->>'note')::int) as notes_remunerations,
    jsonb_object_agg(declaration.year::text, (declaration.data->'indicateurs'->'augmentations'->>'note')::int) as notes_augmentations,
    jsonb_object_agg(declaration.year::text, (declaration.data->'indicateurs'->'promotions'->>'note')::int) as notes_promotions,
    jsonb_object_agg(declaration.year::text, (declaration.data->'indicateurs'->'augmentations_et_promotions'->>'note')::int) as notes_augmentations_et_promotions,
    jsonb_object_agg(declaration.year::text, (declaration.data->'indicateurs'->'congés_maternité'->>'note')::int) as notes_conges_maternite,
    jsonb_object_agg(declaration.year::text, (declaration.data->'indicateurs'->'hautes_rémunérations'->>'note')::int) as notes_hautes_rémunérations
FROM declaration
JOIN search ON declaration.siren=search.siren AND declaration.year=search.year
    {where}
GROUP BY declaration.siren
ORDER BY max(declaration.year) DESC
LIMIT $1
OFFSET $2
