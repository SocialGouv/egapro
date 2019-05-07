/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { RouteComponentProps } from "react-router-dom";
import { useForm } from "react-final-form-hooks";
import { CategorieSocioPro, ActionIndicateurTroisData } from "../globals.d";

import CellInputsMenWomen from "../components/CellInputsMenWomen";
import ButtonSubmit from "../components/ButtonSubmit";
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

const getFieldName = (
  categorieSocioPro: CategorieSocioPro,
  genre: "Hommes" | "Femmes"
): string => "tauxPromotion" + categorieSocioPro + genre;

function IndicateurTroisForm({
  ecartPromoParCategorieSocioPro,
  updateIndicateurTrois,
  history
}: Props) {
  const infoFields = ecartPromoParCategorieSocioPro.map(
    ({
      categorieSocioPro,
      validiteGroupe,
      tauxPromotionFemmes,
      tauxPromotionHommes
    }) => {
      return {
        categorieSocioPro,
        validiteGroupe,
        tauxPromotionFemmesName: getFieldName(categorieSocioPro, "Femmes"),
        tauxPromotionFemmesValue:
          tauxPromotionFemmes === undefined
            ? ""
            : String(fractionToPercentage(tauxPromotionFemmes)),
        tauxPromotionHommesName: getFieldName(categorieSocioPro, "Hommes"),
        tauxPromotionHommesValue:
          tauxPromotionHommes === undefined
            ? ""
            : String(fractionToPercentage(tauxPromotionHommes))
      };
    }
  );

  const initialValues = infoFields.reduce(
    (
      acc,
      {
        tauxPromotionFemmesName,
        tauxPromotionFemmesValue,
        tauxPromotionHommesName,
        tauxPromotionHommesValue
      }
    ) => {
      return {
        ...acc,
        [tauxPromotionFemmesName]: tauxPromotionFemmesValue,
        [tauxPromotionHommesName]: tauxPromotionHommesValue
      };
    },
    {}
  );

  const onSubmit = (formData: any) => {
    const data: ActionIndicateurTroisData = infoFields.map(
      ({
        categorieSocioPro,
        tauxPromotionFemmesName,
        tauxPromotionHommesName
      }) => ({
        categorieSocioPro,
        tauxPromotionFemmes:
          formData[tauxPromotionFemmesName] === ""
            ? undefined
            : percentageToFraction(
                parseFloat(formData[tauxPromotionFemmesName])
              ),
        tauxPromotionHommes:
          formData[tauxPromotionHommesName] === ""
            ? undefined
            : percentageToFraction(
                parseFloat(formData[tauxPromotionHommesName])
              )
      })
    );
    updateIndicateurTrois(data);

    history.push("/indicateur3/resultat");
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
          Taux de promotion (proportions de salariés promus)
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
            tauxPromotionFemmesName,
            tauxPromotionHommesName
          }) => {
            return (
              <CellInputsMenWomen
                key={categorieSocioPro}
                form={form}
                name={displayNameCategorieSocioPro(categorieSocioPro)}
                readOnly={false}
                calculable={validiteGroupe}
                femmeFieldName={tauxPromotionFemmesName}
                hommeFieldName={tauxPromotionHommesName}
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

export default IndicateurTroisForm;
