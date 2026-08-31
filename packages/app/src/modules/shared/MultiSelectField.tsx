"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import styles from "./MultiSelectField.module.scss";

export type MultiSelectOption = { value: string; label: string };

type Props = {
	/** Prefix for every generated id; must be unique in the document. */
	id: string;
	/** Query-string key each checked option is submitted under. */
	name: string;
	label: string;
	options: readonly MultiSelectOption[];
	selected: readonly string[];
	/** Adds the filter box — worth it past a dozen options, noise below. */
	searchable?: boolean;
};

function normalize(value: string): string {
	return value
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.toLowerCase();
}

/**
 * The Figma "Sélectionner des options" field: a disclosure over a group of
 * checkboxes.
 *
 * It is deliberately not a combobox. The checkboxes are the real form controls,
 * so the surrounding GET form serialises them natively (`?region=A&region=B`),
 * the state survives with JavaScript disabled, and assistive technology gets a
 * grouped set of checkboxes it already knows how to announce — rather than a
 * hand-rolled listbox that has to reimplement selection, focus and state.
 */
export function MultiSelectField({
	id,
	name,
	label,
	options,
	selected,
	searchable = false,
}: Props) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [values, setValues] = useState<string[]>([...selected]);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const fieldRef = useRef<HTMLFieldSetElement>(null);

	// Closing on blur alone is not enough: a label is not focusable, so pressing
	// one blurs the trigger with a null `relatedTarget` before the click lands,
	// and the panel would disappear from under the pointer.
	useEffect(() => {
		if (!open) return;
		function closeOnOutsidePointer(event: PointerEvent) {
			const target = event.target;
			if (target instanceof Node && !fieldRef.current?.contains(target)) {
				setOpen(false);
			}
		}
		document.addEventListener("pointerdown", closeOnOutsidePointer);
		return () =>
			document.removeEventListener("pointerdown", closeOnOutsidePointer);
	}, [open]);

	const panelId = `${id}-panel`;
	const allSelected = values.length === options.length && options.length > 0;

	const visibleOptions = useMemo(() => {
		if (!searchable || query.trim() === "") return options;
		const needle = normalize(query.trim());
		return options.filter((option) => normalize(option.label).includes(needle));
	}, [options, query, searchable]);

	// A checked option that the filter hides is unmounted, and an unmounted
	// checkbox is not serialised — mirror it as a hidden input so filtering never
	// silently drops a selection on submit.
	const hiddenValues = useMemo(
		() =>
			values.filter(
				(value) => !visibleOptions.some((option) => option.value === value),
			),
		[values, visibleOptions],
	);

	function toggle(value: string, checked: boolean) {
		setValues((current) =>
			checked
				? [...current, value]
				: current.filter((entry) => entry !== value),
		);
	}

	function toggleAll() {
		setValues(allSelected ? [] : options.map((option) => option.value));
	}

	const triggerLabel =
		values.length === 0
			? "Sélectionner des options"
			: `${values.length} option${values.length > 1 ? "s" : ""} sélectionnée${values.length > 1 ? "s" : ""}`;

	return (
		<fieldset
			className={styles.field}
			onBlur={(event) => {
				if (
					event.relatedTarget &&
					!event.currentTarget.contains(event.relatedTarget)
				) {
					setOpen(false);
				}
			}}
			onKeyDown={(event) => {
				// Escape closes the panel and hands focus back to the trigger, so a
				// keyboard user is never left inside a list they cannot leave.
				if (event.key === "Escape" && open) {
					event.stopPropagation();
					setOpen(false);
					triggerRef.current?.focus();
				}
			}}
			ref={fieldRef}
		>
			<legend className={styles.legend}>{label}</legend>
			<button
				aria-controls={panelId}
				aria-expanded={open}
				className={`${styles.trigger} ${values.length > 0 ? styles.triggerFilled : ""}`}
				id={`${id}-trigger`}
				onClick={() => setOpen((current) => !current)}
				ref={triggerRef}
				type="button"
			>
				{/* Four of these sit on the search form; without the field name in
				    the accessible name they are indistinguishable in a screen
				    reader's button list. */}
				<span className="fr-sr-only">{label} : </span>
				<span>{triggerLabel}</span>
				<span
					aria-hidden="true"
					className={
						open ? "fr-icon-arrow-up-s-line" : "fr-icon-arrow-down-s-line"
					}
				/>
			</button>
			<div className={styles.panel} hidden={!open} id={panelId}>
				<button className={styles.selectAll} onClick={toggleAll} type="button">
					<span
						aria-hidden="true"
						className={
							allSelected ? "fr-icon-close-circle-line" : "fr-icon-check-line"
						}
					/>
					{allSelected ? "Tout désélectionner" : "Tout sélectionner"}
				</button>
				{searchable && (
					<div className={`fr-input-group ${styles.search}`}>
						<label className="fr-label fr-sr-only" htmlFor={`${id}-search`}>
							Rechercher parmi les options de {label.toLowerCase()}
						</label>
						<input
							className="fr-input"
							id={`${id}-search`}
							onChange={(event) => setQuery(event.currentTarget.value)}
							onKeyDown={(event) => {
								// Enter filters the list; it must not submit the search form.
								if (event.key === "Enter") event.preventDefault();
							}}
							placeholder="Rechercher"
							type="search"
							value={query}
						/>
						<span
							aria-hidden="true"
							className={`fr-icon-search-line fr-icon--sm ${styles.searchIcon}`}
						/>
					</div>
				)}
				<div className={styles.options}>
					{visibleOptions.length === 0 ? (
						<p className={styles.empty}>Aucune option ne correspond.</p>
					) : (
						visibleOptions.map((option) => {
							const optionId = `${id}-${option.value}`;
							return (
								<div
									className="fr-checkbox-group fr-checkbox-group--sm"
									key={option.value}
								>
									<input
										checked={values.includes(option.value)}
										id={optionId}
										name={name}
										onChange={(event) =>
											toggle(option.value, event.currentTarget.checked)
										}
										type="checkbox"
										value={option.value}
									/>
									<label className="fr-label" htmlFor={optionId}>
										{option.label}
									</label>
								</div>
							);
						})
					)}
				</div>
				{hiddenValues.map((value) => (
					<input key={value} name={name} type="hidden" value={value} />
				))}
			</div>
		</fieldset>
	);
}
