/** @jsx jsx */
import { Fragment, useState } from "react";
import { css, jsx } from "@emotion/core";
import arrayMutators from "final-form-arrays";
import { Form } from "react-final-form";
import { FieldArray } from "react-final-form-arrays";

import {
  AppState,
  FormState,
  ActionInformationsEntrepriseData,
  Structure
} from "../../globals";

import globalStyles from "../../utils/globalStyles";

import { required } from "../../utils/formHelpers";

import ActionBar from "../../components/ActionBar";
import ActionLink from "../../components/ActionLink";
import FieldSiren from "../../components/FieldSiren";
import FormAutoSave from "../../components/FormAutoSave";
import FormSubmit from "../../components/FormSubmit";
import InputField from "./components/EntrepriseUESInputField";
import ModalConfirmDelete from "./components/EntrepriseUESModalConfirmDelete";
import RadioButtons from "../../components/RadioButtons";
import RegionsDepartements from "../../components/RegionsDepartements";
import TextField from "../../components/TextField";
import { ButtonSimulatorLink } from "../../components/SimulatorLink";
import { Modal } from "../../components/ModalContext";

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
  nomUES:
    structure === "Unité Economique et Sociale (UES)"
      ? validate(nomUES)
      : undefined
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
      entreprisesUES
    });
  };

  const onSubmit = (formData: any) => {
    saveForm(formData);
    validateInformationsEntreprise("Valid");
  };

  const [indexEntrepriseToDelete, setIndexEntrepriseToDelete] = useState<
    number | undefined
  >(undefined);
  const confirmEntrepriseToDelete = (index: number) =>
    setIndexEntrepriseToDelete(index);
  const closeModal = () => setIndexEntrepriseToDelete(undefined);

  return (
    <Form
      onSubmit={onSubmit}
      mutators={{
        // potentially other mutators could be merged here
        ...arrayMutators
      }}
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
          <FieldSiren label="siren" name="siren" readOnly={readOnly} />
          <TextField
            label="code NAF"
            fieldName="codeNaf"
            errorText="le code NAF n'est pas valide"
            readOnly={readOnly}
          />
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
            <Fragment>
              <TextField
                label="Nom de l'UES"
                fieldName="nomUES"
                errorText="le nom de l'UES n'est pas valide"
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
                          deleteEntrepriseUES={confirmEntrepriseToDelete}
                          readOnly={readOnly}
                        />
                      ))}
                      {readOnly ? (
                        <div css={styles.spacerAdd} />
                      ) : (
                        <ActionLink
                          onClick={() => fields.push({ nom: "", siren: "" })}
                          style={styles.add}
                        >
                          <div css={styles.addIcon}>
                            <svg
                              width="26"
                              height="26"
                              viewBox="0 0 26 26"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M12.9992 24.174V1.82597M1.8252 13H24.1733"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                          </div>
                          <span>ajouter une entreprise dans l'UES</span>
                        </ActionLink>
                      )}
                      <Modal
                        isOpen={indexEntrepriseToDelete !== undefined}
                        onRequestClose={closeModal}
                      >
                        <ModalConfirmDelete
                          closeModal={closeModal}
                          deleteEntreprise={() => {
                            indexEntrepriseToDelete !== undefined &&
                              fields.remove(indexEntrepriseToDelete);
                          }}
                        />
                      </Modal>
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
