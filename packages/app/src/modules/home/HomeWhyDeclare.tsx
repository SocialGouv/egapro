import Image from "next/image";
import Link from "next/link";
import {
	COMPANY_SIZE_VOLUNTARY_MAX,
	formatCivilDayMonth,
	formatCount,
	REPRESENTATION_SUBJECTION_WINDOW_YEARS,
	REPRESENTATION_SUBJECTION_WORKFORCE_MIN,
} from "~/modules/domain";
import { UNDER_CONSTRUCTION } from "~/modules/routes";
import styles from "./HomeWhyDeclare.module.scss";

type WhyDeclareCardProps = {
	title: string;
	tags: string[];
	description: string;
	illustration: { src: string; width: number; height: number };
	mediaClassName?: string;
};

function WhyDeclareCard({
	title,
	tags,
	description,
	illustration,
	mediaClassName,
}: WhyDeclareCardProps) {
	return (
		<div
			className={`fr-card fr-card--horizontal fr-enlarge-link fr-card--no-icon ${styles.card}`}
		>
			<div className="fr-card__body">
				<div className="fr-card__content">
					<div className="fr-card__start">
						<ul className={`fr-tags-group ${styles.tags}`}>
							{tags.map((tag) => (
								<li key={tag}>
									<p className="fr-tag">{tag}</p>
								</li>
							))}
						</ul>
					</div>
					<h3 className="fr-card__title">
						<Link href={UNDER_CONSTRUCTION}>{title}</Link>
					</h3>
					<p className="fr-card__desc">{description}</p>
					<div className={`fr-card__end ${styles.actionRow}`}>
						<span aria-hidden="true" className={styles.actionArrow} />
					</div>
				</div>
			</div>
			<div className="fr-card__header">
				<div className={`fr-card__img ${styles.media} ${mediaClassName}`}>
					<Image
						alt=""
						className={styles.illustration}
						height={illustration.height}
						src={illustration.src}
						unoptimized
						width={illustration.width}
					/>
				</div>
			</div>
		</div>
	);
}

type HomeWhyDeclareProps = {
	remunerationDeadline: Date;
	representationDeadline: Date;
};

export function HomeWhyDeclare({
	remunerationDeadline,
	representationDeadline,
}: HomeWhyDeclareProps) {
	const remunerationMin = formatCount(COMPANY_SIZE_VOLUNTARY_MAX);
	const representationMin = formatCount(
		REPRESENTATION_SUBJECTION_WORKFORCE_MIN,
	);

	return (
		<section aria-labelledby="why-declare-heading" className="fr-py-7w">
			<div className="fr-container">
				<h2 className="fr-h3 fr-mb-4w" id="why-declare-heading">
					Pourquoi déclarer ?
				</h2>
				<div className="fr-grid-row fr-grid-row--gutters">
					<div className="fr-col-12 fr-col-md-6">
						<WhyDeclareCard
							description={`Les entreprises de ${remunerationMin} salariés ou plus doivent déclarer leurs écarts de rémunération, précalculés via la DSN, sauf ceux par catégorie de salariés, à calculer.`}
							illustration={{
								src: "/assets/images/home/remuneration-illustration.svg",
								width: 206,
								height: 150,
							}}
							mediaClassName={styles.remunerationMedia}
							tags={[
								`Dès ${remunerationMin} salariés`,
								`Échéance au ${formatCivilDayMonth(remunerationDeadline)}`,
							]}
							title="Indicateurs de rémunération"
						/>
					</div>
					<div className="fr-col-12 fr-col-md-6">
						<WhyDeclareCard
							description={`Les entreprises d'au moins ${representationMin} salariés depuis ${REPRESENTATION_SUBJECTION_WINDOW_YEARS} ans consécutifs déclarent les écarts de représentation femmes-hommes parmi les dirigeants.`}
							illustration={{
								src: "/assets/images/home/representation-illustration.svg",
								width: 206,
								height: 180,
							}}
							mediaClassName={styles.representationMedia}
							tags={[
								`Dès ${representationMin} salariés`,
								`Échéance au ${formatCivilDayMonth(representationDeadline)}`,
							]}
							title="Indicateurs de représentation"
						/>
					</div>
				</div>
			</div>
		</section>
	);
}
