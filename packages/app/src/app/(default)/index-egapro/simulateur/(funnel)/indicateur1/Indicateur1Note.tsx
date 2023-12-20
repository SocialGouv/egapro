import { fr } from "@codegouvfr/react-dsfr";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { type ComputedResult } from "@common/core-domain/computers/AbstractComputer";
import { type TotalMetadata } from "@common/core-domain/computers/AbstractGroupComputer";
import { type IndicateurUnComputer } from "@common/core-domain/computers/IndicateurUnComputer";
import { percentFormat } from "@common/utils/number";
import { IndicatorNote } from "@design-system";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";

import styles from "./IndicatorNote1.module.css";

interface Props {
  computer: IndicateurUnComputer;
  isValid: boolean;
  noBorder?: boolean;
  simple?: boolean;
}

function getNCText(metadata: TotalMetadata) {
  const validPourcentageRounded = Math.round((metadata.totalGroupCount / metadata.totalEmployeeCount) * 100);
  return (
    <i>
      Il faut avoir plus de 40% des effectifs valides (c’est-à-dire comptant au moins 3 femmes et 3 hommes) pour pouvoir
      calculer l'indicateur écart de rémunération. <br />
      <b className={cx(styles["text-orange"])}>
        Vous n'avez que {metadata.totalGroupCount} effectifs valides sur un effectif total de{" "}
        {metadata.totalEmployeeCount}, ce qui représente {validPourcentageRounded}%.
      </b>
    </i>
  );
}

export const Indicateur1Note = ({ computer, isValid, simple, noBorder }: Props) => {
  let computed: ComputedResult | null = null;
  let isNC = false;
  let advantageText = "";
  try {
    computed = computer.compute();
    if (computed.favorablePopulation === "equality") {
      advantageText = "Les femmes et les hommes sont à parité";
    } else {
      advantageText = "Un écart de rémunération ";
      if (computed.note === 40) {
        advantageText += "est ";
      }
      advantageText += `en faveur des ${computed.favorablePopulation === "women" ? "femmes" : "hommes"}`;
    }
    isNC = !computer.canCompute();
  } catch {
    // noop
  }

  const isNCText = getNCText(computer.getTotalMetadata());

  return (
    <ClientAnimate>
      {isNC && isValid ? (
        <IndicatorNote
          noBorder={noBorder}
          note="NC"
          size="small"
          text="L'indicateur écart de rémunération n'est pas calculable"
          legend={isNCText}
        />
      ) : (
        <>
          {!simple && (
            <IndicatorNote
              noBorder={noBorder}
              className={fr.cx("fr-mb-2w")}
              size="small"
              note={percentFormat.format((computed?.result ?? 0) / 100)}
              text="Écart global de rémunération en valeur absolue"
              legend="Arrondi à la première décimale"
            />
          )}
          <IndicatorNote
            noBorder={noBorder}
            note={isValid && computed ? computed.note : "-"}
            max={40}
            text="Nombre de points obtenus à l'indicateur écart de rémunération"
            legend={isValid ? advantageText : "Veuillez remplir le reste des rémunérations pour avoir votre note"}
          />
        </>
      )}
    </ClientAnimate>
  );
};
