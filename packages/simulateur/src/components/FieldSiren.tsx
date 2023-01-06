import moize from "moize"
import React, { FunctionComponent } from "react"
import { useField } from "react-final-form"

import { EntrepriseType } from "../globals"
import { ownersForSiren, validateSiren } from "../utils/api"
import { composeValidators, required, ValidatorFunction } from "../utils/formHelpers"
import { useUser } from "./AuthContext"
import InputGroup from "./ds/InputGroup"
import TextLink from "./ds/TextLink"

const nineDigits: ValidatorFunction = (value) =>
  value.length === 9 ? undefined : "Ce champ n'est pas valide, renseignez un numéro Siren de 9 chiffres."

const moizeConfig = {
  maxSize: 1000,
  maxAge: 1000 * 60 * 60, // 1 hour
  isPromise: true,
}

const memoizedValidateSiren = moize(moizeConfig)(validateSiren)

export const NOT_ALLOWED_MESSAGE =
  "Votre email de connexion ({{email}}) n'est pas rattaché au numéro Siren de l'entreprise."

const UNKNOWN_SIREN =
  "Ce Siren n'existe pas, veuillez vérifier votre saisie, sinon veuillez contacter votre référent de l'égalité professionnelle."

const CLOSED_SIREN = "Le Siren saisi correspond à une entreprise fermée, veuillez vérifier votre saisie."

const INVALID_SIREN = "Le Siren est invalide."

const FOREIGN_SIREN = "Le Siren saisi correspond à une entreprise étrangère."

async function checkSiren(siren: string, year: number) {
  try {
    const result = await memoizedValidateSiren(siren, year)
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

export const checkSirenWithoutOwner =
  (year: number) => (updateSirenData: (data: EntrepriseType) => void) => async (siren: string) => {
    try {
      const result = await checkSiren(siren, year)
      updateSirenData(result.jsonBody)
    } catch (error: unknown) {
      updateSirenData({})
      return (error as Error).message
    }
  }

export const checkSirenWithOwner =
  (year: number) => (updateSirenData: (data: EntrepriseType) => void) => async (siren: string, allValues: any) => {
    let result

    try {
      result = await checkSiren(siren, year)
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

export const sirenValidator = (year: number) => (updateSirenData: (data: EntrepriseType) => void) =>
  // By default, check the siren with the owner.
  composeValidators(required, nineDigits, checkSirenWithoutOwner(year)(updateSirenData))

export const sirenValidatorWithOwner = (year: number) => (updateSirenData: (data: EntrepriseType) => void) =>
  // By default, check the siren with the owner.
  composeValidators(required, nineDigits, checkSirenWithOwner(year)(updateSirenData))

type FieldSirenProps = {
  name: string
  label: string
  readOnly: boolean
  updateSirenData?: (sirenData: EntrepriseType) => void
  validator?: ValidatorFunction
  year: number
}

const FieldSiren: FunctionComponent<FieldSirenProps> = ({
  name,
  label,
  readOnly,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  updateSirenData = () => {},
  validator,
  year,
}) => {
  const field = useField(name, {
    // We need to stick year in a curry function, to make the validator have access to it in checkSiren...
    // This would be better with context, to get access to the year without prop drilling and with React Hook Form, which doesn't constrain on which validator to use.
    validate: validator ? validator : sirenValidatorWithOwner(year)(updateSirenData),
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

  const notAllowedErrorForAuthenticatedUser = !email
    ? NOT_ALLOWED_MESSAGE
    : NOT_ALLOWED_MESSAGE.replace("{{email}}", email)

  const buildLabelError = (error: string) =>
    error === NOT_ALLOWED_MESSAGE ? notAllowedErrorForAuthenticatedUser : error

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
            <div>
              {buildLabelError(field.meta.error)}
              {field.meta.error === NOT_ALLOWED_MESSAGE && (
                <>
                  {" "}
                  Vous devez faire une demande de rattachement en remplissant le formulaire{" "}
                  <TextLink to="/ajout-declarant">ici</TextLink>.
                </>
              )}
            </div>
          </>
        ),
      }}
    />
  )
}

export default FieldSiren
