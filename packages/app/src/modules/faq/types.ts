/** A single question-answer pair displayed as an accordion item. */
export type FaqItem = {
	question: string;
	answer: string;
};

/** A subsection within a FAQ section, rendered as h3 + accordion group. */
export type FaqSubsection = {
	title: string;
	items: FaqItem[];
};

/** A top-level section, rendered as h2 + multiple subsections. */
export type FaqSection = {
	id: string;
	title: string;
	subsections: FaqSubsection[];
};
