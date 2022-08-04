WITH subset AS (SELECT siren FROM search {where}),
     count AS (SELECT COUNT(DISTINCT(siren)) FROM subset),
     stats AS (SELECT avg((data->'déclaration'->>'index')::int),
                      min((data->'déclaration'->>'index')::int),
                      max((data->'déclaration'->>'index')::int)
               FROM declaration
               WHERE year=$1 AND siren IN (SELECT siren FROM subset))
    SELECT * FROM count JOIN stats ON true;
