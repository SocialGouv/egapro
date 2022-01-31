import React, { FunctionComponent } from "react"
import { Link } from "@chakra-ui/react"
import { useField } from "react-final-form"

import { composeValidators, required, simpleMemoize, ValidatorFunction } from "../utils/formHelpers"
import { ownersForSiren, validateSiren } from "../utils/api"
import { EntrepriseType } from "../globals"
import { useUser } from "./AuthContext"
import { IconExternalLink } from "./ds/Icons"
import InputGroup from "./ds/InputGroup"

const nineDigits: ValidatorFunction = (value) =>
  value.length === 9 ? undefined : "Ce champ n’est pas valide, renseignez un numéro SIREN de 9 chiffres."

const memoizedValidateSiren = simpleMemoize(async (siren: string) => await validateSiren(siren))

const NOT_ALLOWED_MESSAGE = "Vous n'êtes pas autorisé à déclarer pour ce SIREN."
const UNKNOWN_SIREN =
  "Ce Siren n'existe pas, veuillez vérifier votre saisie, sinon veuillez contacter votre référent de l'égalité professionnelle."

export const checkSiren = (updateSirenData: (data: EntrepriseType) => void) => async (siren: string) => {
  let result
  try {
    result = await memoizedValidateSiren(siren)
  } catch (error: any) {
    console.error(error?.response?.status, error)
    updateSirenData({})

    if (error?.response?.status === 404) {
      return UNKNOWN_SIREN
    }
    return `Numéro SIREN invalide: ${siren}`
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
  composeValidators(required, nineDigits, checkSiren(updateSirenData))

type FieldSirenProps = {
  name: string
  label: string
  readOnly: boolean
  updateSirenData: (sirenData: EntrepriseType) => void
  validator?: ValidatorFunction
}

const FieldSiren: FunctionComponent<FieldSirenProps> = ({ name, label, readOnly, updateSirenData, validator }) => {
  const field = useField(name, {
    validate: validator ? validator : sirenValidator(updateSirenData),
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
              <div>
                Pour faire une demande à l'équipe Egapro,&nbsp;
                <Link
                  isExternal
                  textDecoration="underline"
                  href={`mailto:dgt.ega-pro@travail.gouv.fr?subject=EgaPro - Demander à être déclarant d'un SIREN&body=Bonjour, je souhaite être déclarant pour le SIREN ${field.input.value}. Mon email de déclaration est ${email}. Cordialement.`}
                >
                  cliquez ici&nbsp;
                  <IconExternalLink sx={{ transform: "translateY(.125rem)" }} />
                </Link>
                .
              </div>
            )}
          </>
        ),
      }}
    />
  )
}

export default FieldSiren
