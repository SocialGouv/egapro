import { Box, Text } from "@chakra-ui/layout"
import { Link, Table, TableContainer, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react"
import { Spinner } from "@chakra-ui/spinner"
import React from "react"

import { formatDate } from "../utils/date"
import { useRepEqs } from "../hooks/useRepEq"
import { RepresentationEquilibree } from "../app-models"

type RepEqMotif = NonNullable<
  | RepresentationEquilibree["motif_non_calculabilité_cadres"]
  | RepresentationEquilibree["motif_non_calculabilité_membres"]
>
const repEqWordingMap: Record<RepEqMotif, string> = {
  aucun_cadre_dirigeant: "Aucun cadre dirigeant",
  aucune_instance_dirigeante: "Aucune instance dirigeante",
  un_seul_cadre_dirigeant: "Un seul cadre dirigeant",
}

const RepEqsListe: React.FunctionComponent<{ siren: string }> = ({ siren }) => {
  const { repEqs, isLoading, message } = useRepEqs(siren)

  const yearsRepEqs = Object.keys(repEqs).sort().reverse()

  return (
    <Box mt="4">
      <Box m="6">
        <Text fontSize="md" fontWeight="bold" color="green.500" mb="2">
          Liste des déclarations transmises - Représentation Équilibrée
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
                {yearsRepEqs.map((annee: string) => {
                  const motifNcCadres =
                    repEqs[annee]?.data?.indicateurs?.représentation_équilibrée?.motif_non_calculabilité_cadres
                  const motifNcMembres =
                    repEqs[annee]?.data?.indicateurs?.représentation_équilibrée?.motif_non_calculabilité_membres
                  return (
                    <Tr key={annee}>
                      <Td>
                        <Link href={`/representation-equilibree/${siren}/${annee}`} isExternal>
                          {siren}
                        </Link>
                      </Td>
                      <Td>{annee}</Td>
                      <Td>{formatDate(repEqs[annee]?.data?.déclaration?.date)}</Td>
                      {motifNcCadres ? (
                        <>
                          <Td title={repEqWordingMap[motifNcCadres]}>NC</Td>
                          <Td title={repEqWordingMap[motifNcCadres]}>NC</Td>
                        </>
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
                      {motifNcMembres ? (
                        <>
                          <Td title={repEqWordingMap[motifNcMembres]}>NC</Td>
                          <Td title={repEqWordingMap[motifNcMembres]}>NC</Td>
                        </>
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
                        <Link href={`/api/representation-equilibree/${siren}/${annee}/pdf`} isExternal>
                          Télécharger
                        </Link>
                      </Td>
                    </Tr>
                  )
                })}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  )
}

export default RepEqsListe
