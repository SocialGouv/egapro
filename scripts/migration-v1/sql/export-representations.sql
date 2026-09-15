COPY (
  SELECT
    siren,
    year,
    declared_at,
    modified_at,
    data
  FROM public.representation_equilibree
  WHERE declared_at >= coalesce(nullif(:'declared_at_gte', '')::timestamptz, '-infinity'::timestamptz)
    AND declared_at < coalesce(nullif(:'declared_at_lt', '')::timestamptz, 'infinity'::timestamptz)
  ORDER BY siren, year
) TO STDOUT WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');
