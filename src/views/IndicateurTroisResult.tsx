/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import { FormState } from "../globals.d";

import ResultBubble from "../components/ResultBubble";
import ActionLink from "../components/ActionLink";

interface Props {
  indicateurEcartPromotion: number | undefined;
  noteIndicateurTrois: number | undefined;
  validateIndicateurTrois: (valid: FormState) => void;
}

function IndicateurTroisResult({
  indicateurEcartPromotion,
  noteIndicateurTrois,
  validateIndicateurTrois
}: Props) {
  const absoluteResult =
    indicateurEcartPromotion !== undefined
      ? Math.abs(indicateurEcartPromotion)
      : undefined;
  const genderFavoriteResult =
    indicateurEcartPromotion !== undefined
      ? Math.sign(indicateurEcartPromotion) < 0
        ? "femmes"
        : "hommes"
      : undefined;
  return (
    <div>
      <ResultBubble
        firstLineLabel="votre résultat final est"
        firstLineData={
          (absoluteResult !== undefined ? absoluteResult.toFixed(1) : "--") +
          " %"
        }
        firstLineInfo={`écart favorable aux ${genderFavoriteResult}`}
        secondLineLabel="votre note obtenue est"
        secondLineData={
          (noteIndicateurTrois !== undefined ? noteIndicateurTrois : "--") +
          "/15"
        }
        secondLineInfo="mesures de correction prises en compte"
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
  edit: css({
    marginTop: 14,
    textAlign: "center"
  })
};

export default IndicateurTroisResult;
