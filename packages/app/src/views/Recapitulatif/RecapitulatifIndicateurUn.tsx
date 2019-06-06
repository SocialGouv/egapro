/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Fragment } from "react";

import { FormState, TranchesAges, CategorieSocioPro } from "../../globals.d";

import {
  displayNameTranchesAges,
  displayNameCategorieSocioPro
} from "../../utils/helpers";

import TextLink from "../../components/TextLink";
import InfoBloc from "../../components/InfoBloc";
import RecapBloc from "./components/RecapBloc";

import RowData, { RowLabels, RowLabelFull } from "./components/RowData";

interface Props {
  indicateurUnFormValidated: FormState;
  effectifsIndicateurUnCalculable: boolean;
  effectifEtEcartRemuParTranche: Array<{
    ecartRemunerationMoyenne: number | undefined;
  }>;
  indicateurEcartRemuneration: number | undefined;
  indicateurSexeSurRepresente: "hommes" | "femmes" | undefined;
  noteIndicateurUn: number | undefined;
}

function RecapitulatifIndicateurUn({
  indicateurUnFormValidated,
  effectifsIndicateurUnCalculable,
  effectifEtEcartRemuParTranche,
  indicateurEcartRemuneration,
  indicateurSexeSurRepresente,
  noteIndicateurUn
}: Props) {
  if (!effectifsIndicateurUnCalculable) {
    return (
      <div css={styles.container}>
        <InfoBloc
          title="Indicateur 1, écart de rémunération entre les hommes et les femmes"
          text="Malheureusement votre indicateur n’est pas calculable car l’ensemble des groupes valables (c’est-à-dire comptant au moins 3 femmes et 3 hommes), représentent moins de 40% des effectifs."
        />
      </div>
    );
  }

  if (indicateurUnFormValidated !== "Valid") {
    return (
      <div css={styles.container}>
        <InfoBloc
          title="Indicateur 1, écart de rémunération entre les hommes et les femmes"
          text={
            <Fragment>
              <span>
                Nous ne pouvons pas calculer votre indicateur car vous n’avez
                pas encore validé vos données saissies.
              </span>{" "}
              <TextLink to="/indicateur1" label="valider les données" />
            </Fragment>
          }
        />
      </div>
    );
  }

  return (
    <div css={styles.container}>
      <RecapBloc
        title="Indicateur 1, écart de rémunération entre les hommes et les femmes"
        resultBubble={{
          firstLineLabel: "votre résultat final est",
          firstLineData:
            (indicateurEcartRemuneration !== undefined
              ? indicateurEcartRemuneration.toFixed(1)
              : "--") + " %",
          firstLineInfo: `écart favorable aux ${indicateurSexeSurRepresente}`,
          secondLineLabel: "votre note obtenue est",
          secondLineData:
            (noteIndicateurUn !== undefined ? noteIndicateurUn : "--") + "/40",
          secondLineInfo: "mesures de correction prises en compte",
          indicateurSexeSurRepresente
        }}
      >
        <RowLabelFull label="écart de rémunération par csp" />
        <RowLabels
          labels={[
            displayNameTranchesAges(TranchesAges.MoinsDe30ans),
            displayNameTranchesAges(TranchesAges.De30a39ans),
            displayNameTranchesAges(TranchesAges.De40a49ans),
            displayNameTranchesAges(TranchesAges.PlusDe50ans)
          ]}
        />

        <RowData
          name={displayNameCategorieSocioPro(CategorieSocioPro.Ouvriers)}
          data={[
            effectifEtEcartRemuParTranche[0].ecartRemunerationMoyenne,
            effectifEtEcartRemuParTranche[1].ecartRemunerationMoyenne,
            effectifEtEcartRemuParTranche[2].ecartRemunerationMoyenne,
            effectifEtEcartRemuParTranche[3].ecartRemunerationMoyenne
          ]}
        />
        <RowData
          name={displayNameCategorieSocioPro(CategorieSocioPro.Employes)}
          data={[
            effectifEtEcartRemuParTranche[4].ecartRemunerationMoyenne,
            effectifEtEcartRemuParTranche[5].ecartRemunerationMoyenne,
            effectifEtEcartRemuParTranche[6].ecartRemunerationMoyenne,
            effectifEtEcartRemuParTranche[7].ecartRemunerationMoyenne
          ]}
        />
        <RowData
          name={displayNameCategorieSocioPro(CategorieSocioPro.Techniciens)}
          data={[
            effectifEtEcartRemuParTranche[8].ecartRemunerationMoyenne,
            effectifEtEcartRemuParTranche[9].ecartRemunerationMoyenne,
            effectifEtEcartRemuParTranche[10].ecartRemunerationMoyenne,
            effectifEtEcartRemuParTranche[11].ecartRemunerationMoyenne
          ]}
        />
        <RowData
          name={displayNameCategorieSocioPro(CategorieSocioPro.Cadres)}
          data={[
            effectifEtEcartRemuParTranche[12].ecartRemunerationMoyenne,
            effectifEtEcartRemuParTranche[13].ecartRemunerationMoyenne,
            effectifEtEcartRemuParTranche[14].ecartRemunerationMoyenne,
            effectifEtEcartRemuParTranche[15].ecartRemunerationMoyenne
          ]}
        />
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

export default RecapitulatifIndicateurUn;
