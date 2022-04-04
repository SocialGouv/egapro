import { fractionToPercentage, parseDate, percentageToFraction } from "./helpers"

import { PeriodeDeclaration, TrancheEffectifs } from "../globals"
import { FieldMetaState } from "react-final-form"

// INT PARSE

export const parseIntFormValue = (value: string, defaultValue: any = undefined) =>
  value === "" ? defaultValue : Number.isNaN(Number(value)) ? defaultValue : parseInt(value, 10)

export const parseIntStateValue = (value: number | undefined) => (value === undefined ? "" : String(value))

// Float PARSE

export const parseFloatFormValue = (value: string, defaultValue: any = undefined) =>
  value === "" ? defaultValue : Number.isNaN(Number(value)) ? defaultValue : percentageToFraction(parseFloat(value))

export const parseFloatStateValue = (value: number | undefined) =>
  value === undefined ? "" : String(fractionToPercentage(value))

// Boolean PARSE

export const parseBooleanFormValue = (value: string) => value === "true"

export const parseBooleanStateValue = (value: boolean) => String(value)

// PeriodeDeclaration PARSE

export const parsePeriodeDeclarationFormValue = (value: string): PeriodeDeclaration => {
  switch (value) {
    case "deuxPeriodesReference":
      return "deuxPeriodesReference" as PeriodeDeclaration
    case "troisPeriodesReference":
      return "troisPeriodesReference" as PeriodeDeclaration
    default:
      return "unePeriodeReference" as PeriodeDeclaration
  }
}

// TrancheEffectif PARSE

export const parseTrancheEffectifsFormValue = (value: string): TrancheEffectifs => {
  switch (value) {
    case "251 à 999":
      return "251 à 999" as TrancheEffectifs
    case "1000 et plus":
      return "1000 et plus" as TrancheEffectifs
    default:
      return "50 à 250" as TrancheEffectifs
  }
}

// VALIDATION

export type ValidatorFunction = (value: string, allValues?: any) => undefined | string
export type AsyncValidatorFunction = (value: string, allValues?: string[]) => Promise<undefined | string>
export type FormValidatorFunction = (values: Record<string, unknown>) => undefined | string

export const required: ValidatorFunction = (value) => (value ? undefined : "Ce champ ne peut être vide")

export const mustBeNumber: ValidatorFunction = (value) =>
  isNaN(Number(value)) ? "Renseignez une valeur numérique" : undefined

export const mustBeInteger: ValidatorFunction = (value) =>
  Number.isInteger(Number(value)) ? undefined : "Renseignez une valeur entière, sans virgule"

export const minNumber: (min: number) => ValidatorFunction = (min) => (value) =>
  isNaN(Number(value)) || Number(value) >= min ? undefined : `La valeur doit être supérieure à ${min}`

export const maxNumber: (max: number) => ValidatorFunction = (max) => (value) =>
  isNaN(Number(value)) || Number(value) <= max ? undefined : `La valeur doit être inférieure à ${max}`

export const mustBeDate: ValidatorFunction = (value) => {
  const parsed = parseDate(value)
  return parsed === undefined || parsed.toString() === "ce champ doit contenir une date au format jj/mm/aaaa"
    ? "Ce champ doit contenir une date au format jj/mm/aaaa"
    : undefined
}

export const validateDate = (value: string) => {
  const requiredError = required(value)
  const mustBeDateError = mustBeDate(value)
  if (!requiredError && !mustBeDateError) {
    return undefined
  } else {
    return {
      required: requiredError,
      mustBeDate: mustBeDateError,
    }
  }
}

const regexpEmail =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
export const validateEmail = (email: string) => !regexpEmail.test(email)

export const composeValidators =
  (...validators: Array<ValidatorFunction | AsyncValidatorFunction>) =>
  (value: string, allValues?: any) =>
    validators.reduce((error: undefined | string, validator: any) => error || validator(value, allValues), undefined)

export const composeFormValidators =
  (...validators: Array<FormValidatorFunction>) =>
  (value: Record<string, unknown>) =>
    validators.reduce(
      (error: undefined | string, validator: FormValidatorFunction) => error || validator(value),
      undefined,
    )

export function isFormValid(formState: { formValidated: string }) {
  return formState.formValidated === "Valid"
}

export const isFieldHasError = (meta: FieldMetaState<string>): boolean =>
  (meta.error && meta.submitFailed) ||
  (meta.error && meta.touched && Object.values({ ...meta.error, required: false }).includes(true))
