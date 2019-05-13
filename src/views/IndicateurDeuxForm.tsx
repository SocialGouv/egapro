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
import CellInputsMenWomen from "../components/CellInputsMenWomen";
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
    {}
  );

  const saveForm = (formData: any) => {
    const data: ActionIndicateurDeuxData = infoFields.map(
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
    updateIndicateurDeux(data);
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
              <CellInputsMenWomen
                key={categorieSocioPro}
                form={form}
                name={displayNameCategorieSocioPro(categorieSocioPro)}
                readOnly={readOnly}
                calculable={validiteGroupe}
                femmeFieldName={tauxAugmentationFemmesName}
                hommeFieldName={tauxAugmentationHommesName}
              />
            );
          }
        )}
      </BlocForm>

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
  }),

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

export default memo(
  IndicateurDeuxForm,
  (prevProps, nextProps) => prevProps.readOnly === nextProps.readOnly
);
