import React, { FunctionComponent } from "react"

import ButtonAction from "./ds/ButtonAction"

interface FormSubmitProps {
  loading?: boolean
  disabled?: boolean
  label?: string
  size?: "sm" | "md" | "lg" | "xs"
}

const FormSubmit: FunctionComponent<FormSubmitProps> = ({
  loading = false,
  disabled = false,
  label = "Valider les informations",
  size = "lg",
}) => {
  return <ButtonAction label={label} type="submit" disabled={disabled || loading} loading={loading} size={size} />
}

export default FormSubmit
