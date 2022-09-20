import React, { FunctionComponent } from "react"
import clsx from "clsx"

export type FormLabelProps = {
  htmlFor: string
  as?: "label" | "legend"
  hint?: string
}

export const FormLabel: FunctionComponent<FormLabelProps> = ({ as: HtmlTag = "label", htmlFor, hint, children }) => {
  return (
    <HtmlTag className={clsx("fr-label", HtmlTag === "legend" && "fr-pl-0")} htmlFor={htmlFor}>
      {children}
      {hint && (
        <span className="fr-hint-text" id={`${htmlFor}-hint`}>
          {hint}
        </span>
      )}
    </HtmlTag>
  )
}
