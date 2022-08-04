import { Text } from "@chakra-ui/react"
import * as React from "react"
import { Link } from "@chakra-ui/react"

import { useUser } from "../AuthContext"
import { IconExternalLink } from "./Icons"

const NoSiren: React.FC = () => {
  const { email } = useUser()

  return (
    <>
      <Text>Votre email n'est rattaché à aucun Siren.</Text>
      <Text mt="4">
        Vous pouvez faire une demande rattachement en indiquant votre SIREN et email en cliquant{" "}
        <Link
          isExternal
          textDecoration="underline"
          href={`mailto:dgt.ega-pro@travail.gouv.fr?subject=EgaPro - Demander à être déclarant d'un SIREN&body=Bonjour, je souhaite être déclarant pour le SIREN >>indiquer votre SIREN<<. Mon email de déclaration est ${email}. Cordialement.`}
        >
          ici&nbsp;
          <IconExternalLink sx={{ transform: "translateY(.125rem)" }} />
        </Link>
        .
      </Text>
      <Text mt="4">
        Si ce lien ne fonctionne pas, vous pouvez nous envoyer votre SIREN et email à dgt.ega-pro@travail.gouv.fr .
      </Text>
    </>
  )
}

export default NoSiren
