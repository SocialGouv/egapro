/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { memo } from "react";
import { useForm } from "react-final-form-hooks";
import {
  FormState,
  CategorieSocioPro,
  ActionIndicateurDeuxData
} from "../globals.d";

import {
  calculTotalEffectifsEtTauxAugmentation,
  calculEcartTauxAugmentation,
  effectifEtEcartAugmentGroup
} from "../utils/calculsEgaProIndicateurDeux";

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
  displayPercent
} from "../utils/helpers";

interface Props {
  ecartAugmentParCategorieSocioPro: Array<effectifEtEcartAugmentGroup>;
  presenceAugmentation: boolean;
  readOnly: boolean;
  updateIndicateurDeux: (data: ActionIndicateurDeuxData) => void;
  validateIndicateurDeux: (valid: FormState) => void;
}

const getFieldName = (
  categorieSocioPro: CategorieSocioPro,
  genre: "Hommes" | "Femmes"
): string => "tauxAugmentation" + categorieSocioPro + genre;

const parseFormValue = (value: string, defaultValue: any = undefined) =>
  value === ""
    ? defaultValue
    : Number.isNaN(Number(value))
    ? defaultValue
    : percentageToFraction(parseFloat(value));

const parseStateValue = (value: number | undefined) =>
  value === undefined ? "" : String(fractionToPercentage(value));

function IndicateurDeuxForm({
  ecartAugmentParCategorieSocioPro,
  presenceAugmentation,
  readOnly,
  updateIndicateurDeux,
  validateIndicateurDeux
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
        tauxAugmentationFemmesValue: parseStateValue(tauxAugmentationFemmes),
        tauxAugmentationHommesName: getFieldName(categorieSocioPro, "Hommes"),
        tauxAugmentationHommesValue: parseStateValue(tauxAugmentationHommes)
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
    { presenceAugmentation: String(presenceAugmentation) }
  );

  const saveForm = (formData: any) => {
    const { presenceAugmentation } = formData;
    const tauxAugmentation = infoFields.map(
      ({
        categorieSocioPro,
        tauxAugmentationFemmesName,
        tauxAugmentationHommesName
      }) => ({
        categorieSocioPro,
        tauxAugmentationFemmes: parseFormValue(
          formData[tauxAugmentationFemmesName]
        ),
        tauxAugmentationHommes: parseFormValue(
          formData[tauxAugmentationHommesName]
        )
      })
    );
    updateIndicateurDeux({
      tauxAugmentation,
      presenceAugmentation: presenceAugmentation === "true"
    });
  };

  const onSubmit = (formData: any) => {
    saveForm(formData);
    validateIndicateurDeux("Valid");
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
  const ecartAugmentParCategorieSocioProPourTotal = ecartAugmentParCategorieSocioPro.map(
    (groupAugment, index) => {
      const infoField = infoFields[index];
      const tauxAugmentationFemmes = parseFormValue(
        values[infoField.tauxAugmentationFemmesName]
      );
      const tauxAugmentationHommes = parseFormValue(
        values[infoField.tauxAugmentationHommesName]
      );
      const ecartTauxAugmentation = calculEcartTauxAugmentation(
        tauxAugmentationFemmes,
        tauxAugmentationHommes
      );
      return {
        ...groupAugment,
        tauxAugmentationFemmes,
        tauxAugmentationHommes,
        ecartTauxAugmentation
      };
    }
  );
  const {
    totalTauxAugmentationFemmes,
    totalTauxAugmentationHommes
  } = calculTotalEffectifsEtTauxAugmentation(
    ecartAugmentParCategorieSocioProPourTotal
  );

  return (
    <form onSubmit={handleSubmit} css={styles.container}>
      <RadiosBoolean
        form={form}
        fieldName="presenceAugmentation"
        readOnly={readOnly}
        labelTrue="il y a eu des augmentations durant la période de référence"
        labelFalse="il n’y a pas eu d’augmentation durant la période de référence"
      />

      {values.presenceAugmentation === "true" && (
        <BlocForm
          label="% de salariés augmentés"
          footer={[
            displayPercent(totalTauxAugmentationHommes),
            displayPercent(totalTauxAugmentationFemmes)
          ]}
        >
          {infoFields.map(
            ({
              categorieSocioPro,
              validiteGroupe,
              tauxAugmentationFemmesName,
              tauxAugmentationHommesName
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
                  femmeFieldName={tauxAugmentationFemmesName}
                  hommeFieldName={tauxAugmentationHommesName}
                />
              );
            }
          )}
        </BlocForm>
      )}

      {readOnly ? (
        <ActionBar>
          <ButtonLink to="/indicateur3" label="suivant" />
        </ActionBar>
      ) : (
        <ActionBar>
          <FormSubmit
            hasValidationErrors={hasValidationErrors}
            submitFailed={submitFailed}
            errorMessage="vous ne pouvez pas valider l’indicateur
                tant que vous n’avez pas rempli tous les champs"
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
  IndicateurDeuxForm,
  (prevProps, nextProps) => prevProps.readOnly === nextProps.readOnly
);
