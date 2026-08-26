# EgaPro

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Les entreprises déclarantes utilisent EgaPro pour remplir leurs obligations d'égalité professionnelle.
- Le grand public, les journalistes, les chercheurs et les organismes de contrôle consultent les résultats publics des entreprises.
- Les agents DGT et DREETS administrent les campagnes et contrôlent les déclarations.

## Product Purpose

EgaPro centralise la déclaration réglementaire des écarts professionnels entre les femmes et les hommes et rend consultables les données dont la diffusion publique est autorisée. Le succès combine un parcours déclaratif fiable et une consultation publique compréhensible, rapide et réutilisable.

## Positioning

La plateforme relie les indicateurs calculés à partir des données GIP-MDS, leur validation réglementaire et leur diffusion publique dans une même source officielle.

## Operating Context

Les déclarations suivent des campagnes annuelles. Les données publiques sont ouvertes après la date de rendu public pilotée par la DGT. La recherche publique doit fonctionner sans authentification et permettre une réutilisation par API et fichiers ouverts.

## Capabilities and Constraints

- Application Next.js, TypeScript, PostgreSQL/Drizzle et DSFR.
- Les indicateurs de rémunération A à F sont publics après validation; l'indicateur G, les avis CSE et les données personnelles des déclarants restent confidentiels.
- Les entreprises non diffusibles restent consultables, avec masquage des données d'identité interdites et conservation du département autorisé sur le site.
- Les URLs historiques de consultation doivent rester compatibles.
- Les interfaces publiques doivent être documentées, paginées, mises en cache et protégées contre les abus.

## Brand Commitments

Le service respecte l'identité de l'État et le système de design DSFR existant. Le ton est institutionnel, direct et explicatif, sans promesse commerciale.

## Evidence on Hand

- Données GIP-MDS et déclarations persistées dans PostgreSQL.
- API publique A-F, exports initiaux et documentation produit déjà présents dans le dépôt.
- La page Figma « Observatoire » existe mais ne contient pas encore de maquette exploitable; aucun détail visuel absent ne doit être inventé comme exigence Figma.

## Product Principles

- Ne publier que ce qui est explicitement autorisé.
- Expliquer les résultats autant que les afficher.
- Garder recherche, fiche, API et exports cohérents.
- Préserver les parcours et URLs déjà connus.
- Rendre chaque visualisation compréhensible sans dépendre du graphique.

## Accessibility & Inclusion

Les surfaces respectent le RGAA 4.1.2 et WCAG 2.2 AA, utilisent le DSFR, restent utilisables au clavier et proposent une alternative tabulaire aux graphiques.
