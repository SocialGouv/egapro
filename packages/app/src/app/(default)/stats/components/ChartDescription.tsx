"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { useState } from "react";

export type ChartDescriptionProps = {
  chartTitle: string;
  description: string;
};

export const ChartDescription = ({ description, chartTitle }: ChartDescriptionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleDescription = () => {
    setIsExpanded(!isExpanded);
  };

  const descriptionId = `chart-description-${chartTitle.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className={fr.cx("fr-mt-2w")}>
      <Button
        priority="tertiary no outline"
        size="small"
        iconId={isExpanded ? "fr-icon-arrow-up-s-line" : "fr-icon-arrow-down-s-line"}
        iconPosition="right"
        onClick={toggleDescription}
        aria-expanded={isExpanded}
        aria-controls={descriptionId}
      >
        {isExpanded ? "Masquer" : "Afficher"} la description détaillée
      </Button>
      {isExpanded && (
        <div
          id={descriptionId}
          className={fr.cx("fr-mt-1w", "fr-p-2w", "fr-callout")}
          role="region"
          aria-label={`Description détaillée du graphique : ${chartTitle}`}
        >
          <p className={fr.cx("fr-text--sm", "fr-mb-0")}>{description}</p>
        </div>
      )}
    </div>
  );
};
