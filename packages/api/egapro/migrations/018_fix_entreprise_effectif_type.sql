UPDATE declaration SET data = jsonb_set(data, '{entreprise,effectif,total}', to_jsonb(ROUND((data->'entreprise'->'effectif'->>'total')::float)));
