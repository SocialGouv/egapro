import { Box, Text } from "@chakra-ui/layout"
import { Link, Table, TableContainer, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react"
import { Spinner } from "@chakra-ui/spinner"
import React from "react"
import { Link as RouterLink } from "react-router-dom"

import type { DeclarationAPI } from "../utils/declarationBuilder"

import { useDeclarations } from "../hooks/useDeclaration"
import { buildHelpersObjectifsMesures } from "../views/private/ObjectifsMesuresPage"
import { IconInvalid, IconValid } from "./ds/Icons"
import { formatDate } from "../utils/date"
import { useRepEqs } from "../hooks/useRepEq"

const trancheFromApiToForm = (declaration: DeclarationAPI | undefined): string => {
  const tranche = declaration?.data.entreprise.effectif?.tranche
  if (!tranche) return ""
  return tranche === "50:250" ? "Entre 50 et 250" : tranche === "251:999" ? "Entre 251 et 999" : "1000 et plus"
}

const RepEqsListe: React.FunctionComponent<{ siren: string }> = ({ siren }) => {
  const { repEqs, isLoading } = useRepEqs(siren)

  const yearsRepEqs = Object.keys(repEqs).sort().reverse()

  return (
    <Box mt="4">
      {isLoading ? (
        <Box m="6">
          <Spinner />
        </Box>
      ) : (
        <Box m="6">
          <Text fontSize="md" fontWeight="bold" color="green.500" mb="2">
            Liste des déclarations - Représentation Équilibrée
          </Text>

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
                      <a>{siren}</a>
                    </Td>
                    <Td>{annee}</Td>
                    <Td>{formatDate(repEqs[annee]?.data?.déclaration?.date)}</Td>
                    {repEqs[annee]?.data?.indicateurs?.représentation_équilibrée?.motif_non_calculabilité_cadres ? (
                      <Td colSpan={2}></Td>
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
                      <Td colSpan={2}></Td>
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
                      <a>Télécharger</a>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  )
}

export default RepEqsListe
