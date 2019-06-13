/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { memo } from "react";
import { useForm } from "react-final-form-hooks";
import {
  CategorieSocioPro,
  TranchesAges,
  Groupe,
  GroupTranchesAges,
  ActionIndicateurUnData,
  FormState
} from "../../globals.d";

import { parseIntFormValue, parseIntStateValue } from "../../utils/formHelpers";
import { calculValiditeGroupe } from "../../utils/calculsEgaProIndicateurUn";

import BlocForm from "../../components/BlocForm";
import FieldInputsMenWomen from "../../components/FieldInputsMenWomen";
import ActionBar from "../../components/ActionBar";
import FormSubmit from "../../components/FormSubmit";
import { ButtonSimulatorLink } from "../../components/SimulatorLink";

import {
  displayNameCategorieSocioPro,
  displayNameTranchesAges
} from "../../utils/helpers";

interface Props {
  data: Array<Groupe>;
  readOnly: boolean;
  updateIndicateurUn: (data: ActionIndicateurUnData) => void;
  validateIndicateurUn: (valid: FormState) => void;
}

const getFieldName = (
  categorieSocioPro: CategorieSocioPro,
  trancheAge: TranchesAges,
  genre: "Hommes" | "Femmes"
): string =>
  "remunerationAnnuelleBrut" + categorieSocioPro + genre + trancheAge;

function IndicateurUnForm({
  data,
  readOnly,
  updateIndicateurUn,
  validateIndicateurUn
}: Props) {
  const infoFields = data.map(({ categorieSocioPro, tranchesAges }) => {
    return {
      categorieSocioPro,
      tranchesAges: tranchesAges.map(
        ({
          trancheAge,
          nombreSalariesFemmes,
          nombreSalariesHommes,
          remunerationAnnuelleBrutFemmes,
          remunerationAnnuelleBrutHommes
        }: GroupTranchesAges) => {
          return {
            trancheAge,
            calculable: calculValiditeGroupe(
              nombreSalariesFemmes || 0,
              nombreSalariesHommes || 0
            ),
            remunerationAnnuelleBrutFemmesName: getFieldName(
              categorieSocioPro,
              trancheAge,
              "Femmes"
            ),
            remunerationAnnuelleBrutFemmesValue: parseIntStateValue(
              remunerationAnnuelleBrutFemmes
            ),
            remunerationAnnuelleBrutHommesName: getFieldName(
              categorieSocioPro,
              trancheAge,
              "Hommes"
            ),
            remunerationAnnuelleBrutHommesValue: parseIntStateValue(
              remunerationAnnuelleBrutHommes
            )
          };
        }
      )
    };
  });

  const initialValues = infoFields.reduce((acc1, { tranchesAges }) => {
    return tranchesAges.reduce(
      (
        acc2,
        {
          remunerationAnnuelleBrutFemmesName,
          remunerationAnnuelleBrutFemmesValue,
          remunerationAnnuelleBrutHommesName,
          remunerationAnnuelleBrutHommesValue
        }
      ) => {
        return {
          ...acc2,
          [remunerationAnnuelleBrutFemmesName]: remunerationAnnuelleBrutFemmesValue,
          [remunerationAnnuelleBrutHommesName]: remunerationAnnuelleBrutHommesValue
        };
      },
      acc1
    );
  }, {});

  const saveForm = (formData: any) => {
    const data: ActionIndicateurUnData = infoFields.map(
      ({ categorieSocioPro, tranchesAges }) => ({
        categorieSocioPro,
        tranchesAges: tranchesAges.map(
          ({
            trancheAge,
            remunerationAnnuelleBrutFemmesName,
            remunerationAnnuelleBrutHommesName
          }) => ({
            trancheAge,
            remunerationAnnuelleBrutFemmes: parseIntFormValue(
              formData[remunerationAnnuelleBrutFemmesName]
            ),
            remunerationAnnuelleBrutHommes: parseIntFormValue(
              formData[remunerationAnnuelleBrutHommesName]
            )
          })
        )
      })
    );
    updateIndicateurUn(data);
  };

  const onSubmit = (formData: any) => {
    saveForm(formData);
    validateIndicateurUn("Valid");
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
      {infoFields.map(({ categorieSocioPro, tranchesAges }) => {
        return (
          <BlocForm
            key={categorieSocioPro}
            title={displayNameCategorieSocioPro(categorieSocioPro)}
            label="rémunération moyenne"
          >
            {tranchesAges.map(
              ({
                trancheAge,
                calculable,
                remunerationAnnuelleBrutFemmesName,
                remunerationAnnuelleBrutHommesName
              }) => {
                return (
                  <FieldInputsMenWomen
                    key={trancheAge}
                    form={form}
                    name={displayNameTranchesAges(trancheAge)}
                    readOnly={readOnly}
                    calculable={calculable}
                    calculableNumber={3}
                    mask="number"
                    femmeFieldName={remunerationAnnuelleBrutFemmesName}
                    hommeFieldName={remunerationAnnuelleBrutHommesName}
                  />
                );
              }
            )}
          </BlocForm>
        );
      })}

      {readOnly ? (
        <ActionBar>
          <ButtonSimulatorLink to="/indicateur2" label="suivant" />
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
  IndicateurUnForm,
  (prevProps, nextProps) => prevProps.readOnly === nextProps.readOnly
);
