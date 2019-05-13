/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import { FormState } from "../globals.d";

import ResultBubble from "../components/ResultBubble";
import Action from "../components/Action";

interface Props {
  indicateurEcartRemuneration: number | undefined;
  noteIndicateurUn: number | undefined;
  validateIndicateurUn: (valid: FormState) => void;
}

function IndicateurUnResult({
  indicateurEcartRemuneration,
  noteIndicateurUn,
  validateIndicateurUn
}: Props) {
  const absoluteResult =
    indicateurEcartRemuneration !== undefined
      ? Math.abs(indicateurEcartRemuneration)
      : undefined;
  const genderFavoriteResult =
    indicateurEcartRemuneration !== undefined
      ? Math.sign(indicateurEcartRemuneration) < 0
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
          (noteIndicateurUn !== undefined ? noteIndicateurUn : "--") + "/40"
        }
        secondLineInfo="mesures de correction prises en compte"
      />

      <p css={styles.edit}>
        <Action onClick={() => validateIndicateurUn("None")}>
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

export default IndicateurUnResult;
