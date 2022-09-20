import React, { FunctionComponent } from "react"

export type LogoProps = {}

export const Logo: FunctionComponent<LogoProps> = () => {
  return (
    <p className="fr-logo">
      Ministère <br />
      du Travail,
      <br /> de l’Emploi
      <br /> et de l’Insertion
    </p>
  )
}
