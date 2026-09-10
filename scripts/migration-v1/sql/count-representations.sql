SELECT count(*)
FROM public.representation_equilibree
WHERE declared_at >= coalesce(nullif(:'declared_at_gte', '')::timestamptz, '-infinity'::timestamptz)
  AND declared_at < coalesce(nullif(:'declared_at_lt', '')::timestamptz, 'infinity'::timestamptz);
