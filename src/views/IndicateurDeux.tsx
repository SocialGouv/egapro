/** @jsx jsx */
import { jsx } from "@emotion/core";
import { RouteComponentProps, Route, Switch } from "react-router-dom";

import {
  TranchesAges,
  CategorieSocioPro,
  Groupe,
  GroupTranchesAges,
  ActionType
} from "../globals.d";

import {
  calculValiditeGroupeIndicateurDeux,
  calculEffectifsValides,
  calculEcartTauxAugmentation,
  calculEcartPondere,
  calculTotalEcartPondere,
  calculIndicateurDeuxCalculable,
  calculIndicateurEcartAugmentation,
  calculNoteIndicateurDeux
} from "../utils/calculsEgaPro";

import IndicateurDeuxStart from "./IndicateurDeuxStart";
// import IndicateurDeuxForm from "./IndicateurDeuxForm";
// import IndicateurDeuxResult from "./IndicateurDeuxResult";

interface Props extends RouteComponentProps {
  state: Array<Groupe>;
  dispatch: (action: ActionType) => void;
}

function IndicateurDeux({ state, dispatch, match }: Props) {
  const updateIndicateurDeux = (group: Groupe) =>
    dispatch({ type: "updateIndicateurDeux", group });

  const computedDataByRow = state.map(
    ({
      tranchesAges,
      tauxAugmentationFemmes,
      tauxAugmentationHommes
    }: Groupe) => {
      tauxAugmentationFemmes = tauxAugmentationFemmes || 0;
      tauxAugmentationHommes = tauxAugmentationHommes || 0;

      const {
        nombreSalariesFemmesGroupe,
        nombreSalariesHommesGroupe
      } = tranchesAges.reduce(
        (
          { nombreSalariesFemmesGroupe, nombreSalariesHommesGroupe },
          { nombreSalariesFemmes, nombreSalariesHommes }
        ) => ({
          nombreSalariesFemmesGroupe:
            nombreSalariesFemmesGroupe + (nombreSalariesFemmes || 0),
          nombreSalariesHommesGroupe:
            nombreSalariesHommesGroupe + (nombreSalariesHommes || 0)
        }),
        { nombreSalariesFemmesGroupe: 0, nombreSalariesHommesGroupe: 0 }
      );

      // VG
      const validiteGroupe = calculValiditeGroupeIndicateurDeux(
        nombreSalariesFemmesGroupe,
        nombreSalariesHommesGroupe
      );
      // EV
      const effectifsValides = calculEffectifsValides(
        validiteGroupe,
        nombreSalariesFemmesGroupe,
        nombreSalariesHommesGroupe
      );
      // ETA
      const ecartTauxAugmentation = calculEcartTauxAugmentation(
        tauxAugmentationFemmes,
        tauxAugmentationHommes
      );

      return {
        nombreSalariesFemmesGroupe,
        nombreSalariesHommesGroupe,
        validiteGroupe,
        effectifsValides,
        tauxAugmentationFemmes,
        tauxAugmentationHommes,
        ecartTauxAugmentation
      };
    }
  );

  const {
    totalNombreSalariesFemmes,
    totalNombreSalariesHommes,
    sommeProduitTauxAugmentationFemmes,
    sommeProduitTauxAugmentationHommes
  } = computedDataByRow.reduce(
    (
      {
        totalNombreSalariesFemmes,
        totalNombreSalariesHommes,
        sommeProduitTauxAugmentationFemmes,
        sommeProduitTauxAugmentationHommes
      },
      {
        nombreSalariesFemmesGroupe,
        nombreSalariesHommesGroupe,
        tauxAugmentationFemmes,
        tauxAugmentationHommes
      }
    ) => {
      return {
        totalNombreSalariesFemmes:
          totalNombreSalariesFemmes + nombreSalariesFemmesGroupe,
        totalNombreSalariesHommes:
          totalNombreSalariesHommes + nombreSalariesHommesGroupe,
        sommeProduitTauxAugmentationFemmes:
          sommeProduitTauxAugmentationFemmes +
          (tauxAugmentationFemmes || 0) * nombreSalariesFemmesGroupe,
        sommeProduitTauxAugmentationHommes:
          sommeProduitTauxAugmentationHommes +
          (tauxAugmentationHommes || 0) * nombreSalariesHommesGroupe
      };
    },
    {
      totalNombreSalariesFemmes: 0, //TNBF
      totalNombreSalariesHommes: 0, //TNBH
      sommeProduitTauxAugmentationFemmes: 0,
      sommeProduitTauxAugmentationHommes: 0
    }
  );

  // TNB
  const totalNombreSalaries =
    totalNombreSalariesFemmes + totalNombreSalariesHommes;

  // TTAF
  const totalTauxAugmentationFemmes =
    sommeProduitTauxAugmentationFemmes / totalNombreSalariesFemmes;

  // TTAH
  const totalTauxAugmentationHommes =
    sommeProduitTauxAugmentationHommes / totalNombreSalariesHommes;

  // TEV
  const totalEffectifsValides = computedDataByRow.reduce(
    (acc, { effectifsValides }) => acc + effectifsValides,
    0
  );

  const ecartsPonderesByRow = computedDataByRow
    .filter(({ validiteGroupe }: { validiteGroupe: boolean }) => validiteGroupe)
    .map(
      ({
        validiteGroupe,
        effectifsValides,
        ecartTauxAugmentation
      }: {
        validiteGroupe: boolean;
        effectifsValides: number;
        ecartTauxAugmentation: number | undefined;
      }) => {
        // EP
        const ecartPondere = calculEcartPondere(
          validiteGroupe,
          ecartTauxAugmentation,
          effectifsValides,
          totalEffectifsValides
        );

        return ecartPondere;
      }
    );

  // TEP
  const totalEcartPondere = calculTotalEcartPondere(ecartsPonderesByRow);

  // IC
  const indicateurCalculable = calculIndicateurDeuxCalculable(
    totalNombreSalaries,
    totalEffectifsValides,
    totalTauxAugmentationFemmes,
    totalTauxAugmentationHommes
  );

  // IEA
  const indicateurEcartAugmentation = calculIndicateurEcartAugmentation(
    indicateurCalculable,
    totalEcartPondere
  );

  // NOTE
  const noteIndicateurDeux = calculNoteIndicateurDeux(
    indicateurEcartAugmentation
  );

  return (
    <Switch>
      <Route
        path={match.path}
        exact
        render={props => (
          <IndicateurDeuxStart
            {...props}
            nombreSalariesTotal={totalNombreSalaries}
            nombreSalariesGroupesValides={totalEffectifsValides}
            indicateurCalculable={indicateurCalculable}
          />
        )}
      />
      {/* <Route
        path={`${match.path}/categorieSocioPro/:categorieSocioPro`}
        render={props => (
          <IndicateurDeuxForm
            {...props}
            key={props.match.params.categorieSocioPro}
            effectif={state[props.match.params.categorieSocioPro]}
            updateIndicateurDeux={updateIndicateurDeux}
          />
        )}
      />
      <Route
        path={`${match.path}/resultat`}
        render={props => (
          <IndicateurDeuxResult
            {...props}
            indicateurCalculable={indicateurCalculable}
            indicateurEcartAugmentation={indicateurEcartAugmentation}
            noteIndicateurDeux={noteIndicateurDeux}
          />
        )}
      /> */}
    </Switch>
  );
}

export default IndicateurDeux;
