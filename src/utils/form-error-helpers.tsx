import React from "react"

export const displayMetaErrors: React.FC<{ [key: string]: string }> = (error) =>
  error ? (
    <>
      {Object.keys(error)
        .map((key) => error[key])
        .join(". ")}
    </>
  ) : null
