CREATE TABLE unrelated_private_table (secret text);
INSERT INTO unrelated_private_table VALUES ('must not be restored');

INSERT INTO representation_equilibree (siren, year, declared_at, modified_at, data)
VALUES
  (
    '800000001', 2023, '2024-02-10T09:30:00Z', '2024-02-11T14:45:00Z',
    jsonb_build_object(
      'déclarant', jsonb_build_object(
        'email', 'declarant@example.test', 'nom', 'Martin',
        'prénom', 'Camille', 'téléphone', '0102030405'
      ),
      'déclaration', jsonb_build_object(
        'année_indicateurs', 2023,
        'fin_période_référence', '2023-12-31',
        'publication', jsonb_build_object(
          'date', '2024-02-01', 'url', 'https://example.test/representation'
        )
      ),
      'entreprise', jsonb_build_object(
        'siren', '800000001', 'raison_sociale', 'Source company',
        'adresse', '1 rue de la Paix', 'code_naf', '62.01Z',
        'région', '11', 'département', '75'
      ),
      'indicateurs', jsonb_build_object(
        'représentation_équilibrée', jsonb_build_object(
          'pourcentage_femmes_cadres', 45,
          'pourcentage_hommes_cadres', 55,
          'pourcentage_femmes_membres', 40,
          'pourcentage_hommes_membres', 60
        )
      )
    )
  ),
  (
    '800000002', 2023, '2024-03-10T09:30:00Z', '2024-03-11T14:45:00Z',
    jsonb_build_object(
      'déclarant', jsonb_build_object(
        'email', 'native@example.test', 'nom', 'Durand',
        'prénom', 'Alex', 'téléphone', '0102030406'
      ),
      'déclaration', jsonb_build_object(
        'année_indicateurs', 2023,
        'fin_période_référence', '2023-12-31'
      ),
      'entreprise', jsonb_build_object(
        'siren', '800000002', 'raison_sociale', 'Native company'
      ),
      'indicateurs', jsonb_build_object(
        'représentation_équilibrée', jsonb_build_object(
          'pourcentage_femmes_cadres', 80,
          'pourcentage_hommes_cadres', 20
        )
      )
    )
  ),
  (
    '800000003', 2023, '2024-04-10T09:30:00Z', '2024-04-11T14:45:00Z',
    jsonb_build_object(
      'déclarant', jsonb_build_object(
        'email', 'third@example.test', 'nom', 'O''Neil',
        'prénom', 'Lou', 'téléphone', '0102030407'
      ),
      'déclaration', jsonb_build_object(
        'année_indicateurs', 2023,
        'fin_période_référence', '2024-02-29',
        'publication', jsonb_build_object(
          'date', '2024-04-01',
          'modalités', E'Affichage, puis\nSELECT * FROM app_user;'
        )
      ),
      'entreprise', jsonb_build_object(
        'siren', '800000003', 'raison_sociale', 'Société inconnue',
        'code_naf', '[NON-DIFFUSIBLE]', 'région', '99', 'département', '999'
      ),
      'indicateurs', jsonb_build_object(
        'représentation_équilibrée', jsonb_build_object(
          'motif_non_calculabilité_cadres', 'un_seul_cadre_dirigeant',
          'pourcentage_femmes_cadres', 99,
          'pourcentage_hommes_cadres', 1,
          'motif_non_calculabilité_membres', 'aucune_instance_dirigeante'
        )
      )
    )
  );

INSERT INTO referent (
  id, county, name, principal, region, type, value,
  substitute_name, substitute_email
)
VALUES
  (
    '11111111-1111-4111-8111-111111111111', '75',
    'Cellule égalité professionnelle', true, '11', 'email',
    'referent@example.test', 'Suppléance régionale', 'substitute@example.test'
  ),
  (
    '22222222-2222-4222-8222-222222222222', NULL,
    E'Coordination, régionale\nSELECT * FROM app_user;', false, '94', 'url',
    'https://example.test/contact?x=1,y=2', NULL, NULL
  );
