import React from "react"
import { Box, Text, Link } from "@chakra-ui/react"

const FAQFooter = () => (
  <Box borderTop="1px solid" borderColor="gray.200" pt={6} mt={6}>
    <Text fontSize="sm">Vous n’avez pas trouvé l’aide que vous cherchiez&nbsp;?</Text>
    <Text mt={1} fontSize="xs">
      <Link
        href="https://travail-emploi.gouv.fr/IMG/xlsx/referents_egalite_professionnelle.xlsx"
        sx={{
          _hover: {
            textDecoration: "initial",
          },
        }}
      >
        Télécharger la{" "}
        <Box as="span" textDecoration="underline">
          liste des référents Egapro (XLSX, 22 Ko)
        </Box>
      </Link>
    </Text>
  </Box>
)

export default FAQFooter
