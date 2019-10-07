/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import { FormState } from "../../globals.d";
import { displayPercent } from "../../utils/helpers";

import ResultBubble from "../../components/ResultBubble";
import ActionLink from "../../components/ActionLink";

interface Props {
  indicateurEcartAugmentationPromotion: number | undefined;
  indicateurSexeSurRepresente: "hommes" | "femmes" | undefined;
  noteIndicateurDeuxTrois: number | undefined;
  correctionMeasure: boolean;
  validateIndicateurDeuxTrois: (valid: FormState) => void;
}

function IndicateurDeuxTroisResult({
  indicateurEcartAugmentationPromotion,
  indicateurSexeSurRepresente,
  noteIndicateurDeuxTrois,
  correctionMeasure,
  validateIndicateurDeuxTrois
}: Props) {
  return (
    <div css={styles.container}>
      <ResultBubble
        firstLineLabel="votre résultat final est"
        firstLineData={
          indicateurEcartAugmentationPromotion !== undefined
            ? displayPercent(indicateurEcartAugmentationPromotion)
            : "--"
        }
        firstLineInfo={`écart favorable aux ${indicateurSexeSurRepresente}`}
        secondLineLabel="votre note obtenue est"
        secondLineData={
          (noteIndicateurDeuxTrois !== undefined
            ? noteIndicateurDeuxTrois
            : "--") + "/15"
        }
        secondLineInfo={
          correctionMeasure
            ? "mesures de correction prises en compte"
            : undefined
        }
        indicateurSexeSurRepresente={indicateurSexeSurRepresente}
      />

      <p css={styles.edit}>
        <ActionLink onClick={() => validateIndicateurDeuxTrois("None")}>
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

export default IndicateurDeuxTroisResult;
