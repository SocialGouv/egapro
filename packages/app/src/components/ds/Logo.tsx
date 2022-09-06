import React, { FunctionComponent } from "react"
import { Image } from "@chakra-ui/react"

export type LogoProps = Record<string, unknown>

const Logo: FunctionComponent<LogoProps> = () => {
  return (
    <Image
      src={"/icons/marianne.svg"}
      alt="Aller à la page d'accueil du Ministère du travail, de l'emploi et de l'insertion"
      width={88}
    />
  )
}

export default Logo
