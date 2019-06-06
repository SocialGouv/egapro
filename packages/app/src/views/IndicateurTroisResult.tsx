/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import { FormState } from "../globals.d";
import { displayPercent } from "../utils/helpers";

import ResultBubble from "../components/ResultBubble";
import ActionLink from "../components/ActionLink";

interface Props {
  indicateurEcartPromotion: number | undefined;
  indicateurSexeSurRepresente: "hommes" | "femmes" | undefined;
  noteIndicateurTrois: number | undefined;
  validateIndicateurTrois: (valid: FormState) => void;
}

function IndicateurTroisResult({
  indicateurEcartPromotion,
  indicateurSexeSurRepresente,
  noteIndicateurTrois,
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
        firstLineInfo={`écart favorable aux ${indicateurSexeSurRepresente}`}
        secondLineLabel="votre note obtenue est"
        secondLineData={
          (noteIndicateurTrois !== undefined ? noteIndicateurTrois : "--") +
          "/15"
        }
        secondLineInfo="mesures de correction prises en compte"
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
    textAlign: "center"
  })
};

export default IndicateurTroisResult;
