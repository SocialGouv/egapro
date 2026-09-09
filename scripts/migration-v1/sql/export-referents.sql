COPY (
  SELECT
    id,
    nullif(county, '') AS county,
    name,
    principal,
    region,
    type,
    value,
    substitute_name,
    substitute_email
  FROM public.referent
  ORDER BY id
) TO STDOUT WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');
