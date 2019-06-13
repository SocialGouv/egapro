/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import { FormState } from "../../globals.d";

import { displayPercent } from "../../utils/helpers";

import ResultBubble from "../../components/ResultBubble";
import ActionLink from "../../components/ActionLink";

interface Props {
  indicateurEcartAugmentation: number | undefined;
  indicateurSexeSurRepresente: "hommes" | "femmes" | undefined;
  noteIndicateurDeux: number | undefined;
  validateIndicateurDeux: (valid: FormState) => void;
}

function IndicateurDeuxResult({
  indicateurEcartAugmentation,
  indicateurSexeSurRepresente,
  noteIndicateurDeux,
  validateIndicateurDeux
}: Props) {
  return (
    <div css={styles.container}>
      <ResultBubble
        firstLineLabel="votre résultat final est"
        firstLineData={
          indicateurEcartAugmentation !== undefined
            ? displayPercent(indicateurEcartAugmentation)
            : "--"
        }
        firstLineInfo={`écart favorable aux ${indicateurSexeSurRepresente}`}
        secondLineLabel="votre note obtenue est"
        secondLineData={
          (noteIndicateurDeux !== undefined ? noteIndicateurDeux : "--") + "/20"
        }
        secondLineInfo="mesures de correction prises en compte"
        indicateurSexeSurRepresente={indicateurSexeSurRepresente}
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
  container: css({
    maxWidth: 250,
    marginTop: 64
  }),
  edit: css({
    marginTop: 14,
    textAlign: "center"
  })
};

export default IndicateurDeuxResult;
