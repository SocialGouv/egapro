/** @jsx jsx */
import { Fragment } from "react";
import { css, jsx } from "@emotion/core";
import { MutableState, Tools } from "final-form";
import arrayMutators from "final-form-arrays";
import { Form } from "react-final-form";
import createDecorator from "final-form-calculate";
import { FieldArray } from "react-final-form-arrays";

import {
  AppState,
  FormState,
  ActionInformationsEntrepriseData,
  Structure,
  EntrepriseUES
} from "../../globals";

import globalStyles from "../../utils/globalStyles";

import {
  mustBeNumber,
  parseIntFormValue,
  parseIntStateValue,
  required
} from "../../utils/formHelpers";

import ActionBar from "../../components/ActionBar";
import ActionLink from "../../components/ActionLink";
import CodeNaf from "../../components/CodeNaf";
import FieldSiren from "../../components/FieldSiren";
import FormAutoSave from "../../components/FormAutoSave";
import FormSubmit from "../../components/FormSubmit";
import InputField from "./components/EntrepriseUESInputField";
import NombreEntreprises, {
  validate as validateNombreEntreprises
} from "../../components/NombreEntreprises";
import RadioButtons from "../../components/RadioButtons";
import RegionsDepartements from "../../components/RegionsDepartements";
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

const validateCodePostal = (value: string) => {
  const requiredError = required(value);
  const mustBeNumberError = mustBeNumber(value);
  const mustBe5DigitsError = value && value.length !== 5;
  if (!requiredError && !mustBeNumberError && !mustBe5DigitsError) {
    return undefined;
  } else {
    return {
      required: requiredError,
      mustBeNumber: mustBeNumberError,
      mustBe5Digits: mustBe5DigitsError
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
  nomUES,
  nombreEntreprises
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
  nombreEntreprises: string;
}) => ({
  nomEntreprise: validate(nomEntreprise),
  siren: validate(siren),
  codeNaf: validate(codeNaf),
  region: validate(region),
  departement: validate(departement),
  adresse: validate(adresse),
  codePostal: validateCodePostal(codePostal),
  commune: validate(commune),
  structure: validate(structure),
  nomUES:
    structure === "Unité Economique et Sociale (UES)"
      ? validate(nomUES)
      : undefined
});

const calculator = createDecorator({
  field: "nombreEntreprises",
  updates: {
    entreprisesUES: (nombreEntreprises, { entreprisesUES }: any) =>
      adaptEntreprisesUESSize(nombreEntreprises, entreprisesUES)
  }
});

const adaptEntreprisesUESSize = (
  nombreEntreprises: string,
  entreprisesUES: Array<EntrepriseUES>
) => {
  if (validateNombreEntreprises(nombreEntreprises) === undefined) {
    const newSize = Number(nombreEntreprises);
    while (newSize > entreprisesUES.length) {
      // Augmenter la taille de l'array si nécessaire
      entreprisesUES.push({ nom: "", siren: "" });
    }
    // Réduire la taille de l'array si nécessaire
    entreprisesUES.length = newSize;
  }
  return entreprisesUES;
};

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
  const initialValues = {
    nomEntreprise: informationsEntreprise.nomEntreprise,
    siren: informationsEntreprise.siren,
    codeNaf: informationsEntreprise.codeNaf,
    region: informationsEntreprise.region,
    departement: informationsEntreprise.departement,
    adresse: informationsEntreprise.adresse,
    codePostal: informationsEntreprise.codePostal,
    commune: informationsEntreprise.commune,
    structure: informationsEntreprise.structure,
    nomUES: informationsEntreprise.nomUES,
    nombreEntreprises: parseIntStateValue(
      informationsEntreprise.nombreEntreprises
    ),
    entreprisesUES: informationsEntreprise.entreprisesUES
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
      nomUES,
      nombreEntreprises,
      entreprisesUES
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
      nomUES,
      nombreEntreprises: parseIntFormValue(nombreEntreprises),
      entreprisesUES
    });
  };

  const onSubmit = (formData: any) => {
    saveForm(formData);
    validateInformationsEntreprise("Valid");
  };

  // Form mutator utilisé par le composant NombreEntreprise pour ne changer la
  // valeur du state qu'une fois la confirmation validée
  const newNombreEntreprises = (
    [name, newValue]: [string, string],
    state: MutableState<any>,
    { changeValue }: Tools<any>
  ) => {
    changeValue(state, name, () => newValue);
  };

  return (
    <Form
      onSubmit={onSubmit}
      mutators={{
        // potentially other mutators could be merged here
        newNombreEntreprises,
        ...arrayMutators
      }}
      initialValues={initialValues}
      validate={validateForm}
      decorators={[calculator]}
      // mandatory to not change user inputs
      // because we want to keep wrong string inside the input
      // we don't want to block string value
      initialValuesEqual={() => true}
    >
      {({ form, handleSubmit, values, hasValidationErrors, submitFailed }) => (
        <form onSubmit={handleSubmit} css={styles.container}>
          <FormAutoSave saveForm={saveForm} />
          <RadioButtons
            fieldName="structure"
            label="je déclare l'index en tant que"
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

          <TextField
            label={
              values.structure === "Unité Economique et Sociale (UES)"
                ? "Raison sociale de l'entreprise déclarant pour le compte de l'UES"
                : "Raison sociale de l'entreprise"
            }
            fieldName="nomEntreprise"
            errorText="le nom de l'entreprise n'est pas valide"
            readOnly={readOnly}
          />
          <FieldSiren label="SIREN" name="siren" readOnly={readOnly} />
          <CodeNaf label="Code NAF" name="codeNaf" readOnly={readOnly} />
          <RegionsDepartements
            nameRegion="region"
            nameDepartement="departement"
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

          {values.structure === "Unité Economique et Sociale (UES)" && (
            <Fragment>
              <NombreEntreprises
                fieldName="nombreEntreprises"
                label="Nombre d'entreprises composant l'UES"
                errorText="le nombre d'entreprises composant l'UES doit être un nombre supérieur ou égal à 2"
                entreprisesUES={informationsEntreprise.entreprisesUES}
                newNombreEntreprises={form.mutators.newNombreEntreprises}
                readOnly={readOnly}
              />
              <FieldArray name="entreprisesUES">
                {({ fields }) => {
                  return (
                    <Fragment>
                      {fields.map((entrepriseUES, index) => (
                        <InputField
                          key={entrepriseUES}
                          nom={`${entrepriseUES}.nom`}
                          siren={`${entrepriseUES}.siren`}
                          index={index}
                          readOnly={readOnly}
                        />
                      ))}
                    </Fragment>
                  );
                }}
              </FieldArray>
            </Fragment>
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
  }),
  add: css({
    display: "flex",
    alignItems: "center",
    marginTop: 46 - 18 - 5,
    textDecoration: "none"
  }),
  addIcon: css({
    width: 32,
    height: 32,
    marginRight: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: globalStyles.colors.default,
    borderRadius: 16
  }),
  spacerAdd: css({
    height: 32,
    marginTop: 46 - 18 - 5
  })
};

export default InformationsEntrepriseForm;
