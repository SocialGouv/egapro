import moize from "moize"
import React, { FunctionComponent } from "react"
import { useField } from "react-final-form"

import { EntrepriseType } from "../globals"
import { ownersForSiren, validateSiren } from "../utils/api"
import { composeValidators, required, ValidatorFunction } from "../utils/formHelpers"
import { useUser } from "./AuthContext"
import InputGroup from "./ds/InputGroup"
import MailtoLink from "./MailtoLink"

const nineDigits: ValidatorFunction = (value) =>
  value.length === 9 ? undefined : "Ce champ n'est pas valide, renseignez un numéro SIREN de 9 chiffres."

const moizeConfig = {
  maxSize: 1000,
  maxAge: 1000 * 60 * 60, // 1 hour
  isPromise: true,
}

const memoizedValidateSiren = moize(moizeConfig)(validateSiren)

const NOT_ALLOWED_MESSAGE = "L'email saisi n'est pas rattaché au Siren de votre entreprise."

const UNKNOWN_SIREN =
  "Ce SIREN n'existe pas, veuillez vérifier votre saisie, sinon veuillez contacter votre référent de l'égalité professionnelle."

const CLOSED_SIREN = "Le SIREN saisi correspond à une entreprise fermée, veuillez vérifier votre saisie."

const INVALID_SIREN = "Le SIREN est invalide."

const FOREIGN_SIREN = "Le SIREN saisi correspond à une entreprise étrangère."

async function checkSiren(siren: string) {
  try {
    const result = await memoizedValidateSiren(siren)
    return result
  } catch (error: any) {
    console.error(error?.response?.status, error)

    if (error?.response?.status === 404) {
      if (/Le Siren saisi correspond à une entreprise fermée/i.test(error?.jsonBody?.error)) {
        throw new Error(CLOSED_SIREN)
      }
      throw new Error(UNKNOWN_SIREN)
    }

    if (
      error?.response?.status === 422 &&
      /Le Siren saisi correspond à une entreprise étrangère/i.test(error?.jsonBody?.error)
    ) {
      throw new Error(FOREIGN_SIREN)
    }

    throw new Error(INVALID_SIREN)
  }
}

export const checkSirenWithoutOwner = (updateSirenData: (data: EntrepriseType) => void) => async (siren: string) => {
  try {
    const result = await checkSiren(siren)
    updateSirenData(result.jsonBody)
  } catch (error: unknown) {
    updateSirenData({})
    return (error as Error).message
  }
}

export const checkSirenWithOwner = (updateSirenData: (data: EntrepriseType) => void) => async (siren: string) => {
  let result
  try {
    result = await checkSiren(siren)
  } catch (error: unknown) {
    updateSirenData({})
    return (error as Error).message
  }

  try {
    await ownersForSiren(siren)
  } catch (error) {
    console.error(error)
    updateSirenData({})
    return NOT_ALLOWED_MESSAGE
  }

  updateSirenData(result.jsonBody)
}

export const sirenValidator = (updateSirenData: (data: EntrepriseType) => void) =>
  // By default, check the siren with the owner.
  composeValidators(required, nineDigits, checkSirenWithoutOwner(updateSirenData))

export const sirenValidatorWithOwner = (updateSirenData: (data: EntrepriseType) => void) =>
  // By default, check the siren with the owner.
  composeValidators(required, nineDigits, checkSirenWithOwner(updateSirenData))

type FieldSirenProps = {
  name: string
  label: string
  readOnly: boolean
  updateSirenData: (sirenData: EntrepriseType) => void
  validator?: ValidatorFunction
}

const FieldSiren: FunctionComponent<FieldSirenProps> = ({ name, label, readOnly, updateSirenData, validator }) => {
  const field = useField(name, {
    validate: validator ? validator : sirenValidatorWithOwner(updateSirenData),
    validateFields: [],
  })
  const { meta } = field

  const { email } = useUser()

  // For required and 9digits validators, we want to display errors onBlur or onSubmit.
  // But for sirenValidator, we want to display errors as soon as the API answers us.
  const error =
    (meta?.error && meta?.submitFailed) ||
    (meta?.error && meta?.touched) ||
    meta?.error === NOT_ALLOWED_MESSAGE ||
    meta?.error === UNKNOWN_SIREN

  return (
    <InputGroup
      isReadOnly={readOnly}
      isLoading={field.meta.validating}
      fieldName={field.input.name}
      label={label}
      hasError={error}
      message={{
        error: (
          <>
            <div>{field.meta.error}</div>
            {field.meta.error === NOT_ALLOWED_MESSAGE && (
              <div style={{ marginTop: 10 }}>
                Pour poursuivre votre déclaration, vous devez faire une demande de rattachement en cliquant&nbsp;
                <MailtoLink siren={field.input.value} email={email}>
                  ici
                </MailtoLink>
                .
                <br />
                (si ce lien ne fonctionne pas, vous pouvez nous envoyer votre Siren et email à<br />
                dgt.ega-pro@travail.gouv.fr).
              </div>
            )}
          </>
        ),
      }}
    />
  )
}

export default FieldSiren
