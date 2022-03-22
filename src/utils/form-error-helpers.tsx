/** @jsxImportSource @emotion/react */
import { Fragment, FunctionComponent } from "react"

export const displayMetaErrors: FunctionComponent<{ [key: string]: string }> = (error) => (
  <Fragment>
    {Object.keys(error)
      .map((key) => error[key])
      .join(", ")}
  </Fragment>
)
