/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Fragment } from "react";

import { FormState, TrancheEffectifs } from "../../globals";

import InfoBloc from "../../components/InfoBloc";
import { TextSimulatorLink } from "../../components/SimulatorLink";
import { useColumnsWidth, useLayoutType } from "../../components/GridContext";

interface Props {
  informationsFormValidated: FormState;
  trancheEffectifs: TrancheEffectifs;
  debutPeriodeReference: string;
  nombreSalaries: number | undefined;
}

function RecapitulatifInformations({
  informationsFormValidated,
  trancheEffectifs,
  debutPeriodeReference,
  nombreSalaries
}: Props) {
  const layoutType = useLayoutType();
  const width = useColumnsWidth(layoutType === "desktop" ? 6 : 7);

  if (informationsFormValidated !== "Valid") {
    return (
      <div css={styles.container}>
        <InfoBloc
          title="Informations"
          text={
            <Fragment>
              <span>
                Nous ne pouvons pas afficher les informations de votre
                entreprise car vous n’avez pas encore validé vos données
                saissies.
              </span>{" "}
              <TextSimulatorLink
                to="/informations"
                label="valider les données"
              />
            </Fragment>
          }
        />
      </div>
    );
  }

  return (
    <div css={[styles.container, css({ width })]}>
      <dl css={styles.dataDisplay}>
        <dt>Effectifs</dt>
        <dd>{nombreSalaries}</dd>

        <dt>Tranche de déclaration</dt>
        <dd>{trancheEffectifs}</dd>

        <dt>Date de début de période de référence</dt>
        <dd>{debutPeriodeReference}</dd>
      </dl>
    </div>
  );
}

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column",
    marginTop: 22,
    marginBottom: 22
  }),
  dataDisplay: css({
    dt: {
      fontWeight: "bold"
    },
    dd: {
      backgroundColor: "#fff",
      lineHeight: "2.5em",
      paddingLeft: "1em",
      marginBottom: 20,
      marginLeft: 0,
      marginTop: 5,
      borderRadius: 4
    }
  })
};

export default RecapitulatifInformations;
