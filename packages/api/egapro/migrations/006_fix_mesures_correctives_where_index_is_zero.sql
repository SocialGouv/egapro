UPDATE declaration
    SET data = jsonb_set(data, '{déclaration,mesures_correctives}', legacy->'declaration'->'mesuresCorrection')
    WHERE
        declared_at IS NOT NULL
        AND legacy IS NOT NULL
        AND COALESCE(data->'déclaration'->>'mesures_correctives', '')!=COALESCE(legacy->'declaration'->>'mesuresCorrection', '')
        AND data->'déclaration'->>'index'='0';
