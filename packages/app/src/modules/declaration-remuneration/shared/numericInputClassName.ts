import common from "./common.module.scss";

export function numericInputClassName(hasError: boolean): string {
	return ["fr-input", common.numericInput, hasError ? "fr-input--error" : null]
		.filter(Boolean)
		.join(" ");
}
