SELECT
    array_agg(representation_equilibree.data ORDER BY representation_equilibree.year DESC) as data,
    jsonb_object_agg(representation_equilibree.year::text, json_build_object(
        'pourcentage_femmes_cadres', replace((representation_equilibree.data->'indicateurs'->'représentation_équilibrée'->>'pourcentage_femmes_cadres')::text, ',', '.')::real,
        'pourcentage_hommes_cadres', replace((representation_equilibree.data->'indicateurs'->'représentation_équilibrée'->>'pourcentage_hommes_cadres')::text, ',', '.')::real,
        'pourcentage_femmes_membres', replace((representation_equilibree.data->'indicateurs'->'représentation_équilibrée'->>'pourcentage_femmes_membres')::text, ',', '.')::real,
        'pourcentage_hommes_membres', replace((representation_equilibree.data->'indicateurs'->'représentation_équilibrée'->>'pourcentage_hommes_membres')::text, ',', '.')::real,
        'motif_non_calculabilité_cadres', (representation_equilibree.data->'indicateurs'->'représentation_équilibrée'->>'motif_non_calculabilité_cadres')::text,
        'motif_non_calculabilité_membres', (representation_equilibree.data->'indicateurs'->'représentation_équilibrée'->>'motif_non_calculabilité_membres')::text
    )) as représentation_équilibrée
FROM representation_equilibree
JOIN search_representation_equilibree ON representation_equilibree.siren=search_representation_equilibree.siren AND representation_equilibree.year=search_representation_equilibree.year
    {where}
GROUP BY representation_equilibree.siren
ORDER BY max(representation_equilibree.year) DESC
LIMIT $1
OFFSET $2
