/** @jsx jsx */
import { css, jsx } from "@emotion/core"
import { Field, Form } from "react-final-form"
import { Link } from "react-router-dom"

import globalStyles from "../../utils/globalStyles"

import { AppState, FormState, ActionInformationsDeclarantData } from "../../globals"

import { mustBeNumber, required, validateEmail } from "../../utils/formHelpers"

import ActionBar from "../../components/ActionBar"
import ActionLink from "../../components/ActionLink"
import FormAutoSave from "../../components/FormAutoSave"
import FormSubmit from "../../components/FormSubmit"
import TextField from "../../components/TextField"
import { ButtonSimulatorLink } from "../../components/SimulatorLink"

///////////////////

const validate = (value: string) => {
  const requiredError = required(value)
  if (!requiredError) {
    return undefined
  } else {
    return {
      required: requiredError,
    }
  }
}

const validateTel = (value: string) => {
  const requiredError = required(value)
  const mustBeNumberError = mustBeNumber(value)
  const mustBe10DigitsError = value && value.length !== 10
  if (!requiredError && !mustBeNumberError && !mustBe10DigitsError) {
    return undefined
  } else {
    return {
      required: requiredError,
      mustBeNumber: mustBeNumberError,
      mustBe10Digits: mustBe10DigitsError,
    }
  }
}

const validateForm = ({
  nom,
  prenom,
  tel,
  email,
  acceptationCGU,
}: {
  nom: string
  prenom: string
  tel: string
  email: string
  acceptationCGU: boolean
}) => ({
  nom: validate(nom),
  prenom: validate(prenom),
  tel: validateTel(tel),
  email: validateEmail(email) ? { invalid: true } : undefined,
  acceptationCGU: acceptationCGU ? undefined : { invalid: true },
})

interface Props {
  informationsDeclarant: AppState["informationsDeclarant"]
  readOnly: boolean
  updateInformationsDeclarant: (data: ActionInformationsDeclarantData) => void
  validateInformationsDeclarant: (valid: FormState) => void
}

function InformationsDeclarantForm({
  informationsDeclarant,
  readOnly,
  updateInformationsDeclarant,
  validateInformationsDeclarant,
}: Props) {
  const initialValues: ActionInformationsDeclarantData = {
    nom: informationsDeclarant.nom,
    prenom: informationsDeclarant.prenom,
    tel: informationsDeclarant.tel,
    email: informationsDeclarant.email,
    acceptationCGU: informationsDeclarant.acceptationCGU,
  }

  const saveForm = (formData: any) => {
    const { nom, prenom, tel, email, acceptationCGU } = formData

    updateInformationsDeclarant({
      nom,
      prenom,
      tel,
      email,
      acceptationCGU,
    })
  }

  const onSubmit = (formData: any) => {
    saveForm(formData)
    validateInformationsDeclarant("Valid")
  }

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
          <FormAutoSave saveForm={saveForm} />

          <TextField label="Nom du déclarant" fieldName="nom" errorText="le nom n’est pas valide" readOnly={readOnly} />
          <TextField
            label="Prénom du déclarant"
            fieldName="prenom"
            errorText="le prénom n’est pas valide"
            readOnly={readOnly}
          />
          <TextField
            label="Numéro de téléphone"
            fieldName="tel"
            errorText="le numéro de téléphone doit être composé de 10 chiffres"
            readOnly={readOnly}
          />
          <TextField
            label="Email (fourni lors de la demande de validation de l'email)"
            fieldName="email"
            errorText="l'email n’est pas valide"
            readOnly={true}
          />
          <Field name="acceptationCGU" component="input" type="checkbox">
            {({ input, meta }: { input: any; meta: any }) => (
              <label css={styles.label}>
                <input {...input} disabled={readOnly} /> J'accepte l'utilisation de mes données à caractère personnel
                pour réaliser des statistiques et pour vérifier la validité de ma déclaration. Pour en savoir plus sur
                l'usage de ces données, vous pouvez consulter nos{" "}
                <Link to="/cgu">Conditions Générales d'Utilisation</Link>
                {meta.error && meta.touched && <p css={styles.error}>veuillez accepter les CGUs</p>}
              </label>
            )}
          </Field>
          {readOnly ? (
            <ActionBar>
              <ButtonSimulatorLink to="/declaration" label="suivant" />
              &emsp;
              {informationsDeclarant.formValidated === "Valid" && (
                <p css={styles.edit}>
                  <ActionLink onClick={() => validateInformationsDeclarant("None")}>
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
  )
}

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column",
  }),
  edit: css({
    marginTop: 14,
    marginBottom: 14,
    textAlign: "center",
  }),
  label: css({
    fontSize: 14,
  }),
  error: css({
    height: 18,
    color: globalStyles.colors.error,
    fontSize: 12,
    textDecoration: "underline",
    lineHeight: "15px",
  }),
}

export default InformationsDeclarantForm
