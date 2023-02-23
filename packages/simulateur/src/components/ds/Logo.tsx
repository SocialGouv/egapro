import React, { FunctionComponent } from "react"
import { Image } from "@chakra-ui/react"

export type LogoProps = Record<string, unknown>

const Logo: FunctionComponent<LogoProps> = () => {
  return (
    <Image
      src={process.env.PUBLIC_URL + "/marianne.svg"}
      alt="Aller à la page d'accueil du Ministère du travail, du plein Emploi et de l'Insertion"
      width={88}
    />
  )
}

export default Logo
