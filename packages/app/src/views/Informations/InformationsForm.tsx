/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Form, Field } from "react-final-form";

import { AppState, FormState, ActionInformationsData } from "../../globals";

import { parseTrancheEffectifsFormValue } from "../../utils/formHelpers";

import RadioButtons from "../../components/RadioButtons";
import ActionBar from "../../components/ActionBar";
import FormAutoSave from "../../components/FormAutoSave";
import FormSubmit from "../../components/FormSubmit";
import { ButtonSimulatorLink } from "../../components/SimulatorLink";

///////////////////

interface Props {
  informations: AppState["informations"];
  readOnly: boolean;
  updateInformations: (data: ActionInformationsData) => void;
  validateInformations: (valid: FormState) => void;
}

function InformationsForm({
  informations,
  readOnly,
  updateInformations,
  validateInformations
}: Props) {
  const initialValues: ActionInformationsData = {
    nomEntreprise: informations.nomEntreprise,
    trancheEffectifs: informations.trancheEffectifs,
    debutPeriodeReference: informations.debutPeriodeReference
  };

  const saveForm = (formData: any) => {
    const { nomEntreprise, trancheEffectifs, debutPeriodeReference } = formData;

    updateInformations({
      nomEntreprise: nomEntreprise,
      trancheEffectifs: parseTrancheEffectifsFormValue(trancheEffectifs),
      debutPeriodeReference: debutPeriodeReference
    });
  };

  const onSubmit = (formData: any) => {
    saveForm(formData);
    validateInformations("Valid");
  };

  return (
    <Form
      onSubmit={onSubmit}
      initialValues={initialValues}
      // mandatory to not change user inputs
      // because we want to keep wrong string inside the input
      // we don't want to block string value
      initialValuesEqual={() => true}
    >
      {({ handleSubmit, hasValidationErrors, submitFailed, values }) => (
        <form onSubmit={handleSubmit} css={styles.container}>
          <FormAutoSave saveForm={saveForm} />
          <label>Quel est le nom de l'entreprise ?</label>
          <Field name="nomEntreprise" component="input" readOnly={readOnly} />

          <RadioButtons
            fieldName="trancheEffectifs"
            label="Quelle est la tranche d'effectifs de l'entreprise ?"
            choices={[
              {
                label: "Entre 50 et 249",
                value: "50 à 249"
              },
              {
                label: "Entre 250 et 999",
                value: "250 à 999"
              },
              {
                label: "1000 et plus",
                value: "1000 et plus"
              }
            ]}
            value={values.trancheEffectifs}
            readOnly={readOnly}
          />

          <label>
            Sur quelle période souhaitez-vous faire votre votre déclaration ?
          </label>
          <Field
            name="debutPeriodeReference"
            component="input"
            type="date"
            readOnly={readOnly}
          />

          {readOnly ? (
            <ActionBar>
              <ButtonSimulatorLink to="/effectifs" label="suivant" />
            </ActionBar>
          ) : (
            <ActionBar>
              <FormSubmit
                hasValidationErrors={hasValidationErrors}
                submitFailed={submitFailed}
                errorMessage="L’indicateur ne peut pas être validé si tous les champs ne sont pas remplis."
              />
            </ActionBar>
          )}
        </form>
      )}
    </Form>
  );
}

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column"
  })
};

export default InformationsForm;
