import { Text } from "@chakra-ui/react"
import * as React from "react"

import { useUser } from "../AuthContext"
import MailtoLink from "../MailtoLink"

const NoSiren: React.FC = () => {
  const { email } = useUser()

  return (
    <>
      <Text>Votre email n'est rattaché à aucun Siren.</Text>
      <Text mt="4">
        Vous pouvez faire une demande rattachement en indiquant votre Siren et email en cliquant&nbsp;
        <MailtoLink email={email}>ici</MailtoLink>.
      </Text>
      <Text mt="4">
        Si ce lien ne fonctionne pas, vous pouvez nous envoyer votre Siren et email à dgt.ega-pro@travail.gouv.fr .
      </Text>
    </>
  )
}

export default NoSiren
