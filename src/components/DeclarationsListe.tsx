import React from "react"
import { Box, Flex, HStack, ListIcon, ListItem, Text } from "@chakra-ui/layout"
import { Spinner } from "@chakra-ui/spinner"
import { IconButton } from "@chakra-ui/button"
import { useDisclosure } from "@chakra-ui/hooks"
import { Link as RouterLink } from "react-router-dom"
import { Link, Table, Thead, Tbody, Tr, Th, Td, TableContainer } from "@chakra-ui/react"

import { useSoloToastMessage } from "../utils/hooks"
import PrimaryButton from "./ds/PrimaryButton"
import ButtonAction from "./ds/ButtonAction"
import Modal from "./ds/Modal"
import { IconDelete, IconDrag } from "./ds/Icons"
import { useDeclarations } from "../hooks/useDeclaration"
import { format, parseISO } from "date-fns"

function DeclarationItem({
  owner,
  siren,
  removeUser,
}: {
  owner: string
  siren: string
  removeUser: (owner: string, siren: string) => void
}) {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <ListItem key={owner} verticalAlign="center">
      <ListIcon as={IconDrag} color="green.500" />
      {owner}&nbsp;
      <IconButton
        variant="none"
        colorScheme="teal"
        aria-label="Supprimer cet utilisateur"
        icon={<IconDelete />}
        onClick={onOpen}
        h="6"
      />
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Supprimer l'utilisateur"
        footer={
          <>
            <ButtonAction
              colorScheme="red"
              onClick={() => removeUser(owner, siren)}
              label="Supprimer l'utilisateur"
              leftIcon={<IconDelete />}
            />
            <ButtonAction colorScheme="gray" onClick={onClose} label="Annuler" />
          </>
        }
      >
        <Text>Cette opération est irréversible.</Text>
      </Modal>
    </ListItem>
  )
}

function formatDate(stringDate: string | undefined) {
  if (!stringDate) return ""

  const date = parseISO(stringDate)
  if (date.toString() === "Invalid Date") return

  return format(date, "dd/MM/yyyy")
}

function formatPeriodeSuffisante(declaration: any) {
  return declaration.data?.déclaration?.période_suffisante === undefined ||
    declaration.data?.déclaration?.période_suffisante === true
    ? "Oui"
    : "Non"
}

function formatPoints(declaration: any) {
  if (declaration?.data?.déclaration?.points && declaration?.data?.déclaration?.points_calculables) {
    return declaration?.data?.déclaration?.points + " / " + declaration?.data?.déclaration?.points_calculables
  }
  return ""
}

export default function DeclarationsListe({ siren }: { siren: string }) {
  const { declarations, message, isLoading } = useDeclarations(siren)
  // useSoloToastMessage("declarations-liste-toast", message)

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
                  <Th>Année</Th>
                  <Th>Index</Th>
                  <Th>Points</Th>
                  <Th>Date de déclaration</Th>
                  <Th>Période suffisante</Th>
                  <Th>Objectifs et mesures</Th>
                </Tr>
              </Thead>
              <Tbody>
                {yearsDeclarations.map((annee: string) => (
                  <Tr key={annee}>
                    <Td>{siren}</Td>
                    <Td>{annee}</Td>
                    <Td>{declarations[annee]?.data?.déclaration?.index}</Td>
                    <Td>{formatPoints(declarations[annee])}</Td>
                    <Td>{formatDate(declarations[annee]?.data?.déclaration?.date)}</Td>
                    <Td>{formatPeriodeSuffisante(declarations[annee])}</Td>
                    <Td>
                      <Link as={RouterLink} to="/">
                        Ajouter
                      </Link>
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
