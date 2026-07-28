-- Déclarations existantes qu'un seuil symétrique (issue #3963) aurait fait
-- basculer en parcours de conformité : écart d'au moins 5 % en défaveur des
-- hommes sur l'indicateur G, alors que la démarche n'a jamais été engagée.
--
-- Le statut FSM des déclarations n'est PAS rétroactif (event-sourcing, écrit une
-- seule fois au moment de l'action) : cette requête sert uniquement à identifier
-- les déclarations concernées pour un arbitrage manuel par l'équipe.
--
-- LECTURE SEULE — aucun UPDATE, aucun backfill.
WITH category_gaps AS (
    SELECT
        d.id     AS declaration_id,
        d.siren,
        d.year,
        d.status,
        ((pair.men - pair.women) / pair.men) * 100 AS gap_percent
    FROM app_declaration d
    JOIN app_job_category      jc ON jc.declaration_id  = d.id
    JOIN app_employee_category ec ON ec.job_category_id = jc.id
    CROSS JOIN LATERAL (VALUES
        (ec.annual_base_women,     ec.annual_base_men),
        (ec.annual_variable_women, ec.annual_variable_men),
        (ec.hourly_base_women,     ec.hourly_base_men),
        (ec.hourly_variable_women, ec.hourly_variable_men)
    ) AS pair(women, men)
    WHERE d.cancelled_at IS NULL
      AND ec.declaration_type = 'initial'
      AND pair.women IS NOT NULL
      AND pair.men   IS NOT NULL
      AND pair.men  <> 0
)
SELECT
    declaration_id,
    siren,
    year,
    status,
    ROUND(MIN(gap_percent)::numeric, 2) AS worst_gap_against_men_percent
FROM category_gaps
WHERE gap_percent <= -5          -- significatif uniquement en défaveur des hommes
  AND status IN ('draft', 'demarche_completed')   -- démarche jamais engagée
GROUP BY declaration_id, siren, year, status
ORDER BY worst_gap_against_men_percent ASC;
