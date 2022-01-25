/** @jsx jsx */
import { FunctionComponent } from "react"

import { Fragment } from "react"
import { jsx } from "@emotion/react"

export const displayMetaErrors: FunctionComponent<{ [key: string]: string }> = (error) => (
  <Fragment>
    {Object.keys(error)
      .map((key) => error[key])
      .join(", ")}
  </Fragment>
)
