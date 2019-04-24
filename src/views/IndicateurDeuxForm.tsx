/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { RouteComponentProps } from "react-router-dom";
import {
  CategorieSocioPro,
  Groupe,
  GroupTranchesAges,
  ActionIndicateurDeuxData
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
  ecartAugmentParCategorieSocioPro: Array<{
    categorieSocioPro: CategorieSocioPro;
    validiteGroupe: boolean;
    tauxAugmentationFemmes: number | undefined;
    tauxAugmentationHommes: number | undefined;
  }>;
  updateIndicateurDeux: (data: ActionIndicateurDeuxData) => void;
}

interface GroupeCategorioSocioProFields {
  categorieSocioPro: CategorieSocioPro;
  validiteGroupe: boolean;
  tauxAugmentationFemmesField: stateFieldType;
  tauxAugmentationHommesField: stateFieldType;
}

function IndicateurDeuxForm({
  ecartAugmentParCategorieSocioPro,
  updateIndicateurDeux,
  history
}: Props) {
  const allFields: Array<
    GroupeCategorioSocioProFields
  > = ecartAugmentParCategorieSocioPro.map(
    ({
      categorieSocioPro,
      validiteGroupe,
      tauxAugmentationFemmes,
      tauxAugmentationHommes
    }) => {
      return {
        categorieSocioPro,
        validiteGroupe,
        tauxAugmentationFemmesField: useField(
          "tauxAugmentationFemmes" + categorieSocioPro,
          tauxAugmentationFemmes === undefined
            ? ""
            : String(fractionToPercentage(tauxAugmentationFemmes))
        ),
        tauxAugmentationHommesField: useField(
          "tauxAugmentationHommes" + categorieSocioPro,
          tauxAugmentationHommes === undefined
            ? ""
            : String(fractionToPercentage(tauxAugmentationHommes))
        )
      };
    }
  );

  const saveGroup = () => {
    const data: ActionIndicateurDeuxData = allFields.map(
      ({
        categorieSocioPro,
        tauxAugmentationFemmesField,
        tauxAugmentationHommesField
      }) => ({
        categorieSocioPro,
        tauxAugmentationFemmes:
          tauxAugmentationFemmesField.input.value === ""
            ? undefined
            : percentageToFraction(
                parseFloat(tauxAugmentationFemmesField.input.value)
              ),
        tauxAugmentationHommes:
          tauxAugmentationHommesField.input.value === ""
            ? undefined
            : percentageToFraction(
                parseFloat(tauxAugmentationHommesField.input.value)
              )
      })
    );
    updateIndicateurDeux(data);

    history.push("/indicateur2/resultat");
  };

  return (
    <div>
      <div css={styles.bloc}>
        <p css={styles.blocTitle}>
          Taux d'augmentation (proportions de salariés augmentés)
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
            tauxAugmentationFemmesField,
            tauxAugmentationHommesField
          }: GroupeCategorioSocioProFields) => {
            return (
              <RowFemmesHommes
                key={categorieSocioPro}
                name={displayNameCategorieSocioPro(categorieSocioPro)}
                calculable={validiteGroupe}
                femmesField={tauxAugmentationFemmesField}
                hommesField={tauxAugmentationHommesField}
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

export default IndicateurDeuxForm;
