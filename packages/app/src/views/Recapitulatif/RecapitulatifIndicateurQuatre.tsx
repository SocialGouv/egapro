/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Fragment } from "react";

import { FormState } from "../../globals.d";

import InfoBloc from "../../components/InfoBloc";
import RecapBloc from "./components/RecapBloc";
import { TextSimulatorLink } from "../../components/SimulatorLink";

interface Props {
  indicateurQuatreFormValidated: FormState;
  indicateurQuatreCalculable: boolean;
  indicateurEcartNombreSalarieesAugmentees: number | undefined;
  noteIndicateurQuatre: number | undefined;
}

function RecapitulatifIndicateurQuatre({
  indicateurQuatreFormValidated,
  indicateurQuatreCalculable,
  indicateurEcartNombreSalarieesAugmentees,
  noteIndicateurQuatre
}: Props) {
  if (indicateurQuatreFormValidated !== "Valid") {
    return (
      <div css={styles.container}>
        <InfoBloc
          title="Indicateur 4, pourcentage de salariées augmentées dans l'année suivant leur retour de congé maternité"
          text={
            <Fragment>
              <span>
                Nous ne pouvons pas calculer votre indicateur car vous n’avez
                pas encore validé vos données saissies.
              </span>{" "}
              <TextSimulatorLink
                to="/indicateur4"
                label="valider les données"
              />
            </Fragment>
          }
        />
      </div>
    );
  }

  if (!indicateurQuatreCalculable) {
    return (
      <div css={styles.container}>
        <InfoBloc
          title="Indicateur 4, pourcentage de salariées augmentées dans l'année suivant leur retour de congé maternité"
          text="Malheureusement votre indicateur n’est pas calculable  car il n’y a pas eu de retour de congé maternité durant la période de référence"
        />
      </div>
    );
  }

  return (
    <div css={styles.container}>
      <RecapBloc
        title="Indicateur 4, pourcentage de salariées augmentées dans l'année suivant leur retour de congé maternité"
        resultBubble={{
          firstLineLabel: "votre résultat final est",
          firstLineData:
            (indicateurEcartNombreSalarieesAugmentees !== undefined
              ? indicateurEcartNombreSalarieesAugmentees.toFixed(1)
              : "--") + " %",
          secondLineLabel: "votre note obtenue est",
          secondLineData:
            (noteIndicateurQuatre !== undefined ? noteIndicateurQuatre : "--") +
            "/15",
          indicateurSexeSurRepresente: "femmes"
        }}
      >
        {null}
      </RecapBloc>
    </div>
  );
}

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column",
    marginTop: 22,
    marginBottom: 22
  })
};

export default RecapitulatifIndicateurQuatre;
