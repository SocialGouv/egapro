\if :migration_repeq
  CREATE TEMP TABLE migration_export_bounds AS
  SELECT
    coalesce(nullif(:'declared_at_gte', '')::timestamptz, '-infinity'::timestamptz) AS lower_bound,
    coalesce(nullif(:'declared_at_lt', '')::timestamptz, 'infinity'::timestamptz) AS upper_bound;

  DO $validation$
  DECLARE
    lower_bound timestamptz;
    upper_bound timestamptz;
    invalid_count bigint;
  BEGIN
    SELECT bounds.lower_bound, bounds.upper_bound
    INTO lower_bound, upper_bound
    FROM migration_export_bounds AS bounds;

    IF lower_bound >= upper_bound THEN
      RAISE EXCEPTION 'invalid representation export interval';
    END IF;

    SELECT count(*) INTO invalid_count
    FROM public.representation_equilibree AS source
    CROSS JOIN migration_export_bounds AS bounds
    WHERE source.declared_at >= bounds.lower_bound
      AND source.declared_at < bounds.upper_bound
      AND (source.modified_at IS NULL OR source.data IS NULL);
    IF invalid_count > 0 THEN
      RAISE EXCEPTION 'representation source contains % incomplete rows', invalid_count;
    END IF;
  END
  $validation$;

  DROP TABLE migration_export_bounds;
\endif

\if :migration_referents
  DO $validation$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.referent) THEN
      RAISE EXCEPTION 'referent source snapshot is empty';
    END IF;
  END
  $validation$;
\endif
