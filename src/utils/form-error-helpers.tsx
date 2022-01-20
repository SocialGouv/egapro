/** @jsx jsx */
import { Fragment } from "react"
import { jsx } from "@emotion/react"

export const displayMetaErrors = (error: { [key: string]: string }) => (
  <Fragment>
    {Object.keys(error)
      .map((key) => error[key])
      .join(", ")}
  </Fragment>
)
