/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import { FormState } from "../../globals.d";
import { displayPercent, displaySexeSurRepresente } from "../../utils/helpers";

import ResultBubble from "../../components/ResultBubble";
import ActionLink from "../../components/ActionLink";

interface Props {
  indicateurEcartPromotion: number | undefined;
  indicateurSexeSurRepresente: "hommes" | "femmes" | undefined;
  noteIndicateurTrois: number | undefined;
  correctionMeasure: boolean;
  validateIndicateurTrois: (valid: FormState) => void;
}

function IndicateurTroisResult({
  indicateurEcartPromotion,
  indicateurSexeSurRepresente,
  noteIndicateurTrois,
  correctionMeasure,
  validateIndicateurTrois
}: Props) {
  return (
    <div css={styles.container}>
      <ResultBubble
        firstLineLabel="votre résultat final est"
        firstLineData={
          indicateurEcartPromotion !== undefined
            ? displayPercent(indicateurEcartPromotion)
            : "--"
        }
        firstLineInfo={displaySexeSurRepresente(indicateurSexeSurRepresente)}
        secondLineLabel="votre note obtenue est"
        secondLineData={
          (noteIndicateurTrois !== undefined ? noteIndicateurTrois : "--") +
          "/15"
        }
        secondLineInfo={
          correctionMeasure
            ? "** mesures de correction prises en compte"
            : undefined
        }
        indicateurSexeSurRepresente={indicateurSexeSurRepresente}
      />

      <p css={styles.edit}>
        <ActionLink onClick={() => validateIndicateurTrois("None")}>
          modifier les données saisies
        </ActionLink>
      </p>
    </div>
  );
}

const styles = {
  container: css({
    maxWidth: 250,
    marginTop: 64
  }),
  edit: css({
    marginTop: 14,
    marginBottom: 14,
    textAlign: "center"
  })
};

export default IndicateurTroisResult;
