import React from "react"
import { useField } from "react-final-form"
import { displayMetaErrors } from "../utils/form-error-helpers"
import { required } from "../utils/formHelpers"
import { hasFieldError } from "./Input"
import RadiosBoolean from "./RadiosBoolean"

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

export type FieldPlanRelanceProps = {
  readOnly: boolean
  isUES: boolean
}

const FieldPlanRelance = ({ readOnly, isUES }: FieldPlanRelanceProps) => {
  const field = useField("planRelance", { validate })
  const error = hasFieldError(field.meta)

  return (
    <>
      <RadiosBoolean
        fieldName="planRelance"
        value={field.input.value}
        readOnly={readOnly}
        label={
          isUES ? (
            <>
              Une ou plusieurs entreprises comprenant au moins 50 salariés au sein de l'UES a-t-elle bénéficié, depuis
              2021, d'une aide prévue par la loi du 29 décembre 2020 de finances pour 2021 au titre de la mission « Plan
              de relance »&nbsp;?
            </>
          ) : (
            <>
              Avez-vous bénéficié, depuis 2021, d'une aide prévue par la loi du 29 décembre 2020 de finances pour 2021
              au titre de la mission « Plan de relance »&nbsp;?
            </>
          )
        }
      />
      <p>{error && displayMetaErrors(field.meta.error)}</p>
    </>
  )
}

export default FieldPlanRelance
