import React from "react"
import { Box, Text } from "@chakra-ui/layout"
import { Spinner } from "@chakra-ui/spinner"
import { Link as RouterLink } from "react-router-dom"
import { Link, Table, Thead, Tbody, Tr, Th, Td, TableContainer } from "@chakra-ui/react"

import { DeclarationForAPI, useDeclarations } from "../hooks/useDeclaration"
import { format, parseISO } from "date-fns"
import { IconInvalid, IconValid } from "./ds/Icons"
import { DeclarationTotale } from "../utils/helpers"

function formatDate(stringDate: string | undefined) {
  if (!stringDate) return ""

  const date = parseISO(stringDate)
  if (date.toString() === "Invalid Date") return

  return format(date, "dd/MM/yyyy")
}

const trancheFromApiToForm = (declaration: DeclarationForAPI | undefined): string => {
  const tranche = declaration?.data.entreprise.effectif?.tranche
  if (!tranche) return ""
  return tranche === "50:250" ? "Entre 50 et 250" : tranche === "251:999" ? "Entre 251 et 999" : "1000 et plus"
}

const DeclarationsListe: React.FunctionComponent<{ siren: string }> = ({ siren }) => {
  const { declarations, isLoading } = useDeclarations(siren)

  const yearsDeclarations = Object.keys(declarations).sort().reverse()

  return (
    <Box mt="4">
      {isLoading ? (
        <Box m="6">
          <Spinner />
        </Box>
      ) : (
        <Box m="6">
          <Text fontSize="md" fontWeight="bold" color="green.500" mb="2">
            Liste des déclarations
          </Text>

          <TableContainer>
            <Table variant="simple" aria-label="Liste des déclarations">
              <Thead>
                <Tr>
                  <Th>SIREN</Th>
                  <Th>Année indicateurs</Th>
                  <Th>Structure</Th>
                  <Th>Tranche d'effectifs</Th>
                  <Th>Date de déclaration</Th>
                  <Th>Index</Th>
                  <Th>Objectifs et mesures</Th>
                </Tr>
              </Thead>
              <Tbody>
                {yearsDeclarations.map((annee: string) => (
                  <Tr key={annee}>
                    <Td>{siren}</Td>
                    <Td>{annee}</Td>
                    <Td>{declarations[annee]?.data?.entreprise.ues ? "UES" : "Entreprise"}</Td>
                    <Td>{trancheFromApiToForm(declarations[annee])}</Td>
                    <Td>{formatDate(declarations[annee]?.data?.déclaration?.date)}</Td>
                    <Td>
                      {declarations[annee]?.data?.déclaration?.index === undefined ? (
                        <span title="Non calculable">NC</span>
                      ) : (
                        declarations[annee]?.data?.déclaration?.index
                      )}
                    </Td>
                    <Td>
                      {statusDeclaration(declarations[annee]?.data) === "À renseigner" ? (
                        <>
                          <IconInvalid mr="2" color="red.500" />
                          <Link as={RouterLink} to={"/tableauDeBord/objectifs-mesures/" + siren + "/" + annee}>
                            À renseigner
                          </Link>
                        </>
                      ) : statusDeclaration(declarations[annee]?.data) === "Renseignés" ? (
                        <>
                          <IconValid mr="2" color="green.500" />
                          <Link as={RouterLink} to={"/tableauDeBord/objectifs-mesures/" + siren + "/" + annee}>
                            Déjà renseignés
                          </Link>
                        </>
                      ) : (
                        <Box>{statusDeclaration(declarations[annee]?.data)}</Box>
                      )}
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

type Status = "Non applicable" | "À renseigner" | "Index supérieur à 85" | "Renseignés" | "Année non applicable"

function statusDeclaration({ déclaration }: DeclarationTotale): Status {
  if (!déclaration || déclaration.index === undefined || !déclaration.année_indicateurs || !déclaration.publication)
    return "Non applicable"
  if (déclaration.année_indicateurs < 2021) return "Année non applicable"
  if (déclaration.index >= 85) return "Index supérieur à 85"
  if (!déclaration.publication.date_publication_objectifs) return "À renseigner"
  return "Renseignés"
}

export default DeclarationsListe
