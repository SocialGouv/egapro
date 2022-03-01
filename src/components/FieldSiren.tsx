/** @jsx jsx */
import { css, jsx } from "@emotion/react"
import { useField } from "react-final-form"
import { Link } from "@chakra-ui/react"

import Input from "./Input"
import globalStyles from "../utils/globalStyles"
import { composeValidators, required, ValidatorFunction } from "../utils/formHelpers"
import { ownersForSiren, validateSiren } from "../utils/api"
import { EntrepriseType } from "../globals"
import ActivityIndicator from "./ActivityIndicator"
import { useUser } from "./AuthContext"
import { IconExternalLink } from "./ds/Icons"
import React from "react"
import moize from "moize"

const nineDigits: ValidatorFunction = (value) =>
  value.length === 9 ? undefined : "Ce champ n'est pas valide, renseignez un numéro SIREN de 9 chiffres."

const moizeConfig = {
  maxSize: 1000,
  maxAge: 1000 * 60 * 60, // 1 hour
  isPromise: true,
}

const memoizedValidateSiren = moize(moizeConfig)(validateSiren)

const NOT_ALLOWED_MESSAGE = "Vous n'êtes pas autorisé à déclarer pour ce SIREN."

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
      throw new Error(UNKNOWN_SIREN)
    } else if (/Le Siren saisi correspond à une entreprise fermée/i.test(error?.jsonBody?.error)) {
      throw new Error(CLOSED_SIREN)
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

export function FieldSirenReadOnly({ name, label }: { name: string; label: string }) {
  const field = useField(name)

  return (
    <div css={[styles.formField]}>
      <label css={[styles.label]} htmlFor={field.input.name}>
        {label}
      </label>
      <div css={styles.fieldRow}>
        <Input field={field} readOnly={true} />
      </div>
    </div>
  )
}

function FieldSiren({
  name,
  label,
  readOnly,
  updateSirenData,
  validator,
  customStyles,
}: {
  name: string
  label: string
  readOnly: boolean
  updateSirenData: (sirenData: EntrepriseType) => void
  validator?: ValidatorFunction
  customStyles?: any
}) {
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
    <div css={[customStyles, styles.formField]}>
      <label css={[styles.label, error && styles.labelError]} htmlFor={field.input.name}>
        {label}
      </label>
      <div css={styles.fieldRow}>
        <Input field={field} readOnly={readOnly} />
        {field.meta.validating && (
          <div css={styles.spinner}>
            <ActivityIndicator size={30} color={globalStyles.colors.primary} />
          </div>
        )}
      </div>
      {error && (
        <p css={styles.error}>
          {field.meta.error}
          {field.meta.error === NOT_ALLOWED_MESSAGE && (
            <React.Fragment>
              <br />
              Pour faire une demande d'autorisation à l'équipe Egapro,&nbsp;
              <Link
                isExternal
                textDecoration="underline"
                href={`mailto:dgt.ega-pro@travail.gouv.fr?subject=EgaPro - Demander à être déclarant d'un SIREN&body=Bonjour, je souhaite être déclarant pour le SIREN ${field.input.value}. Mon email de déclaration est ${email}. Cordialement.`}
              >
                cliquez ici&nbsp;
                <IconExternalLink />
              </Link>
              .
            </React.Fragment>
          )}
        </p>
      )}
    </div>
  )
}

const styles = {
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
    position: "relative",
  }),
  error: css({
    height: 18,
    color: globalStyles.colors.error,
    fontSize: 12,
    lineHeight: "15px",
  }),
  spinner: css({
    position: "absolute",
    right: 4,
    top: 4,
  }),
}

export default FieldSiren
