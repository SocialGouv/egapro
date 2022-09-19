import React, { FunctionComponent } from "react"
import clsx from "clsx"

import { iconStyles } from "../../../utils/icon-styles"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  isError?: boolean
  isValid?: boolean
  isDisabled?: boolean
  icon?: iconStyles
  id: string
}

const Input: FunctionComponent<InputProps> = ({ type = "text", isError, isValid, isDisabled, icon, id, ...rest }) => {
  return (
    <div className={clsx("fr-input-wrap", icon, type === "date" && "fr-icon-calendar-line")}>
      <input
        id={id}
        className={clsx("fr-input", isError && "fr-input--error", isValid && "fr-input--valid")}
        type={type}
        disabled={isDisabled}
        aria-describedby={`${id}-msg`}
        {...rest}
      />
    </div>
  )
}

export default Input
