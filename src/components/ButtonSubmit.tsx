import React from "react"
import ButtonAction, { ButtonActionProps } from "./ButtonAction"

function ButtonSubmit({ label, loading = false }: ButtonActionProps) {
  return <ButtonAction label={label} type="submit" disabled={loading} loading={loading} size="lg" />
}

export default ButtonSubmit
