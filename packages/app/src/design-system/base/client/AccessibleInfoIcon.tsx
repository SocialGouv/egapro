"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { useId } from "react";

type AccessibleInfoIconProps = {
  className?: string;
  description: string;
};

export const AccessibleInfoIcon = ({ description, className }: AccessibleInfoIconProps) => {
  const tooltipId = useId();

  return (
    <span className={cx("fr-tooltip-wrapper", className)}>
      <button
        className={fr.cx("fr-btn", "fr-btn--sm", "fr-btn--tooltip", "fr-p-0", "fr-mr-0")}
        aria-describedby={tooltipId}
      >
        {/* <Icon icon="fr-icon-information-fill" size="xs" color="text-mention-grey" /> */}
        <span className={fr.cx("fr-sr-only")}>plus d'informations</span>
      </button>

      <span id={tooltipId} className={fr.cx("fr-tooltip", "fr-placement")} role="tooltip" aria-hidden="true">
        {description}
      </span>
    </span>
  );
};
