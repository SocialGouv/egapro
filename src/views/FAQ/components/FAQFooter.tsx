import React from "react"
import { Box, Text } from "@chakra-ui/react"

import TextLink from "../../../components/ds/TextLink"

const FAQFooter = () => (
  <Box borderTop="1px solid" borderColor="gray.200" pt={6} mt={6}>
    <Text fontSize="sm">Vous n’avez pas trouvé l’aide que vous cherchiez&nbsp;?</Text>
    <Text mt={1} fontSize="xs">
      <TextLink to="https://travail-emploi.gouv.fr/IMG/xlsx/referents_egalite_professionnelle.xlsx" isExternal>
        Télécharger la liste des référents Egapro (XLSX, 22 Ko)
      </TextLink>
    </Text>
  </Box>
)

export default FAQFooter
