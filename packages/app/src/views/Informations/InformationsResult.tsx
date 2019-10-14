/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import { FormState } from "../../globals";

import ResultBubble from "../../components/ResultBubble";
import ActionLink from "../../components/ActionLink";

interface Props {
  nomEntreprise: string;
  trancheEffectifs: "50 à 249" | "250 à 999" | "1000 et plus";
  debutPeriodeReference: string;
  validateInformations: (valid: FormState) => void;
}

function InformationsResult({
  nomEntreprise,
  trancheEffectifs,
  debutPeriodeReference,
  validateInformations
}: Props) {
  return (
    <div css={styles.container}>
      <ResultBubble
        firstLineLabel="le nom de votre entreprise"
        firstLineData={nomEntreprise}
        firstLineInfo={`votre tranche d'effectifs: ${trancheEffectifs}`}
        secondLineLabel="votre période de référence est"
        secondLineData={debutPeriodeReference}
        indicateurSexeSurRepresente="hommes"
      />

      <p css={styles.edit}>
        <ActionLink onClick={() => validateInformations("None")}>
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

export default InformationsResult;
