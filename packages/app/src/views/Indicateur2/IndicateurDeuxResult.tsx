/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import { FormState } from "../../globals.d";

import { displayPercent, displaySexeSurRepresente } from "../../utils/helpers";

import ResultBubble from "../../components/ResultBubble";
import ActionLink from "../../components/ActionLink";

interface Props {
  indicateurEcartAugmentation: number | undefined;
  indicateurSexeSurRepresente: "hommes" | "femmes" | undefined;
  noteIndicateurDeux: number | undefined;
  correctionMeasure: boolean;
  validateIndicateurDeux: (valid: FormState) => void;
}

function IndicateurDeuxResult({
  indicateurEcartAugmentation,
  indicateurSexeSurRepresente,
  noteIndicateurDeux,
  correctionMeasure,
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
        firstLineInfo={displaySexeSurRepresente(indicateurSexeSurRepresente)}
        secondLineLabel="votre note obtenue est"
        secondLineData={
          (noteIndicateurDeux !== undefined ? noteIndicateurDeux : "--") + "/20"
        }
        secondLineInfo={
          correctionMeasure
            ? "mesures de correction prises en compte"
            : undefined
        }
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
    marginBottom: 14,
    textAlign: "center"
  })
};

export default IndicateurDeuxResult;
