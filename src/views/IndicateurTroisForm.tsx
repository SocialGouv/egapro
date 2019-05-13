/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { memo } from "react";
import { useForm } from "react-final-form-hooks";
import {
  FormState,
  CategorieSocioPro,
  ActionIndicateurTroisData
} from "../globals.d";

import BlocForm from "../components/BlocForm";
import CellInputsMenWomen from "../components/CellInputsMenWomen";
import ActionBar from "../components/ActionBar";
import FormSubmit from "../components/FormSubmit";
import ButtonLink from "../components/ButtonLink";

import {
  fractionToPercentage,
  percentageToFraction,
  displayNameCategorieSocioPro
} from "../utils/helpers";

interface Props {
  ecartPromoParCategorieSocioPro: Array<{
    categorieSocioPro: CategorieSocioPro;
    validiteGroupe: boolean;
    tauxPromotionFemmes: number | undefined;
    tauxPromotionHommes: number | undefined;
  }>;
  readOnly: boolean;
  updateIndicateurTrois: (data: ActionIndicateurTroisData) => void;
  validateIndicateurTrois: (valid: FormState) => void;
}

const getFieldName = (
  categorieSocioPro: CategorieSocioPro,
  genre: "Hommes" | "Femmes"
): string => "tauxPromotion" + categorieSocioPro + genre;

const parseFormValue = (value: string, defaultValue: any = undefined) =>
  value === ""
    ? defaultValue
    : Number.isNaN(Number(value))
    ? defaultValue
    : percentageToFraction(parseFloat(value));

const parseStateValue = (value: number | undefined) =>
  value === undefined ? "" : String(fractionToPercentage(value));

function IndicateurTroisForm({
  ecartPromoParCategorieSocioPro,
  readOnly,
  updateIndicateurTrois,
  validateIndicateurTrois
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
        tauxPromotionFemmesValue: parseStateValue(tauxPromotionFemmes),
        tauxPromotionHommesName: getFieldName(categorieSocioPro, "Hommes"),
        tauxPromotionHommesValue: parseStateValue(tauxPromotionHommes)
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

  const saveForm = (formData: any) => {
    const data: ActionIndicateurTroisData = infoFields.map(
      ({
        categorieSocioPro,
        tauxPromotionFemmesName,
        tauxPromotionHommesName
      }) => ({
        categorieSocioPro,
        tauxPromotionFemmes: parseFormValue(formData[tauxPromotionFemmesName]),
        tauxPromotionHommes: parseFormValue(formData[tauxPromotionHommesName])
      })
    );
    updateIndicateurTrois(data);
  };

  const onSubmit = (formData: any) => {
    saveForm(formData);
    validateIndicateurTrois("Valid");
  };

  const { form, handleSubmit, hasValidationErrors, submitFailed } = useForm({
    initialValues,
    onSubmit
  });

  form.subscribe(
    ({ values, dirty }) => {
      if (dirty) {
        saveForm(values);
      }
    },
    { values: true, dirty: true }
  );

  return (
    <form onSubmit={handleSubmit} css={styles.container}>
      <BlocForm label="% de salariés promus">
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
                readOnly={readOnly}
                calculable={validiteGroupe}
                femmeFieldName={tauxPromotionFemmesName}
                hommeFieldName={tauxPromotionHommesName}
              />
            );
          }
        )}
      </BlocForm>

      {readOnly ? (
        <ActionBar>
          <ButtonLink to="/indicateur4" label="suivant" />
        </ActionBar>
      ) : (
        <ActionBar>
          <FormSubmit
            hasValidationErrors={hasValidationErrors}
            submitFailed={submitFailed}
            errorMessage="vous ne pouvez pas valider l’indicateur tant que vous n’avez pas rempli tous les champs"
          />
        </ActionBar>
      )}
    </form>
  );
}

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column"
  })
};

export default memo(
  IndicateurTroisForm,
  (prevProps, nextProps) => prevProps.readOnly === nextProps.readOnly
);
