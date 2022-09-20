import React, { FunctionComponent } from "react"
import clsx from "clsx"

export type FormGroupMessageProps = {
  id: string
  isValid?: boolean
}

export const FormGroupMessage: FunctionComponent<FormGroupMessageProps> = ({ isValid, id, children }) => {
  return (
    <p id={`${id}-msg`} className={clsx(isValid ? "fr-valid-text" : "fr-error-text")}>
      {children}
    </p>
  )
}
