/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import { FormState } from "../../globals.d";
import { displayPercent } from "../../utils/helpers";

import ResultBubble from "../../components/ResultBubble";
import ActionLink from "../../components/ActionLink";

interface Props {
  indicateurEcartAugmentationPromotion: number | undefined;
  indicateurEcartNombreEquivalentSalaries: number | undefined;
  indicateurSexeSurRepresente: "hommes" | "femmes" | undefined;
  noteIndicateurDeuxTrois: number | undefined;
  validateIndicateurDeuxTrois: (valid: FormState) => void;
}

function IndicateurDeuxTroisResult({
  indicateurEcartAugmentationPromotion,
  indicateurEcartNombreEquivalentSalaries,
  indicateurSexeSurRepresente,
  noteIndicateurDeuxTrois,
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
            : "--") + "/35"
        }
        secondLineInfo={
          indicateurEcartNombreEquivalentSalaries
            ? `écart en nombre équivalent salariés ${indicateurEcartNombreEquivalentSalaries}`
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
