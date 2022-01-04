/** @jsx jsx */
import { css, jsx } from "@emotion/react"
import { useField } from "react-final-form"
import { Link } from "@chakra-ui/react"

import Input from "./Input"
import globalStyles from "../utils/globalStyles"
import { isEmpty } from "../utils/object"
import { composeValidators, required, simpleMemoize, ValidatorFunction } from "../utils/formHelpers"
import { ownersForSiren, validateSiren } from "../utils/api"
import { EntrepriseType } from "../globals"
import ActivityIndicator from "./ActivityIndicator"
import { useUser } from "../utils/hooks"
import { IconExternalLink } from "./ds/Icons"
import React from "react"

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
  } catch (error) {
    console.error(error)
    updateSirenData({})
    return `Numéro SIREN invalide: ${siren}`
  }

  try {
    await ownersForSiren(siren)
  } catch (error) {
    console.error(error)
    updateSirenData({})
    return NOT_ALLOWED_MESSAGE
  }

  if (isEmpty(result?.jsonBody)) {
    updateSirenData({})
    return UNKNOWN_SIREN
  }

  updateSirenData(result.jsonBody)
}

export const sirenValidator = (updateSirenData: (data: EntrepriseType) => void) =>
  composeValidators(required, nineDigits, checkSiren(updateSirenData))

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
              Pour faire une demande à l'équipe Egapro,&nbsp;
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
