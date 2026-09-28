---
paths:
  - "src/**/*.tsx"
---

# Composants React

> Chargée sur tout `.tsx` sous `src/`. Vérifiée par `structural-auditor`. Les interdits mécaniques (`<svg>` inline, `<img>` brut, `style={}`) sont bloqués par le hook — voir `rules/automation.md`.

## Server par défaut, client au plus bas

Un composant est **Server Component** par défaut. `"use client"` ne s'ajoute que pour des hooks, des événements navigateur ou des Web APIs, et il s'isole au niveau le plus bas possible — jamais remonté sur un parent.

## Pas de logique dans le JSX

Conditions, calculs et transformations sont extraits **avant** le `return`. Un ternaire dans le JSX n'est acceptable que pour un show/hide simple (`{condition && <X />}`).

```tsx
// INTERDIT
return <div>{items.filter(i => i.active).map(i => <span key={i.id}>{i.name.toUpperCase()}</span>)}</div>

// CORRECT
const activeItems = items.filter(i => i.active);
return <div>{activeItems.map(i => <ActiveItem key={i.id} item={i} />)}</div>
```

## Granularité

Un composant = une responsabilité. Extraire un sous-composant vers ~50 lignes de JSX, et dès qu'un callback de `.map()` dépasse 5 lignes de JSX.

## `next/image`

`<img>` brut est bloqué par le hook. Avec `Image` de `next/image` : `width` + `height` obligatoires pour un SVG de `public/assets/`, et tout domaine distant se déclare dans `images.remotePatterns` de `next.config.js`. Les `alt` sont du ressort d'ultra11y (`rules/rgaa.md`), pas d'une liste ici.

## Pas de `useEffect` pour de la donnée dérivée

Tout ce qui se calcule depuis les props ou le state se calcule **pendant le rendu**, jamais par un effet qui recopie dans du state.

```tsx
// INTERDIT
const [fullName, setFullName] = useState("");
useEffect(() => { setFullName(`${first} ${last}`); }, [first, last]);

// CORRECT
const fullName = `${first} ${last}`;
```

`useEffect` est réservé à la synchronisation avec l'extérieur : abonnements, DOM, timers, analytics, APIs non-React. **Autorisé et à ne pas « corriger »** : hydrater un formulaire depuis une source asynchrone (`form.reset(query.data)` une fois qu'une query tRPC ou un brouillon résout) — c'est de la synchro externe, pas de la dérivation.

## Ids stables avec `useId`

Tout id qui relie un `<label>` à un `<input>` (ou un attribut aria) se génère avec `useId()` — jamais `Math.random()` ni un compteur de rendu, qui sont instables entre deux rendus et cassent l'accessibilité. Un composant peut accepter un `id` en prop pour la composition ; seuls les ids non déterministes générés au rendu sont interdits.

## Pas de `common.module.scss`

Chaque composant a son propre SCSS module scopé si des styles sur mesure sont nécessaires. Jamais de module SCSS partagé entre composants sans lien.
