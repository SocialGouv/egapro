import { Box, Text } from "@chakra-ui/layout"
import { Link, Table, TableContainer, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react"
import { Spinner } from "@chakra-ui/spinner"
import React from "react"

import { formatDate } from "../utils/date"
import { useRepEqs } from "../hooks/useRepEq"

const RepEqsListe: React.FunctionComponent<{ siren: string }> = ({ siren }) => {
  const { repEqs, isLoading, message } = useRepEqs(siren)

  const yearsRepEqs = Object.keys(repEqs).sort().reverse()

  return (
    <Box mt="4">
      <Box m="6">
        <Text fontSize="md" fontWeight="bold" color="green.500" mb="2">
          Liste des déclarations - Représentation Équilibrée
        </Text>
        {isLoading ? (
          <Spinner />
        ) : message?.kind === "error" ? (
          <Text>{message.text}</Text>
        ) : (
          <TableContainer>
            <Table variant="simple" aria-label="Liste des déclarations">
              <Thead>
                <Tr>
                  <Th>Siren</Th>
                  <Th>Année écarts</Th>
                  <Th>Date de déclaration</Th>
                  <Th>% femmes cadres</Th>
                  <Th>% hommes cadres</Th>
                  <Th>% femmes membres</Th>
                  <Th>% hommes membres</Th>
                  <Th>Récap</Th>
                </Tr>
              </Thead>
              <Tbody>
                {yearsRepEqs.map((annee: string) => (
                  <Tr key={annee}>
                    <Td>
                      <Link target="_blank" href={`/representation-equilibree/${siren}/${annee}`}>
                        {siren}
                      </Link>
                    </Td>
                    <Td>{annee}</Td>
                    <Td>{formatDate(repEqs[annee]?.data?.déclaration?.date)}</Td>
                    {repEqs[annee]?.data?.indicateurs?.représentation_équilibrée?.motif_non_calculabilité_cadres ? (
                      <Td colSpan={2} textAlign="center">
                        {repEqs[annee]?.data?.indicateurs?.représentation_équilibrée?.motif_non_calculabilité_cadres}
                      </Td>
                    ) : (
                      <>
                        <Td>
                          {repEqs[annee]?.data?.indicateurs?.représentation_équilibrée?.pourcentage_femmes_cadres}%
                        </Td>
                        <Td>
                          {repEqs[annee]?.data?.indicateurs?.représentation_équilibrée?.pourcentage_hommes_cadres}%
                        </Td>
                      </>
                    )}
                    {repEqs[annee]?.data?.indicateurs?.représentation_équilibrée?.motif_non_calculabilité_membres ? (
                      <Td colSpan={2} textAlign="center">
                        {repEqs[annee]?.data?.indicateurs?.représentation_équilibrée?.motif_non_calculabilité_membres}
                      </Td>
                    ) : (
                      <>
                        <Td>
                          {repEqs[annee]?.data?.indicateurs?.représentation_équilibrée?.pourcentage_femmes_membres}%
                        </Td>
                        <Td>
                          {repEqs[annee]?.data?.indicateurs?.représentation_équilibrée?.pourcentage_hommes_membres}%
                        </Td>
                      </>
                    )}
                    <Td>
                      <Link target="_blank" href={`/api/representation-equilibree/${siren}/${annee}/pdf`}>
                        Télécharger
                      </Link>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  )
}

export default RepEqsListe
