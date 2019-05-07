/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { RouteComponentProps } from "react-router-dom";
import { useForm } from "react-final-form-hooks";
import { CategorieSocioPro, ActionIndicateurDeuxData } from "../globals.d";

import CellInputsMenWomen from "../components/CellInputsMenWomen";
import ButtonSubmit from "../components/ButtonSubmit";
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

const getFieldName = (
  categorieSocioPro: CategorieSocioPro,
  genre: "Hommes" | "Femmes"
): string => "tauxAugmentation" + categorieSocioPro + genre;

function IndicateurDeuxForm({
  ecartAugmentParCategorieSocioPro,
  updateIndicateurDeux,
  history
}: Props) {
  const infoFields = ecartAugmentParCategorieSocioPro.map(
    ({
      categorieSocioPro,
      validiteGroupe,
      tauxAugmentationFemmes,
      tauxAugmentationHommes
    }) => {
      return {
        categorieSocioPro,
        validiteGroupe,
        tauxAugmentationFemmesName: getFieldName(categorieSocioPro, "Femmes"),
        tauxAugmentationFemmesValue:
          tauxAugmentationFemmes === undefined
            ? ""
            : String(fractionToPercentage(tauxAugmentationFemmes)),
        tauxAugmentationHommesName: getFieldName(categorieSocioPro, "Hommes"),
        tauxAugmentationHommesValue:
          tauxAugmentationHommes === undefined
            ? ""
            : String(fractionToPercentage(tauxAugmentationHommes))
      };
    }
  );

  const initialValues = infoFields.reduce(
    (
      acc,
      {
        tauxAugmentationFemmesName,
        tauxAugmentationFemmesValue,
        tauxAugmentationHommesName,
        tauxAugmentationHommesValue
      }
    ) => {
      return {
        ...acc,
        [tauxAugmentationFemmesName]: tauxAugmentationFemmesValue,
        [tauxAugmentationHommesName]: tauxAugmentationHommesValue
      };
    },
    {}
  );

  const onSubmit = (formData: any) => {
    const data: ActionIndicateurDeuxData = infoFields.map(
      ({
        categorieSocioPro,
        tauxAugmentationFemmesName,
        tauxAugmentationHommesName
      }) => ({
        categorieSocioPro,
        tauxAugmentationFemmes:
          formData[tauxAugmentationFemmesName] === ""
            ? undefined
            : percentageToFraction(
                parseFloat(formData[tauxAugmentationFemmesName])
              ),
        tauxAugmentationHommes:
          formData[tauxAugmentationHommesName] === ""
            ? undefined
            : percentageToFraction(
                parseFloat(formData[tauxAugmentationHommesName])
              )
      })
    );
    updateIndicateurDeux(data);

    history.push("/indicateur2/resultat");
  };

  const { form, handleSubmit /*, values, pristine, submitting*/ } = useForm({
    initialValues,
    onSubmit // the function to call with your form values upon valid submit
    //validate // a record-level validation function to check all form values
  });

  return (
    <form onSubmit={handleSubmit}>
      <div css={styles.bloc}>
        <p css={styles.blocTitle}>
          Taux d'augmentation (proportions de salariés augmentés)
        </p>

        <div css={styles.row}>
          <div css={styles.cellHead}>taux</div>
          <div css={styles.cell}>femmes</div>
          <div css={styles.cell}>hommes</div>
        </div>

        {infoFields.map(
          ({
            categorieSocioPro,
            validiteGroupe,
            tauxAugmentationFemmesName,
            tauxAugmentationHommesName
          }) => {
            return (
              <CellInputsMenWomen
                key={categorieSocioPro}
                form={form}
                name={displayNameCategorieSocioPro(categorieSocioPro)}
                readOnly={false}
                calculable={validiteGroupe}
                femmeFieldName={tauxAugmentationFemmesName}
                hommeFieldName={tauxAugmentationHommesName}
              />
            );
          }
        )}

        <ButtonSubmit label="Valider" />
      </div>
    </form>
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
