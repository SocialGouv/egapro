# Checklist — fidélité visuelle au Figma

Périmètre : le diff touche un `.tsx` ou un `.scss` (UI). Le dev server est démarré à l'étape 3 du mode gates ; inatteignable → `degraded`, jamais PASS. La discipline de **construction** (tokens Figma → DSFR, pièges) est dans `../../implement/references/conventions/figma.md` ; ici, la **vérification**.

Tu compares le **rendu** au **node Figma de référence** — jamais à une maquette HTML. **Les nombres d'abord** (mesurés dans le DOM), **les pixels ensuite** (overlay onion-skin + vision du modèle) — jamais l'œil seul.

Pourquoi : une lecture structurelle du Figma vérifie la *recette* (token → classe DSFR), pas le *résultat rendu*. Ce qui y survit — une classe correcte dont le CSS n'est pas chargé, une marge DSFR par défaut qui s'additionne, un gap `space-between` qui s'effondre à un vrai viewport, un soulignement qui déborde du texte, un gras que l'API a masqué — n'apparaît qu'au rendu et à la mesure.

## 0. Quelle référence ?

- Ticket avec `## Référence Figma` → les nodes listés (`fileKey` + `node-id`). C'est la source de vérité, pas ta mémoire du design.
- **Feature / Task UI sans `## Référence Figma`** → `REFACTO` : un écran conçu doit avoir sa référence ; valider sans elle, c'est deviner.
- **Bug sans node Figma** → cas normal. Référence, dans l'ordre : (1) les **valeurs mesurées et seuils** du commentaire `## Analyse du bug` ; (2) la **capture jointe** à l'issue (attention : elle montre souvent l'état *souhaité*) ; (3) le rendu de la **branche de base**, en avant/après.
- **Bug sans aucune référence** (ni mesures, ni capture, ni seuil) → ne devine pas : `degraded`, et dis ce qui manque.

## 1. Atteindre l'écran (décider avant de mesurer)

Premier qui marche :
1. **Harness d'isolation** — une route dev-only qui rend le composant avec des props arbitraires (ex. `/test-panel` → `PanelPlayground`). Le plus déterministe.
2. **Route réelle + état déterministe** — la vraie route `src/app/<path>`. Funnels authentifiés : compte ProConnect de test + fast-path `[DEV] Remplir` (`NEXT_PUBLIC_EGAPRO_ENV=dev`) avec données seedées. Sans session valide, la page renvoie 500 : demander à l'utilisateur de se connecter, ou débloquer la session locale par le seed DB.
3. **Inatteignable** → **jamais de PASS au feeling**. Fais les mesures possibles et rends `degraded` en listant ce qui n'a pas pu être rendu.

## 2. Conditions de rendu (non négociables)

- **Thème clair forcé** avant toute comparaison : `data-fr-scheme="light"` + `data-fr-theme="light"` sur `<html>`, ou le toggle « Paramètres d'affichage » du footer DSFR. Un rendu sombre fausse l'overlay et les couleurs.
- **≥ 2 hauteurs de viewport** : ex. `1280×1024` (frame Figma) **et** `1280×760` (laptop). Les bugs d'espacement se cachent à la hauteur du frame et apparaissent quand le contenu remplit le panneau. Un seul rendu à la taille dessinée = cause n°1 des ratés.
- **Tous les états — vide / partiel / rempli.** Les placeholders vides (« - % », « - € ») se valident comme les valeurs calculées. Ne jamais juger seulement l'état `[DEV] Remplir`.
- **État déterministe** : harness > route réelle ; sur route réelle, figer les données (fixture seedée + `[DEV] Remplir`) pour que le diff soit de la fidélité, pas du contenu.
- **Échelle** : navigateur `deviceScaleFactor: 2` ↔ export Figma à ~2× (`maxDimension` = 2 × le plus grand côté du node).

## 3. Référence Figma

Serveur MCP `figma` officiel (distant) : `get_design_context` / `get_variable_defs` / `get_metadata` pour les valeurs (`fill`, `fontSize`, `fontWeight`, `itemSpacing`/`gap`, hiérarchie, texte verbatim) et `get_screenshot` pour le PNG. `get_screenshot` renvoie une URL courte durée → `curl` le PNG dans `tmp/visual-<ticket>/` du worktree.

## 4. Rendu + mesure (le signal principal)

```bash
node packages/app/scripts/visual-fidelity-probe.ts \
  --config tmp/visual-<ticket>/scenario.json \
  --out tmp/visual-<ticket> \
  --base-url http://localhost:<port>
```

`scenario.json` (forme documentée en tête du script) : atteindre l'état (`setup`), capturer l'élément (`clip`), **mesurer** les nodes qui correspondent aux éléments Figma (`measures` + `gaps`). Repli pour une navigation ad hoc : MCP `playwright`.

Comparer chaque valeur mesurée à la valeur Figma :
- **Espacement** — `gap`/`margin` calculé vs `itemSpacing`. Un gap qui **s'effondre entre viewports** (167px → 0px) est une marge minimale manquante, toujours un constat.
- **Soulignement / surlignage** — largeur peinte (`box.w` / `backgroundSize`) vs `textWidth`. Gros `overhang` = soulignement qui déborde (bouton pleine largeur dans une colonne flex).
- **Police** — `fontSize` / `fontWeight` calculés vs Figma (≥ 600 ⇒ gras).
- **Couleur** — `color` / `backgroundColor` vs le token `fill`.

### Espaces verticaux — systématique, jamais à l'œil

L'erreur la plus fréquente et la plus invisible :
1. **Figma** (`get_metadata` du frame) : `y` + hauteur de **chaque** bloc, de haut en bas (titre, « Étape X sur 6 », sous-titre, chaque paragraphe, tableau, accordéon, callout, ligne de boutons…). Écart = `y_suivant − (y_courant + hauteur_courant)`.
2. **Rendu** : mêmes écarts via `getBoundingClientRect` (`bottom` du bloc N → `top` du bloc N+1), marge-collapse incluse.
3. **Tableau** : `entre A et B | écart Figma | écart live | Δ`. Tout Δ > ~2px = **bug bloquant** (viser ±1px).
4. Sur **tous les états**, à **≥ 2 largeurs** (desktop + mobile), thème clair forcé.
5. Les écarts doivent **tomber sur l'échelle DSFR** (multiples de 0,25 rem = 4px) : 30px là où le Figma veut 32px (`2rem`) est un défaut, pas un arrondi.

## 5. Overlay + vision (le filet)

```bash
node packages/app/scripts/visual-fidelity-probe.ts --overlay \
  --a tmp/visual-<ticket>/<name>-h<H>.png \
  --b tmp/visual-<ticket>/<figma-node>.png \
  --out tmp/visual-<ticket>/overlay-h<H>.png
```

Lis l'overlay et les deux images sources avec la vision du modèle. Il attrape ce que les nombres ratent : gras au niveau caractère (l'API Figma n'expose que le style *dominant* d'un node), bloc décalé par un voisin, retour à la ligne cassé, élément fantôme. L'overlay localise ; pointe ensuite la mesure (§ 4) sur la zone pour retrouver la propriété exacte et sa cause. Mesure et vision : **les deux**, jamais une seule.

