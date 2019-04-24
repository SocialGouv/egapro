/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { RouteComponentProps } from "react-router-dom";
import {
  CategorieSocioPro,
  Groupe,
  GroupTranchesAges,
  ActionIndicateurTroisData
} from "../globals.d";

import useField, { stateFieldType } from "../hooks/useField";
import RowFemmesHommes from "../components/RowFemmesHommes";
import Button from "../components/Button";
import {
  fractionToPercentage,
  percentageToFraction,
  displayNameCategorieSocioPro
} from "../utils/helpers";

interface Props extends RouteComponentProps {
  ecartPromoParCategorieSocioPro: Array<{
    categorieSocioPro: CategorieSocioPro;
    validiteGroupe: boolean;
    tauxPromotionFemmes: number | undefined;
    tauxPromotionHommes: number | undefined;
  }>;
  updateIndicateurTrois: (data: ActionIndicateurTroisData) => void;
}

interface GroupeCategorioSocioProFields {
  categorieSocioPro: CategorieSocioPro;
  validiteGroupe: boolean;
  tauxPromotionFemmesField: stateFieldType;
  tauxPromotionHommesField: stateFieldType;
}

function IndicateurTroisForm({
  ecartPromoParCategorieSocioPro,
  updateIndicateurTrois,
  history
}: Props) {
  const allFields: Array<
    GroupeCategorioSocioProFields
  > = ecartPromoParCategorieSocioPro.map(
    ({
      categorieSocioPro,
      validiteGroupe,
      tauxPromotionFemmes,
      tauxPromotionHommes
    }) => {
      return {
        categorieSocioPro,
        validiteGroupe,
        tauxPromotionFemmesField: useField(
          "tauxPromotionFemmes" + categorieSocioPro,
          tauxPromotionFemmes === undefined
            ? ""
            : String(fractionToPercentage(tauxPromotionFemmes))
        ),
        tauxPromotionHommesField: useField(
          "tauxPromotionHommes" + categorieSocioPro,
          tauxPromotionHommes === undefined
            ? ""
            : String(fractionToPercentage(tauxPromotionHommes))
        )
      };
    }
  );

  const saveGroup = () => {
    const data: ActionIndicateurTroisData = allFields.map(
      ({
        categorieSocioPro,
        tauxPromotionFemmesField,
        tauxPromotionHommesField
      }) => ({
        categorieSocioPro,
        tauxPromotionFemmes:
          tauxPromotionFemmesField.input.value === ""
            ? undefined
            : percentageToFraction(
                parseFloat(tauxPromotionFemmesField.input.value)
              ),
        tauxPromotionHommes:
          tauxPromotionHommesField.input.value === ""
            ? undefined
            : percentageToFraction(
                parseFloat(tauxPromotionHommesField.input.value)
              )
      })
    );
    updateIndicateurTrois(data);

    history.push("/indicateur3/resultat");
  };

  return (
    <div>
      <div css={styles.bloc}>
        <p css={styles.blocTitle}>
          Taux de promotion (proportions de salariés promus)
        </p>

        <div css={styles.row}>
          <div css={styles.cellHead}>taux</div>
          <div css={styles.cell}>femmes</div>
          <div css={styles.cell}>hommes</div>
        </div>

        {allFields.map(
          ({
            categorieSocioPro,
            validiteGroupe,
            tauxPromotionFemmesField,
            tauxPromotionHommesField
          }: GroupeCategorioSocioProFields) => {
            return (
              <RowFemmesHommes
                key={categorieSocioPro}
                name={displayNameCategorieSocioPro(categorieSocioPro)}
                calculable={validiteGroupe}
                femmesField={tauxPromotionFemmesField}
                hommesField={tauxPromotionHommesField}
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

export default IndicateurTroisForm;
