import { Box, Text } from "@chakra-ui/layout"
import { Link, Table, TableContainer, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react"
import { Spinner } from "@chakra-ui/spinner"
import React from "react"
import { Link as RouterLink } from "react-router-dom"

import type { DeclarationAPI } from "../utils/declarationBuilder"

import { useDeclarations } from "../hooks/useDeclaration"
import { buildHelpersObjectifsMesures, isFrozenDeclarationForOPMC } from "../views/private/ObjectifsMesuresPage"
import { IconInvalid, IconValid } from "./ds/Icons"
import { formatDate } from "../utils/date"

const trancheFromApiToForm = (declaration?: DeclarationAPI): string => {
  const tranche = declaration?.data.entreprise.effectif?.tranche
  if (!tranche) return ""
  return tranche === "50:250" ? "Entre 50 et 250" : tranche === "251:999" ? "Entre 251 et 999" : "1000 et plus"
}

const DeclarationsListe: React.FunctionComponent<{ siren: string }> = ({ siren }) => {
  const { declarations, isLoading, message } = useDeclarations(siren)

  const yearsDeclarations = Object.keys(declarations).sort().reverse()

  return (
    <Box mt="4">
      <Box m="6">
        <Text fontSize="md" fontWeight="bold" color="green.500" mb="2">
          Liste des déclarations transmises - Index Égalité Professionnelle
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
                  <Th>SIREN</Th>
                  <Th>Année indicateurs</Th>
                  <Th>Structure</Th>
                  <Th>Tranche d'effectifs</Th>
                  <Th>Date de transmission</Th>
                  <Th>Index</Th>
                  <Th>Objectifs et mesures</Th>
                  <Th>Récap</Th>
                </Tr>
              </Thead>
              <Tbody>
                {yearsDeclarations.map((annee: string) => (
                  <Tr key={annee}>
                    <Td>
                      <Link
                        href={`${
                          process.env.REACT_APP_DECLARATION_URL || "/index-egapro/declaration/"
                        }/?siren=${siren}&year=${annee}`}
                        isExternal
                      >
                        {siren}
                      </Link>
                    </Td>
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
                      {statusDeclaration(declarations[annee]) === "À renseigner" ||
                      statusDeclaration(declarations[annee]) ===
                        "Déclaration non modifiable sur données incorrectes" ? (
                        <>
                          <IconInvalid mr="2" color="red.500" />
                          <Link as={RouterLink} to={"/tableauDeBord/objectifs-mesures/" + siren + "/" + annee}>
                            {statusDeclaration(declarations[annee]) === "À renseigner"
                              ? "À renseigner"
                              : "Déclaration non modifiable"}
                          </Link>
                        </>
                      ) : statusDeclaration(declarations[annee]) === "Renseignés" ||
                        statusDeclaration(declarations[annee]) ===
                          "Déclaration non modifiable sur données correctes" ? (
                        <>
                          <IconValid mr="2" color="green.500" />
                          <Link as={RouterLink} to={"/tableauDeBord/objectifs-mesures/" + siren + "/" + annee}>
                            Déjà renseignés
                          </Link>
                        </>
                      ) : (
                        <Box>{statusDeclaration(declarations[annee])}</Box>
                      )}
                    </Td>
                    <Td>
                      <Link href={`/api/declaration/${siren}/${annee}/pdf`} isExternal>
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

type StatusObjectifsMesures =
  | "Non applicable"
  | "À renseigner"
  | "Index supérieur à 85"
  | "Renseignés"
  | "Année non applicable"
  | "Déclaration non modifiable sur données correctes"
  | "Déclaration non modifiable sur données incorrectes"

/**
 * Return the status of the declaration, OP MC wise.
 */
export function statusDeclaration(declaration: DeclarationAPI): StatusObjectifsMesures {
  const { after2021, index, initialValuesObjectifsMesures, objectifsMesuresSchema } =
    buildHelpersObjectifsMesures(declaration)

  if (!declaration.data.déclaration || index === undefined) return "Non applicable"
  if (!after2021) return "Année non applicable"
  if (index >= 85) return "Index supérieur à 85"

  try {
    objectifsMesuresSchema.parse(initialValuesObjectifsMesures)
    if (isFrozenDeclarationForOPMC(declaration)) return "Déclaration non modifiable sur données correctes"
  } catch (e) {
    if (isFrozenDeclarationForOPMC(declaration)) return "Déclaration non modifiable sur données incorrectes"
    return "À renseigner"
  }
  return "Renseignés"
}

export default DeclarationsListe
