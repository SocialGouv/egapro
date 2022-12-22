import React, { FunctionComponent } from "react"
import { Box, Flex, Text } from "@chakra-ui/react"
import { Field, Form } from "react-final-form"
import { Link } from "react-router-dom"
import { z } from "zod"

import { AppState, FormState, ActionInformationsDeclarantData } from "../../globals"

import FakeInputGroup from "../../components/ds/FakeInputGroup"
import ButtonAction from "../../components/ds/ButtonAction"
import { IconEdit } from "../../components/ds/Icons"
import InputGroup from "../../components/ds/InputGroup"
import FormStack from "../../components/ds/FormStack"
import { formValidator } from "../../components/ds/form-lib"
import ActionBar from "../../components/ActionBar"
import FormAutoSave from "../../components/FormAutoSave"
import FormSubmit from "../../components/FormSubmit"
import { ButtonSimulatorLink } from "../../components/SimulatorLink"
import FormError from "../../components/FormError"

const FormInputs = z.object({
  nom: z
    .string({
      required_error: "Le nom ne peut pas être vide",
      invalid_type_error: "Le nom n’est pas valide",
    })
    .min(1, { message: "Le nom ne peut pas être vide" }),
  prenom: z
    .string({
      required_error: "Le prénom ne peut pas être vide",
      invalid_type_error: "Le prénom n'est pas valide",
    })
    .min(1, { message: "Le prénom ne peut pas être vide" }),
  tel: z.string({ required_error: "Le numéro de téléphone est requis" }).regex(new RegExp("^[0-9]{10}$"), {
    message: "Le numéro de téléphone doit être composé de 10 chiffres",
  }),
  email: z.string({ required_error: "L'adresse mail est requise" }).email({ message: "L'adresse mail est invalide" }),
  acceptationCGU: z.literal(true, {
    invalid_type_error: "Veuillez accepter les CGUs",
  }),
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
      validate={formValidator(FormInputs)}
      // mandatory to not change user inputs
      // because we want to keep wrong string inside the input
      // we don't want to block string value
      initialValuesEqual={() => true}
    >
      {({ handleSubmit, hasValidationErrors, submitFailed }) => (
        <form onSubmit={handleSubmit}>
          <FormAutoSave saveForm={saveForm} />
          <FormStack>
            {submitFailed && hasValidationErrors && (
              <FormError message="Cette page ne peut être validée car tous les champs ne sont pas renseignés." />
            )}
            <InputGroup label="Nom du déclarant" fieldName="nom" isReadOnly={readOnly} autocomplete="family-name" />
            <InputGroup
              label="Prénom du déclarant"
              fieldName="prenom"
              isReadOnly={readOnly}
              autocomplete="given-name"
            />
            <InputGroup
              label="Numéro de téléphone"
              fieldName="tel"
              isReadOnly={readOnly}
              autocomplete="tel-national"
              type="tel"
            />
            <FakeInputGroup label="Email (saisi lors de la validation de l'email)">
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
              <FormSubmit />
            </ActionBar>
          )}
        </form>
      )}
    </Form>
  )
}

export default InformationsDeclarantForm