## 6. Tolérances

- Espacement / taille : **±1px**. Un gap qui s'effondre entre viewports est un constat quelle que soit la tolérance.
- Couleur : **token DSFR exact**.
- Graisse : **bucket exact** (`< 600` regular vs `≥ 600` gras / `<strong>`).
- Purement technique (flash police système → web-font au chargement) : pas un constat.

## 7. Discipline de périmètre

Ne juge que ce que couvre le ticket. Une divergence explicitement confiée à un autre ticket (« couleur du séparateur → #NNNN, ne pas rejouer ») ne se signale pas.

## 8. Contrat de fidélité (couche permanente, en E2E)

Le contrôle ci-dessus est ponctuel : rien n'empêche la dérive de revenir six semaines plus tard, et un verdict `degraded` (session ProConnect absente) laisse partir l'écran en production sans qu'il ait jamais été rendu — c'est arrivé sur #3576. Ce qui survit est le **contrat de fidélité** : les valeurs du node Figma écrites une fois dans un `*.e2e.ts` dédié (constantes de module, assertions `getComputedStyle` / `getBoundingClientRect`), rejoué par chaque run E2E (`e2e.yaml`). Pas de moteur générique ni de dossier de fixtures. Modèles à copier :

| Fichier | Ce qu'il verrouille |
|---|---|
| `src/e2e/breadcrumb-spacing.e2e.ts` | marges du fil d'Ariane, 2 viewports × 3 écrans |
| `src/e2e/stepper-spacing.e2e.ts` | rythme vertical autour du stepper |
| `src/e2e/declaration-header-alignment.e2e.ts` | alignement de l'en-tête et de son bloc compagnon |
| `src/e2e/second-declaration-info-styling.e2e.ts` | fond, rampe typographique et padding du callout |

À vérifier en revue quand le diff touche un écran couvert ou crée un contrat :
1. Les valeurs viennent **du node Figma, jamais du rendu courant** (sinon le contrat fige les bugs).
2. Toute divergence assumée est **commentée dans le contrat** — une tolérance sans justification n'attrape plus rien (ex. largeur dérivée de `fr-col-lg-8` plutôt que des 790px du Figma → non assertée, raison écrite).
3. Pas d'assertion sur ce qu'un humain arbitre (illustration, ton de la copy, artwork d'icône).
4. **Pas de diff de pixels** : la rastérisation des polices varie selon la machine. Des nombres.
5. Assertion **imbriquée dans le parcours E2E** qui atteint déjà l'écran, pas un tunnel rejoué pour une mesure.

Un écran couvert par un contrat : le contrat fait foi — soit le code s'y conforme, soit le contrat est mis à jour **avec le nouveau node Figma en référence**, indiqué dans le commentaire d'en-tête.

## Hors périmètre

Comportement (→ `functional.md`), accessibilité (→ `a11y.md`), sécurité (→ `security.md`), performance.

## Sortie

```
Fidélité Figma: PASS | RETRY | REFACTO | degraded
Accès: harness | route | degraded
Node(s) Figma: <fileKey>#<node-id>   ·   Viewports: 1280×1024, 1280×760
Constats (mesuré vs Figma):
- <élément>: <propriété> = <mesuré> vs <attendu> [Δ] → <correctif>
Overlay / captures: tmp/visual-<ticket>/…
```

- `PASS` — dans la tolérance (ou deltas purement techniques).
- `RETRY` — écart corrigeable (espacement, couleur, graisse, soulignement, marge manquante) : propriété exacte + mesuré vs attendu, pour corriger en une passe.
- `REFACTO` — dérive structurelle (mauvais composant DSFR, layout cassé, section manquante) ou référence Figma absente sur un ticket UI.
- Après **2 RETRY** sur le même ticket → `REFACTO`.

Overlay(s) et captures **joints à la PR** (téléversés sur GitHub pour un rendu inline), même sur PASS : le relecteur humain confirme d'un coup d'œil. Vérifier avant envoi qu'elles ne montrent que de la donnée seedée (`AGENTS.md` § Hygiène git).
