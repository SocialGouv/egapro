/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { memo } from "react";
import { useForm } from "react-final-form-hooks";
import {
  FormState,
  CategorieSocioPro,
  ActionIndicateurTroisData
} from "../globals.d";

import {
  calculTotalEffectifsEtTauxPromotion,
  calculEcartTauxPromotion,
  effectifEtEcartPromoGroup
} from "../utils/calculsEgaProIndicateurTrois";

import BlocForm from "../components/BlocForm";
import FieldInputsMenWomen from "../components/FieldInputsMenWomen";
import RadiosBoolean from "../components/RadiosBoolean";
import ActionBar from "../components/ActionBar";
import FormSubmit from "../components/FormSubmit";
import ButtonLink from "../components/ButtonLink";

import {
  fractionToPercentage,
  percentageToFraction,
  displayNameCategorieSocioPro,
  displayFractionPercent
} from "../utils/helpers";

interface Props {
  ecartPromoParCategorieSocioPro: Array<effectifEtEcartPromoGroup>;
  presencePromotion: boolean;
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
  presencePromotion,
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
    { presencePromotion: String(presencePromotion) }
  );

  const saveForm = (formData: any) => {
    const { presencePromotion } = formData;
    const tauxPromotion = infoFields.map(
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
    updateIndicateurTrois({
      tauxPromotion,
      presencePromotion: presencePromotion === "true"
    });
  };

  const onSubmit = (formData: any) => {
    saveForm(formData);
    validateIndicateurTrois("Valid");
  };

  const {
    form,
    values,
    handleSubmit,
    hasValidationErrors,
    submitFailed
  } = useForm({
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

  // Only for Total with updated values
  const ecartPromoParCategorieSocioProPourTotal = ecartPromoParCategorieSocioPro.map(
    (groupAugment, index) => {
      const infoField = infoFields[index];
      const tauxPromotionFemmes = parseFormValue(
        values[infoField.tauxPromotionFemmesName]
      );
      const tauxPromotionHommes = parseFormValue(
        values[infoField.tauxPromotionHommesName]
      );
      const ecartTauxPromotion = calculEcartTauxPromotion(
        tauxPromotionFemmes,
        tauxPromotionHommes
      );
      return {
        ...groupAugment,
        tauxPromotionFemmes,
        tauxPromotionHommes,
        ecartTauxPromotion
      };
    }
  );
  const {
    totalTauxPromotionFemmes,
    totalTauxPromotionHommes
  } = calculTotalEffectifsEtTauxPromotion(
    ecartPromoParCategorieSocioProPourTotal
  );

  return (
    <form onSubmit={handleSubmit} css={styles.container}>
      <RadiosBoolean
        form={form}
        fieldName="presencePromotion"
        readOnly={readOnly}
        labelTrue="il y a eu des promotions durant la période de référence"
        labelFalse="il n’y a pas eu de promotions durant la période de référence"
      />

      {values.presencePromotion === "true" && (
        <BlocForm
          label="% de salariés promus"
          footer={[
            displayFractionPercent(totalTauxPromotionHommes),
            displayFractionPercent(totalTauxPromotionFemmes)
          ]}
        >
          {infoFields.map(
            ({
              categorieSocioPro,
              validiteGroupe,
              tauxPromotionFemmesName,
              tauxPromotionHommesName
            }) => {
              return (
                <FieldInputsMenWomen
                  key={categorieSocioPro}
                  form={form}
                  name={displayNameCategorieSocioPro(categorieSocioPro)}
                  readOnly={readOnly}
                  calculable={validiteGroupe}
                  calculableNumber={10}
                  mask="percent"
                  femmeFieldName={tauxPromotionFemmesName}
                  hommeFieldName={tauxPromotionHommesName}
                />
              );
            }
          )}
        </BlocForm>
      )}

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
