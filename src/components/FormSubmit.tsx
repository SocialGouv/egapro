import React, { FunctionComponent } from "react"

import ButtonAction from "./ds/ButtonAction"

interface FormSubmitProps {
  loading?: boolean
  label?: string
}

const FormSubmit: FunctionComponent<FormSubmitProps> = ({
  loading = false,
  label = "Valider les" + " informations",
}) => {
  return <ButtonAction label={label} type="submit" disabled={loading} loading={loading} size="lg" />
}

export default FormSubmit
