SELECT
    array_agg(representation_equilibree.data ORDER BY representation_equilibree.declared_at DESC) as data,
    jsonb_object_agg(representation_equilibree.year::text, (representation_equilibree.data->'indicateurs'->'représentation_équilibrée'->>'pourcentage_femmes_cadres')::int) as pourcentage_femmes_cadres,
    jsonb_object_agg(representation_equilibree.year::text, (representation_equilibree.data->'indicateurs'->'représentation_équilibrée'->>'pourcentage_hommes_cadres')::int) as pourcentage_hommes_cadres,
    jsonb_object_agg(representation_equilibree.year::text, (representation_equilibree.data->'indicateurs'->'représentation_équilibrée'->>'pourcentage_femmes_membres')::int) as pourcentage_femmes_membres,
    jsonb_object_agg(representation_equilibree.year::text, (representation_equilibree.data->'indicateurs'->'représentation_équilibrée'->>'pourcentage_hommes_membres')::int) as pourcentage_hommes_membres,
FROM declaration
JOIN search ON representation_equilibree.siren=search.siren AND representation_equilibree.year=search.year
    {where}
GROUP BY representation_equilibree.siren
ORDER BY max(representation_equilibree.declared_at) DESC
LIMIT $1
OFFSET $2
