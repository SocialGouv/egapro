"use client";

import { useEffect, useId, useState } from "react";

type Suggestion = { siren: string; name: string | null };

type Props = { autoComplete: "organization"; defaultValue: string };

export function CompanyAutocomplete({ autoComplete, defaultValue }: Props) {
	const listId = useId();
	const [query, setQuery] = useState(defaultValue);
	const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

	useEffect(() => {
		if (query.trim().length < 2) {
			setSuggestions([]);
			return;
		}
		const controller = new AbortController();
		const timer = window.setTimeout(async () => {
			try {
				const response = await fetch(
					`/api/public/declarations?q=${encodeURIComponent(query)}&limit=8`,
					{ signal: controller.signal },
				);
				if (!response.ok) return;
				const payload = (await response.json()) as { data?: Suggestion[] };
				setSuggestions(payload.data ?? []);
			} catch (error) {
				if (!(error instanceof DOMException && error.name === "AbortError")) {
					setSuggestions([]);
				}
			}
		}, 250);
		return () => {
			window.clearTimeout(timer);
			controller.abort();
		};
	}, [query]);

	return (
		<>
			<label className="fr-label" htmlFor="consultation-query">
				SIREN ou raison sociale
			</label>
			<input
				aria-autocomplete="list"
				autoComplete={autoComplete}
				className="fr-input"
				defaultValue={defaultValue}
				id="consultation-query"
				list={listId}
				name="q"
				onChange={(event) => setQuery(event.currentTarget.value)}
				placeholder="Ex. 319159877 ou Entreprise Exemple"
				type="search"
			/>
			<datalist id={listId}>
				{suggestions.map((suggestion) => (
					<option key={suggestion.siren} value={suggestion.siren}>
						{suggestion.name ?? "Entreprise"} — {suggestion.siren}
					</option>
				))}
			</datalist>
		</>
	);
}
