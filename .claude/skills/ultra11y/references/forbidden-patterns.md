# Forbidden anti-patterns (accessible HTML/CSS)

15 common traps. Format: ❌ bad → why → ✅ native fix → WCAG success criterion (engine
rule when statically detected).

### 1. Clickable `<div>`/`<span>`
❌ `<div onClick={…}>` → not focusable, not keyboard-operable, no role.
✅ native `<button type="button">`. WCAG 2.1.1 / 4.1.2 (`clickable-noninteractive`).

### 2. `<html>` without `lang`
❌ default language undeclared → wrong screen-reader pronunciation.
✅ `<html lang="en">`. WCAG 3.1.1 (`html-lang-missing`).

### 3. Page without `<title>` (or empty)
❌ missing tab/history title. ✅ a relevant `<title>`. WCAG 2.4.2 (`title-missing-empty`).

### 4. Empty link or button
❌ `<a href="/"></a>`, `<button></button>` → no accessible name.
✅ visible text, or `aria-label`. WCAG 2.4.4 / 4.1.2 (`link-empty-name`, `button-empty-name`).

### 5. Unnamed icon-only control
❌ `<button><svg/></button>` with no name. ✅ `aria-label` or visually-hidden text.
WCAG 2.4.4 / 4.1.2 (`icon-only-control-unnamed`).

### 6. `<label>` not associated with the field
❌ a visual label with no `for`/wrapping. ✅ `<label for="id">` or a wrapping label.
WCAG 4.1.2 (`control-label-missing`).

### 7. `placeholder` used as a label
❌ placeholder alone → disappears on input, not a label. ✅ a real `<label>`.
WCAG 4.1.2 (`placeholder-as-label`).

### 8. `outline: none` / `outline: 0` on a focusable element
❌ removes the keyboard focus indicator. ✅ keep/style a visible focus.
WCAG 2.4.7 (needs-rendering — verify manually).

### 9. Positive `tabindex`
❌ `tabindex="1"` breaks the logical DOM order. ✅ `tabindex="0"` or nothing.
WCAG 2.4.3 (`positive-tabindex`).

### 10. Informative text baked into an image
❌ text-as-image with no alternative. ✅ real text styled with CSS. WCAG 1.4.5 (judgment).

### 11. Meaning carried by CSS alone (`::before`/`::after`)
❌ information injected by styles only. ✅ text in the HTML. WCAG 1.3.1 (judgment/rendering).

### 12. Skip link hidden with `display:none`
❌ missing target or non-focusable skip link. ✅ a real target + visible on focus.
WCAG 2.4.1 (`skip-link-target-missing` for the target).

### 13. Navigation not structured as a list
❌ a run of links with no `<ul>`. ✅ `<nav><ul><li>…`. WCAG 1.3.1 (judgment).

### 14. Data table without headers
❌ `<table>` without `<th>`/`scope`/`<caption>`. ✅ headers + `scope` + caption.
WCAG 1.3.1 (`data-table-no-headers`, `table-caption-missing`).

### 15. Redundant or broken ARIA
❌ `<button role="button">`, `aria-labelledby="nonexistent-id"`, an invented role.
✅ native semantics; valid ARIA references. WCAG 4.1.2 (`redundant-aria`,
`aria-ref-missing-id`, `invalid-aria-role`).
