COPY (
  SELECT
    id,
    nullif(county, '') AS county,
    name,
    principal,
    region,
    type,
    value,
    nullif(substitute_name, '') AS substitute_name,
    nullif(substitute_email, '') AS substitute_email
  FROM public.referent
  ORDER BY id
) TO STDOUT WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');
