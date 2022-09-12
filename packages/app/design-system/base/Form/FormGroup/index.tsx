import React, { FunctionComponent } from "react"
import clsx from "clsx"

export type FormGroupProps = {
  isError?: boolean
  isValid?: boolean
}
const FormGroup: FunctionComponent<FormGroupProps> = ({ isValid, isError, children }) => {
  return (
    <div className={clsx("fr-input-group", isValid && "fr-input-group--valid", isError && "fr-input-group--error")}>
      {children}
    </div>
  )
}

export default FormGroup
