import { chakra, Text } from "@chakra-ui/react"
import * as React from "react"
import TextLink from "./TextLink"

const NoSiren: React.FC = () => {
  return (
    <>
      <Text>Votre email n'est rattaché à aucun Siren.</Text>
      <Text mt="4">
        Vous pouvez faire une demande de rattachement en cliquant{" "}
        <TextLink to="mailto:dgt.ega-pro@travail.gouv.fr" isExternal>
          ici
        </TextLink>
        .
      </Text>
      <Text mt="4">
        Si ce lien ne fonctionne pas, vous pouvez nous envoyer votre Siren et email à{" "}
        <chakra.span bgColor="orange.100" px="2" py="1" borderRadius="4" fontWeight="semibold">
          dgt.ega-pro@travail.gouv.fr
        </chakra.span>
        .
      </Text>
    </>
  )
}

export default NoSiren
