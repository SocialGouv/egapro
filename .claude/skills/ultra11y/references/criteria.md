<!-- GENERATED from src/data/wcag.json by `ultra11y criteria --generate` — do not edit by hand. -->

# WCAG 2.2 Level AA — success-criteria reference

The 55 Level A + AA success criteria across the 4 principles / 13 guidelines, with each
SC's level, the ultra11y automatability class (automatable / needs rendering / judgment),
the engine rules that cover it, and — one column per registered standards pack — the pack
criteria that map to it. SC ids, titles and levels are derived from the W3C source
(https://github.com/w3c/wcag); WCAG 2.2 © W3C.

## 1.1 Text Alternatives

| SC | Title | Level | Automatability | Rules | RGAA |
|---|---|---|---|---|---|
| 1.1.1 | Non-text Content | A | judgment | img-alt-missing, canvas-fallback-missing, decorative-alt-misuse, input-image-alt-missing, object-embed-no-name, chart-no-accessible-name | 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.9, 4.7, 4.8, 4.9, 6.1, 6.2, 7.2, 10.2, 13.3, 13.4, 13.5, 13.6 |

## 1.2 Time-based Media

| SC | Title | Level | Automatability | Rules | RGAA |
|---|---|---|---|---|---|
| 1.2.1 | Audio-only and Video-only (Prerecorded) | A | judgment | — | 4.1, 4.2 |
| 1.2.2 | Captions (Prerecorded) | A | judgment | media-no-track | 4.3, 4.4 |
| 1.2.3 | Audio Description or Media Alternative (Prerecorded) | A | judgment | — | 4.1, 4.2 |
| 1.2.4 | Captions (Live) | AA | judgment | — | — |
| 1.2.5 | Audio Description (Prerecorded) | AA | judgment | — | 4.5, 4.6 |

## 1.3 Adaptable

| SC | Title | Level | Automatability | Rules | RGAA |
|---|---|---|---|---|---|
| 1.3.1 | Info and Relationships | A | judgment | fieldset-legend-missing, data-table-no-headers, table-caption-missing, layout-table-data-markup, heading-order-skip, h1-missing, h1-multiple, list-structure, empty-heading, label-for-dangling, missing-main-landmark, multiple-main-landmark, sortable-header-no-aria-sort, nav-landmark-missing, nav-landmark-unnamed, radio-checkbox-group-ungrouped, table-empty-data-cell, css-generated-content-informative | 3.1, 5.1, 5.2, 5.4, 5.5, 5.6, 5.7, 5.8, 7.3, 8.9, 9.1, 9.2, 9.3, 9.4, 10.1, 10.2, 11.1, 11.5, 11.6, 11.7, 11.8, 12.6, 13.3, 13.4 |
| 1.3.2 | Meaningful Sequence | A | judgment | — | 5.3, 8.10, 10.1, 10.3, 10.8, 13.3, 13.4 |
| 1.3.3 | Sensory Characteristics | A | judgment | — | 10.9, 10.10 |
| 1.3.4 | Orientation | AA | needs-rendering | — | 13.9 |
| 1.3.5 | Identify Input Purpose | AA | judgment | field-purpose-incomplete | 11.13 |

## 1.4 Distinguishable

| SC | Title | Level | Automatability | Rules | RGAA |
|---|---|---|---|---|---|
| 1.4.1 | Use of Color | A | needs-rendering | — | 3.1, 10.6, 10.7, 10.9, 10.10 |
| 1.4.2 | Audio Control | A | static | autoplay-media | 4.10 |
| 1.4.3 | Contrast (Minimum) | AA | needs-rendering | contrast-literal | 3.2, 10.5 |
| 1.4.4 | Resize Text | AA | needs-rendering | meta-viewport-zoom-block | 10.4 |
| 1.4.5 | Images of Text | AA | needs-rendering | — | 1.8 |
| 1.4.10 | Reflow | AA | needs-rendering | — | 10.11 |
| 1.4.11 | Non-text Contrast | AA | needs-rendering | — | 3.3 |
| 1.4.12 | Text Spacing | AA | needs-rendering | — | 10.12 |
| 1.4.13 | Content on Hover or Focus | AA | needs-rendering | — | 10.13 |

## 2.1 Keyboard Accessible

| SC | Title | Level | Automatability | Rules | RGAA |
|---|---|---|---|---|---|
| 2.1.1 | Keyboard | A | judgment | clickable-noninteractive | 4.11, 4.12, 7.3, 10.14, 12.9, 12.11 |
| 2.1.2 | No Keyboard Trap | A | needs-rendering | — | 4.11, 4.12, 12.9 |
| 2.1.4 | Character Key Shortcuts | A | judgment | — | 12.10 |

## 2.2 Enough Time

| SC | Title | Level | Automatability | Rules | RGAA |
|---|---|---|---|---|---|
| 2.2.1 | Timing Adjustable | A | judgment | meta-refresh-redirect | 13.1, 13.8 |
| 2.2.2 | Pause, Stop, Hide | A | judgment | autoplay-media, blink-marquee | 13.1, 13.8 |

## 2.3 Seizures and Physical Reactions

| SC | Title | Level | Automatability | Rules | RGAA |
|---|---|---|---|---|---|
| 2.3.1 | Three Flashes or Below Threshold | A | needs-rendering | — | 13.7 |

## 2.4 Navigable

| SC | Title | Level | Automatability | Rules | RGAA |
|---|---|---|---|---|---|
| 2.4.1 | Bypass Blocks | A | judgment | skip-link-target-missing | 9.1, 12.6, 12.7, 13.3, 13.4 |
| 2.4.2 | Page Titled | A | static | title-missing-empty | 8.5, 8.6 |
| 2.4.3 | Focus Order | A | judgment | positive-tabindex | 10.3, 12.7, 12.8, 13.3, 13.4 |
| 2.4.4 | Link Purpose (In Context) | A | judgment | link-empty-name, icon-only-control-unnamed | 6.1, 6.2 |
| 2.4.5 | Multiple Ways | AA | judgment | — | 12.1, 12.3, 12.4 |
| 2.4.6 | Headings and Labels | AA | judgment | — | 9.1, 11.1, 11.2 |
| 2.4.7 | Focus Visible | AA | needs-rendering | — | 7.3, 10.7 |
| 2.4.11 | Focus Not Obscured (Minimum) | AA | needs-rendering | — | — |

## 2.5 Input Modalities

| SC | Title | Level | Automatability | Rules | RGAA |
|---|---|---|---|---|---|
| 2.5.1 | Pointer Gestures | A | judgment | — | 13.10 |
| 2.5.2 | Pointer Cancellation | A | judgment | — | 13.11 |
| 2.5.3 | Label in Name | A | judgment | — | 6.1, 7.1, 11.2, 11.9 |
| 2.5.4 | Motion Actuation | A | judgment | — | 13.12 |
| 2.5.7 | Dragging Movements | AA | judgment | — | — |
| 2.5.8 | Target Size (Minimum) | AA | needs-rendering | — | — |

## 3.1 Readable

| SC | Title | Level | Automatability | Rules | RGAA |
|---|---|---|---|---|---|
| 3.1.1 | Language of Page | A | static | html-lang-missing, lang-invalid | 8.3, 8.4, 13.3, 13.4 |
| 3.1.2 | Language of Parts | AA | judgment | inline-lang-change-missing, lang-invalid | 8.7, 8.8 |

## 3.2 Predictable

| SC | Title | Level | Automatability | Rules | RGAA |
|---|---|---|---|---|---|
| 3.2.1 | On Focus | A | judgment | — | 7.4, 13.2 |
| 3.2.2 | On Input | A | judgment | — | 7.4 |
| 3.2.3 | Consistent Navigation | AA | judgment | — | 12.2, 12.4, 12.5, 12.7 |
| 3.2.4 | Consistent Identification | AA | judgment | — | 11.3 |
| 3.2.6 | Consistent Help | A | judgment | — | — |

## 3.3 Input Assistance

| SC | Title | Level | Automatability | Rules | RGAA |
|---|---|---|---|---|---|
| 3.3.1 | Error Identification | A | judgment | aria-invalid-no-description, error-not-associated | 11.10 |
| 3.3.2 | Labels or Instructions | A | judgment | radio-checkbox-group-ungrouped, date-fields-ungrouped | 11.1, 11.2, 11.4, 11.5, 11.6, 11.7, 11.10 |
| 3.3.3 | Error Suggestion | AA | judgment | — | 11.11 |
| 3.3.4 | Error Prevention (Legal, Financial, Data) | AA | judgment | — | 11.12 |
| 3.3.7 | Redundant Entry | A | judgment | — | — |
| 3.3.8 | Accessible Authentication (Minimum) | AA | judgment | — | — |

## 4.1 Compatible

| SC | Title | Level | Automatability | Rules | RGAA |
|---|---|---|---|---|---|
| 4.1.2 | Name, Role, Value | A | judgment | iframe-title-missing, invalid-aria-role, aria-ref-missing-id, redundant-aria, clickable-noninteractive, aria-required-children, aria-hidden-focusable, nested-interactive, duplicate-id, control-label-missing, placeholder-as-label, form-field-multiple-labels, select-has-option, button-empty-name, icon-only-control-unnamed, control-name-title-only, field-purpose-incomplete, disabled-context-content | 1.2, 1.3, 1.9, 2.1, 2.2, 4.13, 5.3, 7.1, 7.2, 8.2, 9.1, 10.8, 11.1, 11.9, 12.6, 13.3, 13.4 |
| 4.1.3 | Status Messages | AA | judgment | live-region-conflict, status-message-not-assertive | 7.5 |
