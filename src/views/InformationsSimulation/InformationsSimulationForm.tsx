/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Form, useField } from "react-final-form";

import {
  AppState,
  FormState,
  ActionInformationsSimulationData,
} from "../../globals";

import {
  mustBeNumber,
  parseIntFormValue,
  parseIntStateValue,
  parseTrancheEffectifsFormValue,
  required,
} from "../../utils/formHelpers";
import { parseDate } from "../../utils/helpers";

import ActionBar from "../../components/ActionBar";
import ActionLink from "../../components/ActionLink";
import AnneeDeclaration from "../../components/AnneeDeclaration";
import FieldDate from "../../components/FieldDate";
import FormAutoSave from "../../components/FormAutoSave";
import FormSubmit from "../../components/FormSubmit";
import Input, { hasFieldError } from "../../components/Input";
import RadioLabels from "../../components/RadioLabels";
import { ButtonSimulatorLink } from "../../components/SimulatorLink";
import globalStyles from "../../utils/globalStyles";
import ButtonAction from "../../components/ButtonAction";

///////////////////

const validate = (value: string) => {
  const requiredError = required(value);
  if (!requiredError) {
    return undefined;
  } else {
    return {
      required: requiredError,
    };
  }
};

const validateInt = (value: string) => {
  const requiredError = required(value);
  const mustBeNumberError = mustBeNumber(value);
  if (!requiredError && !mustBeNumberError) {
    return undefined;
  } else {
    return { required: requiredError, mustBeNumber: mustBeNumberError };
  }
};

const validateForm = ({
  nomEntreprise,
  anneeDeclaration,
  finPeriodeReference,
}: {
  nomEntreprise: string;
  anneeDeclaration: string;
  finPeriodeReference: string;
}) => {
  const parsedFinPeriodeReference = parseDate(finPeriodeReference);
  return {
    nomEntreprise: validate(nomEntreprise),
    anneeDeclaration: validateInt(anneeDeclaration),
    finPeriodeReference:
      parsedFinPeriodeReference !== undefined &&
      parsedFinPeriodeReference.getFullYear().toString() === anneeDeclaration
        ? undefined
        : {
            correspondanceAnneeDeclaration:
              "L'année de fin de période de référence doit correspondre à l'année au titre de laquelle les indicateurs sont calculés",
          },
  };
};

interface Props {
  informations: AppState["informations"];
  readOnly: boolean;
  updateInformationsSimulation: (
    data: ActionInformationsSimulationData
  ) => void;
  validateInformationsSimulation: (valid: FormState) => void;
}

function InformationsSimulationForm({
  informations,
  readOnly,
  updateInformationsSimulation,
  validateInformationsSimulation,
}: Props) {
  const initialValues = {
    nomEntreprise: informations.nomEntreprise,
    trancheEffectifs: informations.trancheEffectifs,
    anneeDeclaration: parseIntStateValue(informations.anneeDeclaration),
    finPeriodeReference: informations.finPeriodeReference,
  };

  const saveForm = (formData: any) => {
    const {
      nomEntreprise,
      trancheEffectifs,
      anneeDeclaration,
      finPeriodeReference,
    } = formData;

    updateInformationsSimulation({
      nomEntreprise,
      trancheEffectifs: parseTrancheEffectifsFormValue(trancheEffectifs),
      anneeDeclaration: parseIntFormValue(anneeDeclaration),
      finPeriodeReference,
    });
  };

  const onSubmit = (formData: any) => {
    saveForm(formData);
    validateInformationsSimulation("Valid");
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
      mutators={{
        selectEndOfYear: (args, state, utils) => {
          const anneeDeclaration = parseIntFormValue(
            (state.formState.values as any).anneeDeclaration
          );
          if (!anneeDeclaration) return;
          utils.changeValue(
            state,
            "finPeriodeReference",
            () => `31/12/${anneeDeclaration}`
          );
        },
      }}
    >
      {({ form, handleSubmit, hasValidationErrors, submitFailed, values }) => (
        <form onSubmit={handleSubmit} css={styles.container}>
          {/* pass `onlyWhenDirty={false}` because we want the form to always
          auto save, as we update the left menu depending on the "tranche
          d'effectifs". Otherwise it would not re-update the menu when
          switching back to the original value */}
          <FormAutoSave saveForm={saveForm} onlyWhenDirty={false} />
          <FieldNomEntreprise readOnly={readOnly} />

          <RadioLabels
            fieldName="trancheEffectifs"
            label="Quelle est la tranche d'effectifs de l'entreprise ou de l'UES ?"
            choices={[
              {
                label: "Entre 50 et 250",
                value: "50 à 250",
              },
              {
                label: "Entre 251 et 999",
                value: "251 à 999",
              },
              {
                label: "1000 et plus",
                value: "1000 et plus",
              },
            ]}
            value={values.trancheEffectifs}
            readOnly={readOnly}
          />

          <AnneeDeclaration
            label="Année au titre de laquelle les indicateurs sont calculés"
            name="anneeDeclaration"
            readOnly={readOnly}
          />

          <FieldPeriodeReference
            readOnly={readOnly || !parseIntFormValue(values.anneeDeclaration)}
            onClick={form.mutators.selectEndOfYear}
          />

          {readOnly ? (
            <ActionBar>
              <ButtonSimulatorLink to="/effectifs" label="suivant" />
              &emsp;
              {informations.formValidated === "Valid" && (
                <p css={styles.edit}>
                  <ActionLink
                    onClick={() => validateInformationsSimulation("None")}
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
        Quel est le nom de la simulation (ex : nom_entreprise_date)
      </label>
      <div css={styles.fieldRow}>
        <Input field={field} readOnly={readOnly} />
      </div>
      <p css={styles.error}>{error && "le nom n’est pas valide"}</p>
    </div>
  );
}

function FieldPeriodeReference({
  readOnly,
  onClick,
}: {
  readOnly: boolean;
  onClick: () => void;
}) {
  return (
    <div>
      <label css={styles.label}>
        Date de fin de la période de référence choisie pour le calcul de votre
        Index (jj/mm/aaaa)
      </label>
      <div css={styles.dates}>
        <FieldDate name="finPeriodeReference" readOnly={readOnly} label="" />
        <ButtonAction
          label="sélectionner la fin de l'année civile"
          onClick={onClick}
          outline={readOnly}
        />
      </div>
    </div>
  );
}

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column",
  }),
  formField: css({
    marginBottom: 20,
  }),
  label: css({
    fontSize: 14,
    fontWeight: "bold",
    lineHeight: "17px",
  }),
  labelError: css({
    color: globalStyles.colors.error,
  }),
  fieldRow: css({
    height: 38,
    marginTop: 5,
    marginBottom: 5,
    display: "flex",
    input: {
      borderRadius: 4,
      border: "1px solid",
    },
    "input[readonly]": { border: 0 },
  }),
  error: css({
    height: 18,
    color: globalStyles.colors.error,
    fontSize: 12,
    textDecoration: "underline",
    lineHeight: "15px",
  }),
  dates: css({
    display: "flex",
    justifyContent: "space-between",
    "> *": { width: "48% !important" },
  }),
  edit: css({
    marginTop: 14,
    marginBottom: 14,
    textAlign: "center",
  }),
};

export default InformationsSimulationForm;
