/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Fragment } from "react";

import { FormState, CategorieSocioPro } from "../../globals.d";

import { displayNameCategorieSocioPro } from "../../utils/helpers";

import InfoBloc from "../../components/InfoBloc";
import RecapBloc from "./components/RecapBloc";
import { TextSimulatorLink } from "../../components/SimulatorLink";

import { RowDataFull, RowLabelFull } from "./components/RowData";

interface Props {
  indicateurDeuxFormValidated: FormState;
  effectifsIndicateurDeuxCalculable: boolean;
  indicateurDeuxCalculable: boolean;
  effectifEtEcartAugmentParGroupe: Array<{
    categorieSocioPro: CategorieSocioPro;
    ecartTauxAugmentation: number | undefined;
  }>;
  indicateurEcartAugmentation: number | undefined;
  indicateurSexeSurRepresente: "hommes" | "femmes" | undefined;
  noteIndicateurDeux: number | undefined;
}

function RecapitulatifIndicateurDeux({
  indicateurDeuxFormValidated,
  effectifsIndicateurDeuxCalculable,
  indicateurDeuxCalculable,
  effectifEtEcartAugmentParGroupe,
  indicateurEcartAugmentation,
  indicateurSexeSurRepresente,
  noteIndicateurDeux
}: Props) {
  if (!effectifsIndicateurDeuxCalculable) {
    return (
      <div css={styles.container}>
        <InfoBloc
          title="Indicateur 2, écart de taux d’augmentation entre les hommes et les femmes"
          text="Malheureusement votre indicateur n’est pas calculable car l’ensemble des groupes valables (c’est-à-dire comptant au moins 10 femmes et 10 hommes), représentent moins de 40% des effectifs."
        />
      </div>
    );
  }

  if (indicateurDeuxFormValidated !== "Valid") {
    return (
      <div css={styles.container}>
        <InfoBloc
          title="Indicateur 2, écart de taux d’augmentation entre les hommes et les femmes"
          text={
            <Fragment>
              <span>
                Nous ne pouvons pas calculer votre indicateur car vous n’avez
                pas encore validé vos données saissies.
              </span>{" "}
              <TextSimulatorLink
                to="/indicateur2"
                label="valider les données"
              />
            </Fragment>
          }
        />
      </div>
    );
  }

  if (!indicateurDeuxCalculable) {
    return (
      <div css={styles.container}>
        <InfoBloc
          title="Indicateur 2, écart de taux d’augmentation entre les hommes et les femmes"
          text="Malheureusement votre indicateur n’est pas calculable  car il n’y a pas eu d’augmentation durant la période de référence"
        />
      </div>
    );
  }

  return (
    <div css={styles.container}>
      <RecapBloc
        title="Indicateur 2, écart de taux d’augmentation entre les hommes et les femmes"
        resultBubble={{
          firstLineLabel: "votre résultat final est",
          firstLineData:
            (indicateurEcartAugmentation !== undefined
              ? indicateurEcartAugmentation.toFixed(1)
              : "--") + " %",
          firstLineInfo: `écart favorable aux ${indicateurSexeSurRepresente}`,
          secondLineLabel: "votre note obtenue est",
          secondLineData:
            (noteIndicateurDeux !== undefined ? noteIndicateurDeux : "--") +
            "/20",
          secondLineInfo: "mesures de correction prises en compte",
          indicateurSexeSurRepresente
        }}
      >
        <RowLabelFull label="écart de taux d’augmentation par csp" />

        {effectifEtEcartAugmentParGroupe.map(
          ({ categorieSocioPro, ecartTauxAugmentation }) => (
            <RowDataFull
              key={categorieSocioPro}
              name={displayNameCategorieSocioPro(categorieSocioPro)}
              data={ecartTauxAugmentation}
            />
          )
        )}
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

export default RecapitulatifIndicateurDeux;
