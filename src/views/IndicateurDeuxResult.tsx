/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import { FormState } from "../globals.d";

import ResultBubble from "../components/ResultBubble";
import Action from "../components/Action";

interface Props {
  indicateurEcartAugmentation: number | undefined;
  noteIndicateurDeux: number | undefined;
  validateIndicateurDeux: (valid: FormState) => void;
}

function IndicateurDeuxResult({
  indicateurEcartAugmentation,
  noteIndicateurDeux,
  validateIndicateurDeux
}: Props) {
  const absoluteResult =
    indicateurEcartAugmentation !== undefined
      ? Math.abs(indicateurEcartAugmentation)
      : undefined;
  const genderFavoriteResult =
    indicateurEcartAugmentation !== undefined
      ? Math.sign(indicateurEcartAugmentation) < 0
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
          (noteIndicateurDeux !== undefined ? noteIndicateurDeux : "--") + "/20"
        }
        secondLineInfo="mesures de correction prises en compte"
      />

      <p css={styles.edit}>
        <Action onClick={() => validateIndicateurDeux("None")}>
          modifier les données saisies
        </Action>
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

export default IndicateurDeuxResult;
