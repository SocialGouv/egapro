# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.4.0](https://github.com/SocialGouv/egapro/compare/v2.3.1...v2.4.0) (2020-02-06)


### Bug Fixes

* **declaration:** changement de la home pour parler de la déclaration ([#508](https://github.com/SocialGouv/egapro/issues/508)) ([3b9afe1](https://github.com/SocialGouv/egapro/commit/3b9afe1))
* **declaration:** charte graphique correcte pour le numéro "allô Index Egapro" ([#506](https://github.com/SocialGouv/egapro/issues/506)) ([972a511](https://github.com/SocialGouv/egapro/commit/972a511))
* **declaration:** datePublication et lienPublication déplacés dans informationsComplementaires ([#424](https://github.com/SocialGouv/egapro/issues/424)) ([d4b76e0](https://github.com/SocialGouv/egapro/commit/d4b76e0))
* **declaration:** fix typo ([573ca38](https://github.com/SocialGouv/egapro/commit/573ca38))
* **declaration:** impression de la totalité du récapitulatif ([#467](https://github.com/SocialGouv/egapro/issues/467)) ([62f4663](https://github.com/SocialGouv/egapro/commit/62f4663))
* **declaration:** ne pas demander le nom de l'UES si la structure est Entreprise ([#426](https://github.com/SocialGouv/egapro/issues/426)) ([99a434b](https://github.com/SocialGouv/egapro/commit/99a434b))
* **declaration:** permettre la validation de "informations complémentaires" si la date de consultation du CSE n'est pas demandée ([#450](https://github.com/SocialGouv/egapro/issues/450)) ([3b05327](https://github.com/SocialGouv/egapro/commit/3b05327))
* **declaration:** prise en compte des retours de la DGT (ter) ([#501](https://github.com/SocialGouv/egapro/issues/501)) ([1c110e3](https://github.com/SocialGouv/egapro/commit/1c110e3))
* **declaration:** renommage du bouton de la déclaration de 'valider' en 'déclarer' ([e475204](https://github.com/SocialGouv/egapro/commit/e475204))
* **declaration:** suppression des champs des effectifs globaux ([#439](https://github.com/SocialGouv/egapro/issues/439)) ([38372f1](https://github.com/SocialGouv/egapro/commit/38372f1))
* **deps:** update dependency @sentry/node to v5.11.1 ([#420](https://github.com/SocialGouv/egapro/issues/420)) ([d9c1555](https://github.com/SocialGouv/egapro/commit/d9c1555))
* **deps:** update dependency final-form to v4.18.7 ([#461](https://github.com/SocialGouv/egapro/issues/461)) ([5b86181](https://github.com/SocialGouv/egapro/commit/5b86181))
* **deps:** update dependency koa-router to v8 ([#457](https://github.com/SocialGouv/egapro/issues/457)) ([0808942](https://github.com/SocialGouv/egapro/commit/0808942))
* **import solen:** import des données de l'indicateur1 même dans le cas d'une modalité AMC (autre) ([#494](https://github.com/SocialGouv/egapro/issues/494)) ([99b8b6a](https://github.com/SocialGouv/egapro/commit/99b8b6a))
* **indicateur5:** ne demander qu'une seule donnée et calculer l'autre automatiquement ([#445](https://github.com/SocialGouv/egapro/issues/445)) ([a2be1c6](https://github.com/SocialGouv/egapro/commit/a2be1c6))
* **tests:** fix inotify watch ([#490](https://github.com/SocialGouv/egapro/issues/490)) ([6cf2a0a](https://github.com/SocialGouv/egapro/commit/6cf2a0a))
* **website:** changement du titre en Index Egapro ([6ed9b73](https://github.com/SocialGouv/egapro/commit/6ed9b73))


### Features

* **declaration:** affichage de l'index global sur la page de déclaration ([#446](https://github.com/SocialGouv/egapro/issues/446)) ([b090eea](https://github.com/SocialGouv/egapro/commit/b090eea))
* **declaration:** ajout de la donnée calculée dans kinto ([#495](https://github.com/SocialGouv/egapro/issues/495)) ([0fd67c0](https://github.com/SocialGouv/egapro/commit/0fd67c0))
* **declaration:** ajout du champ "nombre d'entreprises" pour les UES ([#465](https://github.com/SocialGouv/egapro/issues/465)) ([e00e20a](https://github.com/SocialGouv/egapro/commit/e00e20a))
* **declaration:** ajout du numéro "Allô Index Egapro" ([#470](https://github.com/SocialGouv/egapro/issues/470)) ([9e747aa](https://github.com/SocialGouv/egapro/commit/9e747aa))
* **declaration:** l'année de déclaration se choisit dans une liste déroulante ([#474](https://github.com/SocialGouv/egapro/issues/474)) ([622e579](https://github.com/SocialGouv/egapro/commit/622e579))
* **declaration:** le champ codeNaf est une liste de choix ([#454](https://github.com/SocialGouv/egapro/issues/454)) ([b99ad07](https://github.com/SocialGouv/egapro/commit/b99ad07))
* **declaration:** les champs région et département sont des listes de choix ([#459](https://github.com/SocialGouv/egapro/issues/459)) ([1dd4efd](https://github.com/SocialGouv/egapro/commit/1dd4efd))
* **declaration:** ne demande la date de consultation du CSE que si indicateur 1 pas par CSP ([#443](https://github.com/SocialGouv/egapro/issues/443)) ([6aa9015](https://github.com/SocialGouv/egapro/commit/6aa9015))
* **declaration:** rajout d'une modalité "autre" à la déclaration de l'indicateur 1 ([#499](https://github.com/SocialGouv/egapro/issues/499)) ([c998453](https://github.com/SocialGouv/egapro/commit/c998453))
* **declaration:** une déclaration ne peut être validée qu'une fois que tous les indicateurs ont été validés ([#428](https://github.com/SocialGouv/egapro/issues/428)) ([34af657](https://github.com/SocialGouv/egapro/commit/34af657))
* **declaration:** validation des SIRENs ([#447](https://github.com/SocialGouv/egapro/issues/447)) ([d76f7f5](https://github.com/SocialGouv/egapro/commit/d76f7f5))
* **declaration:** validation du format de l'adresse email ([#458](https://github.com/SocialGouv/egapro/issues/458)) ([473eb63](https://github.com/SocialGouv/egapro/commit/473eb63))
* **declaration:** validation du format du numéro de téléphone ([#463](https://github.com/SocialGouv/egapro/issues/463)) ([68f0b99](https://github.com/SocialGouv/egapro/commit/68f0b99))
* **import:** Script d'import utilisable en tant qu'API Python ([#415](https://github.com/SocialGouv/egapro/issues/415)) ([a7ae8eb](https://github.com/SocialGouv/egapro/commit/a7ae8eb))
* **RGPD:** ajout d'une page 'mentions légales' ([#473](https://github.com/SocialGouv/egapro/issues/473)) ([ab531a6](https://github.com/SocialGouv/egapro/commit/ab531a6))
* **RGPD:** conformité RGPD ([#483](https://github.com/SocialGouv/egapro/issues/483)) ([d04b17f](https://github.com/SocialGouv/egapro/commit/d04b17f))





## [2.3.1](https://github.com/SocialGouv/egapro/compare/v2.3.0...v2.3.1) (2020-01-13)


### Bug Fixes

* **deps:** update dependency @emotion/core to v10.0.27 ([#374](https://github.com/SocialGouv/egapro/issues/374)) ([67d52ec](https://github.com/SocialGouv/egapro/commit/67d52ec))
* **deps:** update dependency @types/react-datepicker to v2.10.0 ([#377](https://github.com/SocialGouv/egapro/issues/377)) ([9907601](https://github.com/SocialGouv/egapro/commit/9907601))
* **deps:** update dependency nodemailer to v6.4.2 ([#357](https://github.com/SocialGouv/egapro/issues/357)) ([d38df25](https://github.com/SocialGouv/egapro/commit/d38df25))
* **deps:** update dependency pino to v5.15.0 ([#361](https://github.com/SocialGouv/egapro/issues/361)) ([6ccbce7](https://github.com/SocialGouv/egapro/commit/6ccbce7))
* **liens vers solen:** suppression des liens direct vers SOLEN en faveur d'un lien vers le site du ministère ([ccf9a22](https://github.com/SocialGouv/egapro/commit/ccf9a22))





# [2.3.0](https://github.com/SocialGouv/egapro/compare/v2.2.1...v2.3.0) (2019-12-10)


### Bug Fixes

* **deps:** update dependency react-piwik to v1.8.0 ([#332](https://github.com/SocialGouv/egapro/issues/332)) ([bae37d7](https://github.com/SocialGouv/egapro/commit/bae37d7))


### Features

* **integration tests:** ajout de tests end to end via cypress ([#327](https://github.com/SocialGouv/egapro/issues/327)) ([9629209](https://github.com/SocialGouv/egapro/commit/9629209))
* **version:** ajout du numéro de version déployé dans le footer ([#339](https://github.com/SocialGouv/egapro/issues/339)) ([ab79127](https://github.com/SocialGouv/egapro/commit/ab79127))





## [2.2.1](https://github.com/SocialGouv/egapro/compare/v2.2.0...v2.2.1) (2019-11-26)


### Bug Fixes

* **deps:** update dependency react-piwik to v1.7.0 ([#331](https://github.com/SocialGouv/egapro/issues/331)) ([ccf4d81](https://github.com/SocialGouv/egapro/commit/ccf4d81))





# [2.2.0](https://github.com/SocialGouv/egapro/compare/v2.1.0...v2.2.0) (2019-11-25)


### Bug Fixes

* **deps:** update dependency @types/react-datepicker to v2.9.5 ([#324](https://github.com/SocialGouv/egapro/issues/324)) ([4675b73](https://github.com/SocialGouv/egapro/commit/4675b73))


### Features

* **bouton mon avis:** ajout d'un bouton "mon avis" en fin de récapitulatif ([#326](https://github.com/SocialGouv/egapro/issues/326)) ([97003ba](https://github.com/SocialGouv/egapro/commit/97003ba))





# [2.1.0](https://github.com/SocialGouv/egapro/compare/v2.0.2...v2.1.0) (2019-11-25)


### Bug Fixes

* **css:** suppression des z-index, whitespace sur les datepicker ([#276](https://github.com/SocialGouv/egapro/issues/276)) ([c5b5987](https://github.com/SocialGouv/egapro/commit/c5b5987))
* **css in js:** fix typo in strokeWidth and strokeLinecap attributes ([8d59500](https://github.com/SocialGouv/egapro/commit/8d59500))
* **deps:** update dependency @sentry/node to v5.8.0 ([#295](https://github.com/SocialGouv/egapro/issues/295)) ([211d490](https://github.com/SocialGouv/egapro/commit/211d490))
* **deps:** update dependency @sentry/node to v5.9.0 ([#297](https://github.com/SocialGouv/egapro/issues/297)) ([62a3518](https://github.com/SocialGouv/egapro/commit/62a3518))
* **deps:** update dependency @types/react-datepicker to v2.9.4 ([#286](https://github.com/SocialGouv/egapro/issues/286)) ([30803cf](https://github.com/SocialGouv/egapro/commit/30803cf))
* **deps:** update dependency date-fns to v2.7.0 ([#283](https://github.com/SocialGouv/egapro/issues/283)) ([14f3eee](https://github.com/SocialGouv/egapro/commit/14f3eee))
* **deps:** update dependency date-fns to v2.8.0 ([#306](https://github.com/SocialGouv/egapro/issues/306)) ([422e535](https://github.com/SocialGouv/egapro/commit/422e535))
* **deps:** update dependency date-fns to v2.8.1 ([#317](https://github.com/SocialGouv/egapro/issues/317)) ([e116195](https://github.com/SocialGouv/egapro/commit/e116195))
* **deps:** update dependency final-form to v4.18.6 ([#282](https://github.com/SocialGouv/egapro/issues/282)) ([e2cf474](https://github.com/SocialGouv/egapro/commit/e2cf474))
* **deps:** update dependency final-form-arrays to v3.0.2 ([#309](https://github.com/SocialGouv/egapro/issues/309)) ([e9ce72b](https://github.com/SocialGouv/egapro/commit/e9ce72b))
* **deps:** update dependency fuse.js to v3.4.6 ([#313](https://github.com/SocialGouv/egapro/issues/313)) ([e60cdbf](https://github.com/SocialGouv/egapro/commit/e60cdbf))
* **deps:** update dependency pino to v5.13.6 ([#289](https://github.com/SocialGouv/egapro/issues/289)) ([6a7aa53](https://github.com/SocialGouv/egapro/commit/6a7aa53))
* **deps:** update dependency pino to v5.14.0 ([#316](https://github.com/SocialGouv/egapro/issues/316)) ([705106e](https://github.com/SocialGouv/egapro/commit/705106e))
* **deps:** update dependency react-datepicker to v2.10.0 ([#293](https://github.com/SocialGouv/egapro/issues/293)) ([3733fcd](https://github.com/SocialGouv/egapro/commit/3733fcd))
* **deps:** update dependency react-datepicker to v2.10.1 ([#315](https://github.com/SocialGouv/egapro/issues/315)) ([9468820](https://github.com/SocialGouv/egapro/commit/9468820))
* **deps:** update react monorepo to v16.12.0 ([#299](https://github.com/SocialGouv/egapro/issues/299)) ([b4a7d40](https://github.com/SocialGouv/egapro/commit/b4a7d40))
* **matomo:** mise à jour de l'url de matomo ([#321](https://github.com/SocialGouv/egapro/issues/321)) ([566c970](https://github.com/SocialGouv/egapro/commit/566c970))


### Features

* **effectifs pris en compte:** affichage d'un avertissement si les effectifs pris en compte sont incohérents avec la tranche d'effectifs ([#288](https://github.com/SocialGouv/egapro/issues/288)) ([831a481](https://github.com/SocialGouv/egapro/commit/831a481))
* **FAQ:** le lien vers les référents pointe sur le site du ministère ([#303](https://github.com/SocialGouv/egapro/issues/303)) ([6c25a0b](https://github.com/SocialGouv/egapro/commit/6c25a0b))





## [2.0.2](https://github.com/SocialGouv/egapro/compare/v2.0.1...v2.0.2) (2019-11-05)


### Bug Fixes

* **50 à 250:** suppression de la phrase 'pour le moment' sur la page d'accueil mobile ([4690530](https://github.com/SocialGouv/egapro/commit/4690530))





## [2.0.1](https://github.com/SocialGouv/egapro/compare/v2.0.0...v2.0.1) (2019-11-04)


### Bug Fixes

* **page mobile:** reformulation 'calcul pas disponible' ([4d8d5b1](https://github.com/SocialGouv/egapro/commit/4d8d5b1))





# [2.0.0](https://github.com/SocialGouv/egapro/compare/v1.4.0...v2.0.0) (2019-11-04)


### Bug Fixes

* **50 à 250:** suppression de la phrase 'pour le moment' sur la page d'accueil ([a7f1218](https://github.com/SocialGouv/egapro/commit/a7f1218))





## [1.4.3](https://github.com/SocialGouv/egapro/compare/v1.4.0...v1.4.3) (2019-11-04)


### Bug Fixes

* **50 à 250:** suppression de la phrase 'pour le moment' sur la page d'accueil ([a7f1218](https://github.com/SocialGouv/egapro/commit/a7f1218))





## [1.4.2](https://github.com/SocialGouv/egapro/compare/v1.4.0...v1.4.2) (2019-11-04)


### Bug Fixes

* **50 à 250:** suppression de la phrase 'pour le moment' sur la page d'accueil ([a7f1218](https://github.com/SocialGouv/egapro/commit/a7f1218))





## [1.4.1](https://github.com/SocialGouv/egapro/compare/v1.4.0...v1.4.1) (2019-11-04)


### Bug Fixes

* **50 à 250:** suppression de la phrase 'pour le moment' sur la page d'accueil ([a7f1218](https://github.com/SocialGouv/egapro/commit/a7f1218))





# [1.4.0](https://github.com/SocialGouv/egapro/compare/v1.2.4...v1.4.0) (2019-11-04)


### Bug Fixes

* **50 à 250:** le bouton 'suivant' de l'indicateur 1 dépend de la tranche d'effectifs ([#253](https://github.com/SocialGouv/egapro/issues/253)) ([4e5d9b3](https://github.com/SocialGouv/egapro/commit/4e5d9b3))
* **deps:** pin dependencies ([#261](https://github.com/SocialGouv/egapro/issues/261)) ([0645795](https://github.com/SocialGouv/egapro/commit/0645795))
* **deps:** pin dependency date-fns to 2.6.0 ([#234](https://github.com/SocialGouv/egapro/issues/234)) ([0173b7f](https://github.com/SocialGouv/egapro/commit/0173b7f))
* **deps:** update dependency @emotion/core to v10.0.22 ([#229](https://github.com/SocialGouv/egapro/issues/229)) ([2cc6d87](https://github.com/SocialGouv/egapro/commit/2cc6d87))
* **deps:** update dependency deepmerge to v4.1.1 ([#169](https://github.com/SocialGouv/egapro/issues/169)) ([0099c7a](https://github.com/SocialGouv/egapro/commit/0099c7a))
* **deps:** update dependency deepmerge to v4.1.2 ([#211](https://github.com/SocialGouv/egapro/issues/211)) ([12aa679](https://github.com/SocialGouv/egapro/commit/12aa679))
* **deps:** update dependency deepmerge to v4.2.0 ([#212](https://github.com/SocialGouv/egapro/issues/212)) ([01ddefc](https://github.com/SocialGouv/egapro/commit/01ddefc))
* **deps:** update dependency deepmerge to v4.2.1 ([#228](https://github.com/SocialGouv/egapro/issues/228)) ([19ca3da](https://github.com/SocialGouv/egapro/commit/19ca3da))
* **deps:** update dependency deepmerge to v4.2.2 ([#258](https://github.com/SocialGouv/egapro/issues/258)) ([e0e2ee4](https://github.com/SocialGouv/egapro/commit/e0e2ee4))
* **deps:** update dependency dotenv to v8.2.0 ([#193](https://github.com/SocialGouv/egapro/issues/193)) ([e1b4f0f](https://github.com/SocialGouv/egapro/commit/e1b4f0f))
* **deps:** update dependency koa to v2.10.0 ([#178](https://github.com/SocialGouv/egapro/issues/178)) ([6845060](https://github.com/SocialGouv/egapro/commit/6845060))
* **deps:** update dependency koa to v2.11.0 ([#251](https://github.com/SocialGouv/egapro/issues/251)) ([e7c0d38](https://github.com/SocialGouv/egapro/commit/e7c0d38))
* **deps:** update dependency koa to v2.9.0 ([#177](https://github.com/SocialGouv/egapro/issues/177)) ([9080588](https://github.com/SocialGouv/egapro/commit/9080588))
* **deps:** update dependency nodemailer to v6.3.1 ([#171](https://github.com/SocialGouv/egapro/issues/171)) ([98fe406](https://github.com/SocialGouv/egapro/commit/98fe406))
* **deps:** update dependency pino to v5.13.5 ([#180](https://github.com/SocialGouv/egapro/issues/180)) ([fbc5e11](https://github.com/SocialGouv/egapro/commit/fbc5e11))
* **deps:** update react monorepo to v16.11.0 ([#227](https://github.com/SocialGouv/egapro/issues/227)) ([daf1733](https://github.com/SocialGouv/egapro/commit/daf1733))
* **deps:** update sentry monorepo to v5.7.0 ([#174](https://github.com/SocialGouv/egapro/issues/174)) ([2086eb1](https://github.com/SocialGouv/egapro/commit/2086eb1))
* **deps:** update sentry monorepo to v5.7.1 ([#185](https://github.com/SocialGouv/egapro/issues/185)) ([d6830ac](https://github.com/SocialGouv/egapro/commit/d6830ac))
* **indicateur 2et3:** Intégration des reviews ([b793224](https://github.com/SocialGouv/egapro/commit/b793224))
* **indicateur 2et3:** Renommage de l'indicateur 2et3 "indicateur écart de taux d'augmentations" ([50f3062](https://github.com/SocialGouv/egapro/commit/50f3062)), closes [#204](https://github.com/SocialGouv/egapro/issues/204)
* **indicateur 2et3:** Renommage des périodes de déclaration ([e4a5068](https://github.com/SocialGouv/egapro/commit/e4a5068)), closes [#206](https://github.com/SocialGouv/egapro/issues/206)
* **indicateur2et3:** meilleure présentation de l'écart de taux d'augmentation ([#246](https://github.com/SocialGouv/egapro/issues/246)) ([6ae6bdf](https://github.com/SocialGouv/egapro/commit/6ae6bdf))
* **informations:** supprimer les liens vers les indicateurs invalidés lors d'une modification des informations ([#256](https://github.com/SocialGouv/egapro/issues/256)) ([6eefde9](https://github.com/SocialGouv/egapro/commit/6eefde9))
* **informations:** toujours mettre à jour le menu quand on change d'effectifs ([#247](https://github.com/SocialGouv/egapro/issues/247)) ([93c3c02](https://github.com/SocialGouv/egapro/commit/93c3c02))


### Features

* **50 à 250:** Nouvelle page indicateur 2 et 3 écart de taux d'augmentations et de promotions ([#166](https://github.com/SocialGouv/egapro/issues/166)) ([7c5544b](https://github.com/SocialGouv/egapro/commit/7c5544b))
* **50 à 250:** Nouvelle page informations entreprise et période de référence ([bc8cc4d](https://github.com/SocialGouv/egapro/commit/bc8cc4d)), closes [#181](https://github.com/SocialGouv/egapro/issues/181)
* **indicateur 2et3:** Affichage et prise en compte conditionnelle des indicateurs selon la tranche d'effectifs ([72700ef](https://github.com/SocialGouv/egapro/commit/72700ef)), closes [#207](https://github.com/SocialGouv/egapro/issues/207)
* **indicateur 2et3:** Validation des champs "nombre de salariés augmentés" sur l'indicateur 2et3 ([16f06c5](https://github.com/SocialGouv/egapro/commit/16f06c5)), closes [#203](https://github.com/SocialGouv/egapro/issues/203)
* **informations:** invalider les effectifs lors d'un changement d'informations ([#245](https://github.com/SocialGouv/egapro/issues/245)) ([3093e12](https://github.com/SocialGouv/egapro/commit/3093e12))
* **informations:** invalider toutes les données lors d'une modification des informations ([#254](https://github.com/SocialGouv/egapro/issues/254)) ([f4789e9](https://github.com/SocialGouv/egapro/commit/f4789e9))
* **informations:** utilisation d'un datepicker compatible IE11 ([#260](https://github.com/SocialGouv/egapro/issues/260)) ([5c48f66](https://github.com/SocialGouv/egapro/commit/5c48f66))





## [1.2.4](https://github.com/SocialGouv/egapro/compare/v1.2.3...v1.2.4) (2019-10-08)

**Note:** Version bump only for package egapro





## [1.2.3](https://github.com/SocialGouv/egapro/compare/v1.2.2...v1.2.3) (2019-08-20)


### Bug Fixes

* prevent useless effectifs error no step 1 ([ee97163](https://github.com/SocialGouv/egapro/commit/ee97163))





## [1.2.2](https://github.com/SocialGouv/egapro/compare/v1.2.1...v1.2.2) (2019-07-31)

**Note:** Version bump only for package egapro





## [1.2.1](https://github.com/SocialGouv/egapro/compare/v1.3.0...v1.2.1) (2019-07-23)

**Note:** Version bump only for package egapro





# [1.2.0](https://github.com/SocialGouv/egapro/compare/v1.1.0...v1.2.0) (2019-07-16)


### Features

* **api:** add api to get package.json version ([#92](https://github.com/SocialGouv/egapro/issues/92)) ([c9b1196](https://github.com/SocialGouv/egapro/commit/c9b1196))
* **email:** active email ([#90](https://github.com/SocialGouv/egapro/issues/90)) ([6b31eb8](https://github.com/SocialGouv/egapro/commit/6b31eb8))





# 1.1.0 (2019-07-03)


### Bug Fixes

* **build:** update tsconfig.json ([d5bf45f](https://github.com/SocialGouv/egapro/commit/d5bf45f))


### Features

* **.env:** use .env file at the root directory ([57d5b6f](https://github.com/SocialGouv/egapro/commit/57d5b6f))
* **api:** change update api response ([3c193b0](https://github.com/SocialGouv/egapro/commit/3c193b0))
* **api:** change update api signature ([fbe44d4](https://github.com/SocialGouv/egapro/commit/fbe44d4))
* **api:** update response status and body ([e89e71d](https://github.com/SocialGouv/egapro/commit/e89e71d))
* **emails:** add api to send email ([b27cbc0](https://github.com/SocialGouv/egapro/commit/b27cbc0))
* **indicator-data:** add model, repo, service, api ([fbcc539](https://github.com/SocialGouv/egapro/commit/fbcc539))
* **kinto:** add kinto package ([79523cb](https://github.com/SocialGouv/egapro/commit/79523cb))
* **lint:** update tslint and fix all problems ([9e44dce](https://github.com/SocialGouv/egapro/commit/9e44dce))
* **logger:** change logging strategy ([e3d20c8](https://github.com/SocialGouv/egapro/commit/e3d20c8))
* **mail:** add mail service and configuration ([61568cc](https://github.com/SocialGouv/egapro/commit/61568cc))
* **proxy:** handle proxy with express for api ([c28c8ee](https://github.com/SocialGouv/egapro/commit/c28c8ee))
* **sentry:** connect api to sentry ([6ed7f17](https://github.com/SocialGouv/egapro/commit/6ed7f17))
