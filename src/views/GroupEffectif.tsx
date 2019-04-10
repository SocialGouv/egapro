/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import React from "react";

import { TranchesAges, Groupe, GroupTranchesAges } from "../globals.d";
import useField, { stateFieldType } from "../hooks/useField";
import RowTrancheAge from "../components/RowTrancheAge";

import { displayNameCategorieSocioPro } from "../utils/helpers";
import mapEnum from "../utils/mapEnum";

interface Props {
  effectif: Groupe;
  updateEffectif: (group: Groupe) => void;
}

interface GroupeTrancheAgeFields {
  trancheAge: TranchesAges;
  nbSalarieFemmeField: stateFieldType;
  nbSalarieHommeField: stateFieldType;
}

function GroupEffectif({ effectif, updateEffectif }: Props) {
  const allFields: Array<GroupeTrancheAgeFields> = mapEnum(
    TranchesAges,
    (trancheAge: TranchesAges) => {
      return {
        trancheAge,
        nbSalarieFemmeField: useField("nombreSalariesFemmes" + trancheAge),
        nbSalarieHommeField: useField("nombreSalariesHommes" + trancheAge)
      };
    }
  );

  const saveGroup = () => {
    const newGroup: Groupe = {
      ...effectif,
      tranchesAges: effectif.tranchesAges.map(
        (groupTranchesAges: GroupTranchesAges) => {
          const fields = allFields.find(
            fields => fields.trancheAge === groupTranchesAges.trancheAge
          );
          if (!fields) {
            return groupTranchesAges;
          }
          return {
            ...groupTranchesAges,
            nombreSalariesFemmes: parseInt(
              fields.nbSalarieFemmeField.input.value,
              10
            ),
            nombreSalariesHommes: parseInt(
              fields.nbSalarieHommeField.input.value,
              10
            )
          };
        }
      )
    };
    updateEffectif(newGroup);
  };

  // const nbSalarieFemmeField = useField("nombreSalariesFemmes");
  // const nbSalarieHommeField = useField("nombreSalariesHommes");

  // const vg =
  //   nbSalarieFemmeField.meta.valueNumber >= 3 &&
  //   nbSalarieHommeField.meta.valueNumber >= 3;

  // const ev =
  //   nbSalarieFemmeField.meta.valueNumber + nbSalarieHommeField.meta.valueNumber;

  return (
    <div>
      <div css={styles.bloc}>
        <p css={styles.blocTitle}>
          Nombre de salarié -{" "}
          {displayNameCategorieSocioPro(effectif.categorieSocioPro)}
        </p>

        <div css={styles.row}>
          <div css={styles.cellHead}>tranche d'âge</div>
          <div css={styles.cell}>femmes</div>
          <div css={styles.cell}>hommes</div>
        </div>

        {allFields.map(
          ({
            trancheAge,
            nbSalarieFemmeField,
            nbSalarieHommeField
          }: GroupeTrancheAgeFields) => {
            return (
              <RowTrancheAge
                key={trancheAge}
                trancheAge={trancheAge}
                nbSalarieFemmeField={nbSalarieFemmeField}
                nbSalarieHommeField={nbSalarieHommeField}
              />
            );
          }
        )}

        <div onClick={saveGroup}>Valider</div>

        {/* {nbSalarieFemmeField.meta.touched && nbSalarieHommeField.meta.touched && (
          <React.Fragment>
            <div css={styles.message}>
              {vg ? (
                <p>Effectif valide de {ev} personnes</p>
              ) : (
                <p>
                  Groupe invalide car il ne contient pas suffisament de
                  personnes (au moins 3 femmes et 3 hommes)
                </p>
              )}
            </div>
          </React.Fragment>
        )} */}
      </div>
    </div>
  );
}

const styles = {
  bloc: css({
    display: "flex",
    flexDirection: "column",
    maxWidth: 800,
    padding: "12px 24px",
    margin: "24px auto",
    backgroundColor: "white",
    borderRadius: 6,
    boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.12)"
  }),
  blocTitle: css({
    fontSize: 24,
    paddingTop: 6,
    paddingBottom: 24,
    color: "#353535",
    textAlign: "center"
  }),
  row: css({
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 24
  }),
  cellHead: css({
    flexGrow: 1,
    flexBasis: "0%",
    textAlign: "right",
    fontWeight: "bold"
  }),
  cell: css({
    flexGrow: 2,
    flexBasis: "0%",
    marginLeft: 24,
    textAlign: "center",
    fontWeight: "bold"
  }),
  message: css({
    fontSize: 26,
    fontWeight: 200,
    textAlign: "center",
    marginBottom: 32,
    marginTop: 12
  })
};

export default GroupEffectif;
