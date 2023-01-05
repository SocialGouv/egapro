import { Text } from "@chakra-ui/react"
import * as React from "react"

import { useUser } from "../AuthContext"
import TextLink from "./TextLink"

const NoSiren: React.FC = () => {
  const { email } = useUser()

  return (
    <>
      <Text>
        Votre email de connexion ({email}) n'est rattaché à aucun numéro Siren. Vous devez faire une demande de
        rattachement en remplissant le formulaire <TextLink to="/ajout-déclarant">ici</TextLink>.
      </Text>
    </>
  )
}

export default NoSiren
