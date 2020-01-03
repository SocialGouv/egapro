/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Form, useField } from "react-final-form";

import {
  AppState,
  FormState,
  ActionInformationsDeclarantData
} from "../../globals";

import { required } from "../../utils/formHelpers";

import ActionBar from "../../components/ActionBar";
import ActionLink from "../../components/ActionLink";
import FormAutoSave from "../../components/FormAutoSave";
import FormSubmit from "../../components/FormSubmit";
import Input, { hasFieldError } from "../../components/Input";
import { ButtonSimulatorLink } from "../../components/SimulatorLink";
import globalStyles from "../../utils/globalStyles";

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
  nom,
  prenom,
  tel,
  region,
  departement,
  adresse,
  codePostal,
  commune
}: {
  nom: string;
  prenom: string;
  tel: string;
  region: string;
  departement: string;
  adresse: string;
  codePostal: string;
  commune: string;
}) => ({
  nom: validate(nom),
  prenom: validate(prenom),
  tel: validate(tel),
  region: validate(region),
  departement: validate(departement),
  adresse: validate(adresse),
  codePostal: validate(codePostal),
  commune: validate(commune)
});

interface Props {
  informationsDeclarant: AppState["informationsDeclarant"];
  readOnly: boolean;
  updateInformationsDeclarant: (data: ActionInformationsDeclarantData) => void;
  validateInformationsDeclarant: (valid: FormState) => void;
}

function InformationsDeclarantForm({
  informationsDeclarant,
  readOnly,
  updateInformationsDeclarant,
  validateInformationsDeclarant
}: Props) {
  const initialValues: ActionInformationsDeclarantData = {
    nom: informationsDeclarant.nom,
    prenom: informationsDeclarant.prenom,
    tel: informationsDeclarant.tel,
    region: informationsDeclarant.region,
    departement: informationsDeclarant.departement,
    adresse: informationsDeclarant.adresse,
    codePostal: informationsDeclarant.codePostal,
    commune: informationsDeclarant.commune
  };

  const saveForm = (formData: any) => {
    const {
      nom,
      prenom,
      tel,
      region,
      departement,
      adresse,
      codePostal,
      commune
    } = formData;

    updateInformationsDeclarant({
      nom,
      prenom,
      tel,
      region,
      departement,
      adresse,
      codePostal,
      commune
    });
  };

  const onSubmit = (formData: any) => {
    saveForm(formData);
    validateInformationsDeclarant("Valid");
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
      {({ handleSubmit, hasValidationErrors, submitFailed }) => (
        <form onSubmit={handleSubmit} css={styles.container}>
          {/* pass `onlyWhenDirty={false}` because we want the form to always
          auto save, as we update the left menu depending on the "tranche
          d'effectifs". Otherwise it would not re-update the menu when
          switching back to the original value */}
          <FormAutoSave saveForm={saveForm} onlyWhenDirty={false} />

          <TextField
            label="Nom du déclarant"
            fieldName="nom"
            errorText="le nom n’est pas valide"
            readOnly={readOnly}
          />
          <TextField
            label="Prénom du déclarant"
            fieldName="prenom"
            errorText="le prénom n’est pas valide"
            readOnly={readOnly}
          />
          <TextField
            label="Numéro de téléphone"
            fieldName="tel"
            errorText="le numéro de téléphone n’est pas valide"
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
          {readOnly ? (
            <ActionBar>
              <ButtonSimulatorLink to="/TODO" label="suivant" />
              &emsp;
              {informationsDeclarant.formValidated === "Valid" && (
                <p css={styles.edit}>
                  <ActionLink
                    onClick={() => validateInformationsDeclarant("None")}
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

function TextField({
  errorText,
  fieldName,
  label,
  readOnly
}: {
  errorText: string;
  fieldName: string;
  label: string;
  readOnly: boolean;
}) {
  const field = useField(fieldName, { validate });
  const error = hasFieldError(field.meta);

  return (
    <div css={styles.formField}>
      <label
        css={[styles.label, error && styles.labelError]}
        htmlFor={field.input.name}
      >
        {label}
      </label>
      <div css={styles.fieldRow}>
        <Input field={field} readOnly={readOnly} />
      </div>
      <p css={styles.error}>{error && errorText}</p>
    </div>
  );
}

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column"
  }),
  formField: css({
    marginBottom: 20
  }),
  label: css({
    fontSize: 14,
    fontWeight: "bold",
    lineHeight: "17px"
  }),
  labelError: css({
    color: globalStyles.colors.error
  }),
  fieldRow: css({
    height: 38,
    marginTop: 5,
    marginBottom: 5,
    display: "flex",
    input: {
      borderRadius: 4,
      border: "1px solid"
    },
    "input[readonly]": { border: 0 }
  }),
  error: css({
    height: 18,
    color: globalStyles.colors.error,
    fontSize: 12,
    textDecoration: "underline",
    lineHeight: "15px"
  }),
  dates: css({
    display: "flex",
    justifyContent: "space-between"
  }),
  dateField: css({
    marginTop: 5,
    input: {
      display: "flex",
      fontSize: 14,
      paddingLeft: 22,
      paddingRight: 22,
      height: 38,
      marginTop: 5
    }
  }),
  edit: css({
    marginTop: 14,
    marginBottom: 14,
    textAlign: "center"
  })
};

export default InformationsDeclarantForm;
