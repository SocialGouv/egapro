/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { RouteComponentProps } from "react-router-dom";
import {
  TranchesAges,
  Groupe,
  GroupTranchesAges,
  ActionIndicateurUnData
} from "../globals.d";

import useField, { stateFieldType } from "../hooks/useField";
import RowFemmesHommes from "../components/RowFemmesHommes";
import Button from "../components/Button";
import {
  displayNameCategorieSocioPro,
  displayNameTranchesAges
} from "../utils/helpers";

interface Props extends RouteComponentProps {
  effectif: Groupe;
  updateIndicateurUn: (data: ActionIndicateurUnData) => void;
}

interface GroupeTrancheAgeFields {
  trancheAge: TranchesAges;
  calculable: boolean;
  remunerationAnnuelleBrutFemmesField: stateFieldType;
  remunerationAnnuelleBrutHommesField: stateFieldType;
}

function IndicateurUnForm({ effectif, updateIndicateurUn, history }: Props) {
  const allFields: Array<GroupeTrancheAgeFields> = effectif.tranchesAges.map(
    ({
      trancheAge,
      nombreSalariesFemmes,
      nombreSalariesHommes,
      remunerationAnnuelleBrutFemmes,
      remunerationAnnuelleBrutHommes
    }: GroupTranchesAges) => {
      return {
        trancheAge,
        calculable:
          (nombreSalariesFemmes || 0) >= 3 && (nombreSalariesHommes || 0) >= 3,
        remunerationAnnuelleBrutFemmesField: useField(
          "remunerationAnnuelleBrutFemmes" + trancheAge,
          remunerationAnnuelleBrutFemmes === undefined
            ? ""
            : String(remunerationAnnuelleBrutFemmes)
        ),
        remunerationAnnuelleBrutHommesField: useField(
          "remunerationAnnuelleBrutHommes" + trancheAge,
          remunerationAnnuelleBrutHommes === undefined
            ? ""
            : String(remunerationAnnuelleBrutHommes)
        )
      };
    }
  );

  const saveGroup = () => {
    const data: ActionIndicateurUnData = {
      categorieSocioPro: effectif.categorieSocioPro,
      tranchesAges: allFields.map(
        ({
          trancheAge,
          remunerationAnnuelleBrutFemmesField,
          remunerationAnnuelleBrutHommesField
        }) => ({
          trancheAge,
          remunerationAnnuelleBrutFemmes:
            remunerationAnnuelleBrutFemmesField.input.value === ""
              ? undefined
              : parseInt(remunerationAnnuelleBrutFemmesField.input.value, 10),
          remunerationAnnuelleBrutHommes:
            remunerationAnnuelleBrutHommesField.input.value === ""
              ? undefined
              : parseInt(remunerationAnnuelleBrutHommesField.input.value, 10)
        })
      )
    };
    updateIndicateurUn(data);

    const nextRoute =
      "/indicateur1" +
      (effectif.categorieSocioPro < 3
        ? `/categorieSocioPro/${effectif.categorieSocioPro + 1}`
        : "/resultat");
    history.push(nextRoute);
  };

  return (
    <div>
      <div css={styles.bloc}>
        <p css={styles.blocTitle}>
          Rémunération annuelle brute moyenne -{" "}
          {displayNameCategorieSocioPro(effectif.categorieSocioPro)}
        </p>

        <div css={styles.row}>
          <div css={styles.cellHead}>rémunération</div>
          <div css={styles.cell}>femmes</div>
          <div css={styles.cell}>hommes</div>
        </div>

        {allFields.map(
          ({
            trancheAge,
            calculable,
            remunerationAnnuelleBrutFemmesField,
            remunerationAnnuelleBrutHommesField
          }: GroupeTrancheAgeFields) => {
            return (
              <RowFemmesHommes
                key={trancheAge}
                name={displayNameTranchesAges(trancheAge)}
                calculable={calculable}
                femmesField={remunerationAnnuelleBrutFemmesField}
                hommesField={remunerationAnnuelleBrutHommesField}
              />
            );
          }
        )}

        <Button onClick={saveGroup} label="Valider" />
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
    color: "#353535"
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

export default IndicateurUnForm;
