/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Fragment, ReactNode } from "react";

import { FormState, TrancheEffectifs } from "../../globals";

import InfoBloc from "../../components/InfoBloc";
import { TextSimulatorLink } from "../../components/SimulatorLink";
import { useColumnsWidth, useLayoutType } from "../../components/GridContext";

interface Props {
  informationsFormValidated: FormState;
  trancheEffectifs: TrancheEffectifs;
  anneeDeclaration: number | undefined;
  debutPeriodeReference: string;
  finPeriodeReference: string;
  nombreSalaries: number | undefined;
}

function RecapitulatifInformations({
  informationsFormValidated,
  trancheEffectifs,
  anneeDeclaration,
  debutPeriodeReference,
  finPeriodeReference,
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
      <DataDisplay
        header="Année au titre de laquelle les indicateurs sont calculés"
        data={anneeDeclaration}
      />

      <DataDisplay header="Periode de référence">
        <div css={styles.dates}>
          <div css={styles.dateField}>
            <DataDisplay header="Date de début" data={debutPeriodeReference} />
          </div>

          <div css={styles.dateField}>
            <DataDisplay header="Date de fin" data={finPeriodeReference} />
          </div>
        </div>
      </DataDisplay>

      <DataDisplay
        header="Tranche d'effectifs de l'entreprise ou de l'UES"
        data={trancheEffectifs}
      />

      <DataDisplay
        header="Nombre de salariés pris en compte pour le calcul de l'indicateur"
        data={nombreSalaries}
      />
    </div>
  );
}

interface DataDisplayProps {
  header: string;
  children?: ReactNode;
  data?: any;
}

function DataDisplay({ header, data, children }: DataDisplayProps) {
  return (
    <Fragment>
      <p css={styles.header}>{header}</p>
      {data ? <div css={styles.data}>{data}</div> : children}
    </Fragment>
  );
}

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column",
    marginTop: 22,
    marginBottom: 22
  }),
  header: css({
    fontWeight: "bold",
    marginTop: 5
  }),
  dates: css({
    display: "flex",
    justifyContent: "space-between"
  }),
  data: css({
    backgroundColor: "#fff",
    lineHeight: "2.5em",
    paddingLeft: "1em",
    marginBottom: 20,
    marginLeft: 0,
    marginTop: 5,
    borderRadius: 4
  }),
  dateField: css({ width: "40%" })
};

export default RecapitulatifInformations;
