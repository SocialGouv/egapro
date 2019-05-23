/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import { FormState } from "../globals.d";

import ResultBubble from "../components/ResultBubble";
import ActionLink from "../components/ActionLink";

interface Props {
  indicateurEcartNombreSalarieesAugmentees: number | undefined;
  noteIndicateurQuatre: number | undefined;
  validateIndicateurQuatre: (valid: FormState) => void;
}

function IndicateurQuatreResult({
  indicateurEcartNombreSalarieesAugmentees,
  noteIndicateurQuatre,
  validateIndicateurQuatre
}: Props) {
  return (
    <div css={styles.container}>
      <ResultBubble
        firstLineLabel="votre résultat final est"
        firstLineData={
          (indicateurEcartNombreSalarieesAugmentees !== undefined
            ? indicateurEcartNombreSalarieesAugmentees.toFixed(1)
            : "--") + " %"
        }
        secondLineLabel="votre note obtenue est"
        secondLineData={
          (noteIndicateurQuatre !== undefined ? noteIndicateurQuatre : "--") +
          "/15"
        }
      />

      <p css={styles.edit}>
        <ActionLink onClick={() => validateIndicateurQuatre("None")}>
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

export default IndicateurQuatreResult;
