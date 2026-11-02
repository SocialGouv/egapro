import { TooltipButton } from "~/modules/shared/TooltipButton";
import common from "./common.module.scss";
import styles from "./TableTitle.module.scss";

type TableTitleProps = {
	level: "h2" | "h3";
	title: string;
	readingNote: string | null;
	tooltipId: string;
};

export function TableTitle({
	level,
	title,
	readingNote,
	tooltipId,
}: TableTitleProps) {
	const Heading = level;
	return (
		<div className={common.flexRowCenter}>
			<Heading className={styles.title}>{title}</Heading>
			{readingNote !== null && (
				<TooltipButton
					id={tooltipId}
					label={`Note de lecture du tableau « ${title} »`}
					text={readingNote}
				/>
			)}
		</div>
	);
}
