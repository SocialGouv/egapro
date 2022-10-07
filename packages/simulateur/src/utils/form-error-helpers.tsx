import React from "react"

export type MetaErrorProps = { [key: string]: string }

export const displayMetaErrors = (error: MetaErrorProps) =>
  error ? (
    <>
      {Object.keys(error)
        .map((key) => error[key])
        .join(". ")}
    </>
  ) : null
