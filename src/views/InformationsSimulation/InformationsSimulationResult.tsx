/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import { FormState, TrancheEffectifs } from "../../globals";

import ResultBubble from "../../components/ResultBubble";
import ActionLink from "../../components/ActionLink";

interface Props {
  nomEntreprise: string;
  trancheEffectifs: TrancheEffectifs;
  debutPeriodeReference: string;
  finPeriodeReference: string;
  validateInformationsSimulation: (valid: FormState) => void;
}

function InformationsSimulationResult({
  nomEntreprise,
  trancheEffectifs,
  debutPeriodeReference,
  finPeriodeReference,
  validateInformationsSimulation
}: Props) {
  return (
    <div css={styles.container}>
      <ResultBubble
        firstLineLabel="le nom de votre entreprise"
        firstLineData={nomEntreprise}
        firstLineInfo={`votre tranche d'effectifs: ${trancheEffectifs}`}
        secondLineLabel="votre période de référence est"
        secondLineData={`${debutPeriodeReference} au ${finPeriodeReference}`}
        indicateurSexeSurRepresente="hommes"
      />

      <p css={styles.edit}>
        <ActionLink onClick={() => validateInformationsSimulation("None")}>
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

export default InformationsSimulationResult;
