import React, { FunctionComponent } from "react"
import { Box, Flex, Text } from "@chakra-ui/react"
import { Field, Form } from "react-final-form"
import { Link } from "react-router-dom"

import { AppState, FormState, ActionInformationsDeclarantData } from "../../globals"

import { mustBeNumber, required, validateEmail } from "../../utils/formHelpers"

import ActionBar from "../../components/ActionBar"
import FormAutoSave from "../../components/FormAutoSave"
import FormSubmit from "../../components/FormSubmit"
import FakeInputGroup from "../../components/ds/FakeInputGroup"
import { ButtonSimulatorLink } from "../../components/SimulatorLink"
import ButtonAction from "../../components/ds/ButtonAction"
import { IconEdit } from "../../components/ds/Icons"
import InputGroup from "../../components/ds/InputGroup"
import FormStack from "../../components/ds/FormStack"

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

interface InformationsDeclarantFormProps {
  informationsDeclarant: AppState["informationsDeclarant"]
  readOnly: boolean
  updateInformationsDeclarant: (data: ActionInformationsDeclarantData) => void
  validateInformationsDeclarant: (valid: FormState) => void
}

const InformationsDeclarantForm: FunctionComponent<InformationsDeclarantFormProps> = ({
  informationsDeclarant,
  readOnly,
  updateInformationsDeclarant,
  validateInformationsDeclarant,
}) => {
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
        <form onSubmit={handleSubmit}>
          <FormAutoSave saveForm={saveForm} />
          <FormStack>
            <InputGroup
              label="Nom du déclarant"
              fieldName="nom"
              message={{ error: "Le nom n’est pas valide" }}
              isReadOnly={readOnly}
              autocomplete="family-name"
            />
            <InputGroup
              label="Prénom du déclarant"
              fieldName="prenom"
              message={{ error: "Le prénom n’est pas valide" }}
              isReadOnly={readOnly}
              autocomplete="given-name"
            />
            <InputGroup
              label="Numéro de téléphone"
              fieldName="tel"
              message={{ error: "Le numéro de téléphone doit être composé de 10 chiffres" }}
              isReadOnly={readOnly}
              autocomplete="tel-national"
            />
            <FakeInputGroup label="Email (fourni lors de la demande de validation de l'email)">
              {initialValues.email}
            </FakeInputGroup>
            <Field name="acceptationCGU" component="input" type="checkbox">
              {({ input, meta }: { input: any; meta: any }) => (
                <div>
                  <label>
                    <Flex>
                      <input {...input} disabled={readOnly} />
                      <Box as="span" fontSize="sm" ml={2} mt={-1}>
                        J'accepte l'utilisation de mes données à caractère personnel pour réaliser des statistiques et
                        pour vérifier la validité de ma déclaration. Pour en savoir plus sur l'usage de ces données,
                        vous pouvez consulter nos <Link to="/cgu">Conditions Générales d'Utilisation</Link>.
                      </Box>
                    </Flex>
                  </label>
                  {meta.error && meta.touched && (
                    <Text color="red.500" fontSize="sm" pl={5}>
                      Veuillez accepter les CGUs
                    </Text>
                  )}
                </div>
              )}
            </Field>
          </FormStack>
          {readOnly ? (
            <ActionBar>
              <ButtonSimulatorLink to="/declaration" label="Suivant" />
              &emsp;
              {informationsDeclarant.formValidated === "Valid" && (
                <ButtonAction
                  leftIcon={<IconEdit />}
                  label="Modifier les données saisies"
                  onClick={() => validateInformationsDeclarant("None")}
                  variant="link"
                  size="sm"
                />
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

export default InformationsDeclarantForm
