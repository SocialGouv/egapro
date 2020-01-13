/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Form } from "react-final-form";

import {
  AppState,
  FormState,
  ActionInformationsEntrepriseData,
  Structure
} from "../../globals";

import { required } from "../../utils/formHelpers";

import ActionBar from "../../components/ActionBar";
import ActionLink from "../../components/ActionLink";
import FormAutoSave from "../../components/FormAutoSave";
import FormSubmit from "../../components/FormSubmit";
import RadioButtons from "../../components/RadioButtons";
import TextField from "../../components/TextField";
import { ButtonSimulatorLink } from "../../components/SimulatorLink";

///////////////////

const validate = (value: string) => {
  const requiredError = required(value);
  if (!requiredError) {
    return undefined;
  } else {
    return {
      required: requiredError
    };
  }
};

const validateForm = ({
  nomEntreprise,
  siren,
  codeNaf,
  region,
  departement,
  adresse,
  codePostal,
  commune,
  structure,
  nomUES
}: {
  nomEntreprise: string;
  siren: string;
  codeNaf: string;
  region: string;
  departement: string;
  adresse: string;
  codePostal: string;
  commune: string;
  structure: Structure;
  nomUES: string;
}) => ({
  nomEntreprise: validate(nomEntreprise),
  siren: validate(siren),
  codeNaf: validate(codeNaf),
  region: validate(region),
  departement: validate(departement),
  adresse: validate(adresse),
  codePostal: validate(codePostal),
  commune: validate(commune),
  structure: validate(structure),
  nomUES: validate(nomUES)
});

interface Props {
  informationsEntreprise: AppState["informationsEntreprise"];
  readOnly: boolean;
  updateInformationsEntreprise: (
    data: ActionInformationsEntrepriseData
  ) => void;
  validateInformationsEntreprise: (valid: FormState) => void;
}

function InformationsEntrepriseForm({
  informationsEntreprise,
  readOnly,
  updateInformationsEntreprise,
  validateInformationsEntreprise
}: Props) {
  const initialValues: ActionInformationsEntrepriseData = {
    nomEntreprise: informationsEntreprise.nomEntreprise,
    siren: informationsEntreprise.siren,
    codeNaf: informationsEntreprise.codeNaf,
    region: informationsEntreprise.region,
    departement: informationsEntreprise.departement,
    adresse: informationsEntreprise.adresse,
    codePostal: informationsEntreprise.codePostal,
    commune: informationsEntreprise.commune,
    structure: informationsEntreprise.structure,
    nomUES: informationsEntreprise.nomUES
  };

  const saveForm = (formData: any) => {
    const {
      nomEntreprise,
      siren,
      codeNaf,
      region,
      departement,
      adresse,
      codePostal,
      commune,
      structure,
      nomUES
    } = formData;

    updateInformationsEntreprise({
      nomEntreprise: nomEntreprise,
      siren: siren,
      codeNaf: codeNaf,
      region,
      departement,
      adresse,
      codePostal,
      commune,
      structure,
      nomUES
    });
  };

  const onSubmit = (formData: any) => {
    saveForm(formData);
    validateInformationsEntreprise("Valid");
  };

  return (
    <Form
      onSubmit={onSubmit}
      initialValues={initialValues}
      validate={validateForm}
      // mandatory to not change user inputs
      // because we want to keep wrong string inside the input
      // we don't want to block string value
      initialValuesEqual={() => true}
    >
      {({ handleSubmit, values, hasValidationErrors, submitFailed }) => (
        <form onSubmit={handleSubmit} css={styles.container}>
          <FormAutoSave saveForm={saveForm} />
          <TextField
            label="Nom de l'entreprise"
            fieldName="nomEntreprise"
            errorText="le nom de l'entreprise n'est pas valide"
            readOnly={readOnly}
          />
          <TextField
            label="siren"
            fieldName="siren"
            errorText="le Siren de l'entreprise n'est pas valide"
            readOnly={readOnly}
          />
          <TextField
            label="code NAF"
            fieldName="codeNaf"
            errorText="le code NAF n'est pas valide"
            readOnly={readOnly}
          />
          <TextField
            label="Région"
            fieldName="region"
            errorText="la région n’est pas valide"
            readOnly={readOnly}
          />
          <TextField
            label="Département"
            fieldName="departement"
            errorText="le département n’est pas valide"
            readOnly={readOnly}
          />
          <TextField
            label="Adresse"
            fieldName="adresse"
            errorText="l'adresse n’est pas valide"
            readOnly={readOnly}
          />
          <TextField
            label="Code Postal"
            fieldName="codePostal"
            errorText="le code postal n’est pas valide"
            readOnly={readOnly}
          />
          <TextField
            label="Commune"
            fieldName="commune"
            errorText="la commune n'est pas valide"
            readOnly={readOnly}
          />

          <RadioButtons
            fieldName="structure"
            label="je déclare l'index en tant qu'"
            value={values.structure}
            readOnly={readOnly}
            choices={[
              {
                label: "entreprise",
                value: "Entreprise"
              },
              {
                label: "Unité Economique et Sociale (UES)",
                value: "Unité Economique et Sociale (UES)"
              }
            ]}
          />

          {values.structure === "Unité Economique et Sociale (UES)" && (
            <TextField
              label="Nom de l'UES"
              fieldName="nomUES"
              errorText="le nom de l'UES n'est pas valide"
              readOnly={readOnly}
            />
          )}

          {readOnly ? (
            <ActionBar>
              <ButtonSimulatorLink
                to="/informations-declarant"
                label="suivant"
              />
              &emsp;
              {informationsEntreprise.formValidated === "Valid" && (
                <p css={styles.edit}>
                  <ActionLink
                    onClick={() => validateInformationsEntreprise("None")}
                  >
                    modifier les données saisies
                  </ActionLink>
                </p>
              )}
            </ActionBar>
          ) : (
            <ActionBar>
              <FormSubmit
                hasValidationErrors={hasValidationErrors}
                submitFailed={submitFailed}
                errorMessage="Le formulaire ne peut pas être validé si tous les champs ne sont pas remplis."
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
  }),
  edit: css({
    marginTop: 14,
    marginBottom: 14,
    textAlign: "center"
  })
};

export default InformationsEntrepriseForm;
