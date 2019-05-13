/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import { FormState } from "../globals.d";

import ResultBubble from "../components/ResultBubble";
import ActionLink from "../components/ActionLink";

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
        <ActionLink onClick={() => validateIndicateurDeux("None")}>
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

export default IndicateurDeuxResult;
