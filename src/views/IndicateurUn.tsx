/** @jsx jsx */
import { jsx } from "@emotion/core";
import { RouteComponentProps, Route, Switch } from "react-router-dom";

import {
  TranchesAges,
  CategorieSocioPro,
  Groupe,
  GroupTranchesAges,
  ActionType,
  ActionIndicateurUnData
} from "../globals.d";

import {
  calculValiditeGroupeIndicateurUn,
  calculEffectifsValides,
  calculEcartRemunerationMoyenne,
  calculEcartApresApplicationSeuilPertinence,
  calculEcartPondere,
  calculTotalEcartPondere,
  calculIndicateurUnCalculable,
  calculIndicateurEcartRemuneration,
  calculNoteIndicateurUn
} from "../utils/calculsEgaPro";

import IndicateurUnStart from "./IndicateurUnStart";
import IndicateurUnForm from "./IndicateurUnForm";
import IndicateurUnResult from "./IndicateurUnResult";

interface Props extends RouteComponentProps {
  state: Array<Groupe>;
  dispatch: (action: ActionType) => void;
}

function IndicateurUn({ state, dispatch, match }: Props) {
  const updateIndicateurUn = (data: ActionIndicateurUnData) =>
    dispatch({ type: "updateIndicateurUn", data });

  const dataByRow = state.reduce(
    (acc: Array<GroupTranchesAges>, group) => acc.concat(group.tranchesAges),
    []
  );

  const computedDataByRow = dataByRow.map(
    ({
      nombreSalariesFemmes,
      nombreSalariesHommes,
      remunerationAnnuelleBrutFemmes,
      remunerationAnnuelleBrutHommes
    }: GroupTranchesAges) => {
      nombreSalariesFemmes = nombreSalariesFemmes || 0;
      nombreSalariesHommes = nombreSalariesHommes || 0;
      remunerationAnnuelleBrutFemmes = remunerationAnnuelleBrutFemmes || 0;
      remunerationAnnuelleBrutHommes = remunerationAnnuelleBrutHommes || 0;

      // VG
      const validiteGroupe = calculValiditeGroupeIndicateurUn(
        nombreSalariesFemmes,
        nombreSalariesHommes
      );
      // EV
      const effectifsValides = calculEffectifsValides(
        validiteGroupe,
        nombreSalariesFemmes,
        nombreSalariesHommes
      );
      // ERM
      const ecartRemunerationMoyenne = calculEcartRemunerationMoyenne(
        remunerationAnnuelleBrutFemmes,
        remunerationAnnuelleBrutHommes
      );
      // ESP
      const ecartApresApplicationSeuilPertinence = calculEcartApresApplicationSeuilPertinence(
        ecartRemunerationMoyenne
      );

      return {
        validiteGroupe,
        effectifsValides,
        ecartRemunerationMoyenne,
        ecartApresApplicationSeuilPertinence
      };
    }
  );

  const {
    totalNombreSalariesFemmes,
    totalNombreSalariesHommes
  } = dataByRow.reduce(
    (
      {
        totalNombreSalariesFemmes,
        totalNombreSalariesHommes,
        totalRemunerationAnnuelleBrutFemmes,
        totalRemunerationAnnuelleBrutHommes
      },
      {
        nombreSalariesFemmes,
        nombreSalariesHommes,
        remunerationAnnuelleBrutFemmes,
        remunerationAnnuelleBrutHommes
      }
    ) => {
      return {
        totalNombreSalariesFemmes:
          totalNombreSalariesFemmes + (nombreSalariesFemmes || 0),
        totalNombreSalariesHommes:
          totalNombreSalariesHommes + (nombreSalariesHommes || 0),
        totalRemunerationAnnuelleBrutFemmes:
          totalRemunerationAnnuelleBrutFemmes +
          (remunerationAnnuelleBrutFemmes || 0),
        totalRemunerationAnnuelleBrutHommes:
          totalRemunerationAnnuelleBrutHommes +
          (remunerationAnnuelleBrutHommes || 0)
      };
    },
    {
      totalNombreSalariesFemmes: 0, //TNBF
      totalNombreSalariesHommes: 0, //TNBH
      totalRemunerationAnnuelleBrutFemmes: 0,
      totalRemunerationAnnuelleBrutHommes: 0
    }
  );

  // TNB
  const totalNombreSalaries =
    totalNombreSalariesFemmes + totalNombreSalariesHommes;

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
        ecartApresApplicationSeuilPertinence
      }: {
        validiteGroupe: boolean;
        effectifsValides: number;
        ecartApresApplicationSeuilPertinence: number | undefined;
      }) => {
        // EP
        const ecartPondere = calculEcartPondere(
          validiteGroupe,
          ecartApresApplicationSeuilPertinence,
          effectifsValides,
          totalEffectifsValides
        );

        return ecartPondere;
      }
    );

  // TEP
  const totalEcartPondere = calculTotalEcartPondere(ecartsPonderesByRow);

  // IC
  const indicateurCalculable = calculIndicateurUnCalculable(
    totalNombreSalaries,
    totalEffectifsValides
  );

  // IER
  const indicateurEcartRemuneration = calculIndicateurEcartRemuneration(
    indicateurCalculable,
    totalEcartPondere
  );

  // NOTE
  const noteIndicateurUn = calculNoteIndicateurUn(indicateurEcartRemuneration);

  return (
    <Switch>
      <Route
        path={match.path}
        exact
        render={props => (
          <IndicateurUnStart
            {...props}
            nombreSalariesTotal={totalNombreSalaries}
            nombreSalariesGroupesValides={totalEffectifsValides}
            indicateurCalculable={indicateurCalculable}
          />
        )}
      />
      <Route
        path={`${match.path}/categorieSocioPro/:categorieSocioPro`}
        render={props => (
          <IndicateurUnForm
            {...props}
            key={props.match.params.categorieSocioPro}
            effectif={state[props.match.params.categorieSocioPro]}
            updateIndicateurUn={updateIndicateurUn}
          />
        )}
      />
      <Route
        path={`${match.path}/resultat`}
        render={props => (
          <IndicateurUnResult
            {...props}
            indicateurCalculable={indicateurCalculable}
            indicateurEcartRemuneration={indicateurEcartRemuneration}
            noteIndicateurUn={noteIndicateurUn}
          />
        )}
      />
    </Switch>
  );
}

export default IndicateurUn;
