/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Field, FieldMetaState, Form, useField } from "react-final-form";
import createDecorator from "final-form-calculate";

import { AppState, FormState, ActionInformationsData } from "../../globals";

import {
  mustBeDate,
  parseTrancheEffectifsFormValue,
  required
} from "../../utils/formHelpers";
import {
  calendarYear,
  dateToString,
  parseDate,
  Year
} from "../../utils/helpers";

import ActionBar from "../../components/ActionBar";
import ActionLink from "../../components/ActionLink";
import FormAutoSave from "../../components/FormAutoSave";
import FormSubmit from "../../components/FormSubmit";
import Input, { hasFieldError } from "../../components/Input";
import RadioLabels from "../../components/RadioLabels";
import { ButtonSimulatorLink } from "../../components/SimulatorLink";
import globalStyles from "../../utils/globalStyles";

import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import fr from "date-fns/locale/fr";
registerLocale("fr", fr);

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

const validateDate = (value: string) => {
  const requiredError = required(value);
  const mustBeDateError = mustBeDate(value);
  if (!requiredError && !mustBeDateError) {
    return undefined;
  } else {
    return {
      required: requiredError,
      mustBeDate: mustBeDateError
    };
  }
};

const validateForm = ({
  nomEntreprise,
  debutPeriodeReference,
  finPeriodeReference
}: {
  nomEntreprise: string;
  debutPeriodeReference: string;
  finPeriodeReference: string;
}) => ({
  nomEntreprise: validate(nomEntreprise),
  debutPeriodeReference: validateDate(debutPeriodeReference)
});

const valueValidateForCalculator = (value: string) => {
  return validateDate(value) === undefined;
};

const calculator = createDecorator(
  {
    field: "debutPeriodeReference",
    updates: {
      finPeriodeReference: (dateDebut, { finPeriodeReference }: any) => {
        return valueValidateForCalculator(dateDebut)
          ? calendarYear(dateDebut, Year.Add, 1)
          : finPeriodeReference;
      }
    }
  },
  {
    field: "finPeriodeReference",
    updates: {
      debutPeriodeReference: (dateFin, { debutPeriodeReference }: any) => {
        return valueValidateForCalculator(dateFin)
          ? calendarYear(dateFin, Year.Subtract, 1)
          : debutPeriodeReference;
      }
    }
  }
);

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
    debutPeriodeReference: informations.debutPeriodeReference,
    finPeriodeReference: informations.finPeriodeReference
  };

  const saveForm = (formData: any) => {
    const {
      nomEntreprise,
      trancheEffectifs,
      debutPeriodeReference,
      finPeriodeReference
    } = formData;

    updateInformations({
      nomEntreprise: nomEntreprise,
      trancheEffectifs: parseTrancheEffectifsFormValue(trancheEffectifs),
      debutPeriodeReference: debutPeriodeReference,
      finPeriodeReference: finPeriodeReference
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
      decorators={[calculator]}
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

          <RadioLabels
            fieldName="trancheEffectifs"
            label="Quelle est la tranche d'effectifs de l'entreprise ?"
            choices={[
              {
                label: "Entre 50 et 250",
                value: "50 à 250"
              },
              {
                label: "Entre 251 et 999",
                value: "251 à 999"
              },
              {
                label: "1000 et plus",
                value: "1000 et plus"
              }
            ]}
            value={values.trancheEffectifs}
            readOnly={readOnly}
          />

          <FieldPeriodeReference readOnly={readOnly} />

          {readOnly ? (
            <ActionBar>
              <ButtonSimulatorLink to="/effectifs" label="suivant" />
              &emsp;
              {informations.formValidated === "Valid" && (
                <p css={styles.edit}>
                  <ActionLink onClick={() => validateInformations("None")}>
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

function FieldPeriodeReference({ readOnly }: { readOnly: boolean }) {
  return (
    <div>
      <label css={styles.label}>
        Sur quelle période souhaitez-vous faire votre votre déclaration ?
      </label>
      <div css={styles.dates}>
        <FieldDate
          name="debutPeriodeReference"
          label="Date de début (jj/mm/aaaa)"
          readOnly={readOnly}
        />
        <FieldDate
          name="finPeriodeReference"
          label="Date de fin (jj/mm/aaaa)"
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}

const hasMustBeDateError = (meta: FieldMetaState<string>) =>
  meta.error && meta.touched && meta.error.mustBeDate;

function FieldDate({
  name,
  label,
  readOnly
}: {
  name: string;
  label: string;
  readOnly: boolean;
}) {
  const field = useField(name, { validate: validateDate });
  const error = hasFieldError(field.meta);
  const mustBeDateError = hasMustBeDateError(field.meta);

  return (
    <div css={styles.dateField}>
      <label
        css={[styles.label, error && styles.labelError]}
        htmlFor={field.input.name}
      >
        {label}
      </label>
      <div css={styles.fieldRow}>
        <Field name={name} validate={validateDate}>
          {props => (
            <DatePicker
              locale="fr"
              dateFormat="dd/MM/yyyy"
              selected={parseDate(props.input.value)}
              onChange={date =>
                date ? props.input.onChange(dateToString(date)) : ""
              }
              readOnly={readOnly}
            />
          )}
        </Field>
      </div>
      <p css={styles.error}>
        {error &&
          (mustBeDateError
            ? "ce champ doit contenir une date au format jj/mm/aaaa"
            : "ce champ n’est pas valide, renseignez une date au format jj/mm/aaaa")}
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
    input: { borderRadius: 4 },
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
    marginTop: 5
  }),
  edit: css({
    marginTop: 14,
    marginBottom: 14,
    textAlign: "center"
  })
};

export default InformationsForm;
