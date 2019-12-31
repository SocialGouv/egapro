/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Form, useField } from "react-final-form";

import {
  AppState,
  FormState,
  ActionInformationsEntrepriseData
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
  nomEntreprise,
  siren,
  codeNaf,
  adresse
}: {
  nomEntreprise: string;
  siren: string;
  codeNaf: string;
  adresse: string;
}) => ({
  nomEntreprise: validate(nomEntreprise),
  siren: validate(siren),
  codeNaf: validate(codeNaf),
  adresse: validate(adresse)
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
    adresse: informationsEntreprise.adresse
  };

  const saveForm = (formData: any) => {
    const { nomEntreprise, siren, codeNaf, adresse } = formData;

    updateInformationsEntreprise({
      nomEntreprise: nomEntreprise,
      siren: siren,
      codeNaf: codeNaf,
      adresse: adresse
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
      {({ handleSubmit, hasValidationErrors, submitFailed, values }) => (
        <form onSubmit={handleSubmit} css={styles.container}>
          {/* pass `onlyWhenDirty={false}` because we want the form to always
          auto save, as we update the left menu depending on the "tranche
          d'effectifs". Otherwise it would not re-update the menu when
          switching back to the original value */}
          <FormAutoSave saveForm={saveForm} onlyWhenDirty={false} />
          <FieldNomEntreprise readOnly={readOnly} />
          <FieldSiren readOnly={readOnly} />
          <FieldCodeNaf readOnly={readOnly} />
          <FieldAdresse readOnly={readOnly} />

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

function FieldNomEntreprise({ readOnly }: { readOnly: boolean }) {
  const field = useField("nomEntreprise", { validate });
  const error = hasFieldError(field.meta);

  return (
    <div css={styles.formField}>
      <label
        css={[styles.label, error && styles.labelError]}
        htmlFor={field.input.name}
      >
        Quel est le nom de l'entreprise ?
      </label>
      <div css={styles.fieldRow}>
        <Input field={field} readOnly={readOnly} />
      </div>
      <p css={styles.error}>
        {error && "le nom de l'entreprise n’est pas valide"}
      </p>
    </div>
  );
}

function FieldSiren({ readOnly }: { readOnly: boolean }) {
  const field = useField("siren", { validate });
  const error = hasFieldError(field.meta);

  return (
    <div css={styles.formField}>
      <label
        css={[styles.label, error && styles.labelError]}
        htmlFor={field.input.name}
      >
        Siren
      </label>
      <div css={styles.fieldRow}>
        <Input field={field} readOnly={readOnly} />
      </div>
      <p css={styles.error}>
        {error && "le Siren de l'entreprise n'est pas valide"}
      </p>
    </div>
  );
}

function FieldCodeNaf({ readOnly }: { readOnly: boolean }) {
  const field = useField("codeNaf", { validate });
  const error = hasFieldError(field.meta);

  return (
    <div css={styles.formField}>
      <label
        css={[styles.label, error && styles.labelError]}
        htmlFor={field.input.name}
      >
        Code Naf
      </label>
      <div css={styles.fieldRow}>
        <Input field={field} readOnly={readOnly} />
      </div>
      <p css={styles.error}>{error && "le code Naf n'est pas valide"}</p>
    </div>
  );
}

function FieldAdresse({ readOnly }: { readOnly: boolean }) {
  const field = useField("adresse", { validate });
  const error = hasFieldError(field.meta);

  return (
    <div css={styles.formField}>
      <label
        css={[styles.label, error && styles.labelError]}
        htmlFor={field.input.name}
      >
        Adresse
      </label>
      <div css={styles.fieldRow}>
        <Input field={field} readOnly={readOnly} />
      </div>
      <p css={styles.error}>
        {error && "l'adresse de l'entreprise n'est pas valide"}
      </p>
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

export default InformationsEntrepriseForm;
