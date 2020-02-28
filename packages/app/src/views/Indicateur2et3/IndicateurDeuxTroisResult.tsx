/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import { FormState } from "../../globals";
import { displaySexeSurRepresente } from "../../utils/helpers";
import { Result } from "./IndicateurDeuxTrois";

import ResultBubble from "../../components/ResultBubble";
import ActionLink from "../../components/ActionLink";

interface Props {
  bestResult: Result;
  indicateurSexeSurRepresente: "hommes" | "femmes" | undefined;
  noteIndicateurDeuxTrois: number | undefined;
  correctionMeasure: boolean;
  validateIndicateurDeuxTrois: (valid: FormState) => void;
}

function IndicateurDeuxTroisResult({
  bestResult,
  indicateurSexeSurRepresente,
  noteIndicateurDeuxTrois,
  correctionMeasure,
  validateIndicateurDeuxTrois
}: Props) {
  return (
    <div css={styles.container}>
      <ResultBubble
        firstLineLabel={bestResult.label}
        firstLineData={bestResult.result}
        firstLineInfo={displaySexeSurRepresente(indicateurSexeSurRepresente)}
        secondLineLabel="votre note obtenue est"
        secondLineData={
          (noteIndicateurDeuxTrois !== undefined
            ? noteIndicateurDeuxTrois
            : "--") + "/35"
        }
        secondLineInfo={
          correctionMeasure
            ? "** mesures de correction prises en compte"
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
