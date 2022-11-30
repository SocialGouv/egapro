UPDATE
    declaration
SET data = jsonb_set(data, '{entreprise,ues}', data->'entreprise'->'ues' #- '{nom}', true)
WHERE
    (siren, year)
    IN
    (('439778069', 2020),('344966452', 2019),('349281394', 2019),('829787746', 2019),('482941507', 2019),('403328842', 2019),('414652719', 2019),('310358460', 2018),('785933441', 2019),('339219941', 2019))