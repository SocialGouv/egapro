UPDATE
  declaration T1
SET
  data = jsonb_set(T1.data,'{déclarant,téléphone}', T2.data->'déclarant'->'téléphone')
FROM
  declaration T2
WHERE
  T1.declared_at IS NOT NULL
  AND T1.data->'déclarant'->'téléphone' IS NULL
  AND T2.year > T1.year
  AND T1.owner = T2.owner
  AND T1.siren = T1.siren
  AND T2.data->'déclarant'->'téléphone' IS NOT NULL;
