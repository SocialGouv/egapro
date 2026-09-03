type Props = { data: Record<string, unknown> };

/**
 * Structured data for search engines. `dangerouslySetInnerHTML` is forbidden in
 * this repo, and React writes a string child of `<script>` as its text content;
 * `<` is escaped so a company name can never close the element early.
 */
export function JsonLd({ data }: Props) {
	return (
		<script type="application/ld+json">
			{JSON.stringify(data).replaceAll("<", "\\u003c")}
		</script>
	);
}
