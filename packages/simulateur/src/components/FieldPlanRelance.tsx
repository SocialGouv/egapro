import React from "react"
import { useField } from "react-final-form"
import RequiredRadiosBoolean from "./RequiredRadiosBoolean"

export type FieldPlanRelanceProps = {
  readOnly: boolean
  isUES: boolean
}

const FieldPlanRelance = ({ readOnly, isUES }: FieldPlanRelanceProps) => {
  const field = useField("planRelance")

  return (
    <>
      <RequiredRadiosBoolean
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
      {/* No need to handle errors, because it is managed by RequiredRadiosBoolean */}
    </>
  )
}

export default FieldPlanRelance
