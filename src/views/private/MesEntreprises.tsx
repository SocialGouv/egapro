import React from "react"
import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/modal"
import { Select } from "@chakra-ui/select"
import { Box, Flex, HStack, List, ListIcon, ListItem, Stack, Text } from "@chakra-ui/layout"
import { Spinner } from "@chakra-ui/spinner"
import { FormControl, FormLabel } from "@chakra-ui/form-control"
import { IconButton } from "@chakra-ui/button"
import { DeleteIcon, DragHandleIcon } from "@chakra-ui/icons"
import { Skeleton } from "@chakra-ui/react"
import { useBoolean, useDisclosure } from "@chakra-ui/hooks"
import { Form } from "react-final-form"
import { z } from "zod"

import { SinglePageLayout } from "../../containers/SinglePageLayout"
import { useTitle, useToastMessage } from "../../utils/hooks"
import { useSiren } from "../../hooks/useSiren"
import { useOwnersOfSiren } from "../../hooks/useOwnersOfSiren"
import Page from "../../components/Page"
import { fetcher } from "../../utils/fetcher"
import PrimaryButton from "../../components/ds/PrimaryButton"
import LinkButton from "../../components/ds/LinkButton"
import Toast from "../../components/ds/Toast"
import { OfficeBuildingIcon } from "../../components/ds/icons/OfficeBuildingIcon"
import { useUser } from "../../components/AuthContext"
import { formValidator, InputControl } from "../../components/ds/form-lib"

const title = "Mes entreprises"

function InfoEntreprise({ siren }: { siren: string }) {
  const { entreprise, message, isLoading } = useSiren(siren)

  return (
    <HStack borderWidth="3px" borderRadius="lg" as="section" spacing="4" p="6" pt="4" pb="4">
      <Toast message={message} />
      <Flex>
        <OfficeBuildingIcon w={6} h={6} color="gray.500" />
      </Flex>

      {isLoading ? (
        <Stack>
          <Skeleton height="25px" />
          <Skeleton height="20px" />
        </Stack>
      ) : (
        <Stack>
          <Text fontWeight="semibold" as="h4" lineHeight="tight" isTruncated>
            {entreprise?.raison_sociale}
          </Text>
          <Text fontSize="md" color="gray.600">
            {entreprise?.commune}
          </Text>
        </Stack>
      )}
    </HStack>
  )
}

function UserListItem({
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
      <ListIcon as={DragHandleIcon} color="green.500" />
      {owner}&nbsp;
      <IconButton
        variant="none"
        colorScheme="teal"
        aria-label="Supprimer cet utilisateur"
        icon={<DeleteIcon />}
        onClick={onOpen}
        h="6"
      />
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Supprimer l'utilisateur</ModalHeader>
          <ModalCloseButton />
          <ModalBody>Cette opération est irréversible.</ModalBody>

          <ModalFooter>
            <PrimaryButton colorScheme="red" mr={3} onClick={() => removeUser(owner, siren)}>
              Confirmer
            </PrimaryButton>
            <PrimaryButton variant="ghost" onClick={onClose}>
              Annuler
            </PrimaryButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </ListItem>
  )
}

function UtilisateursEntreprise({ siren }: { siren: string }) {
  const [email, setEmail] = React.useState("")
  const { toastSuccess, toastError } = useToastMessage({})
  const [showAddForm, setShowAddForm] = useBoolean()

  const { owners, message, isLoading, mutate } = useOwnersOfSiren(siren)

  React.useEffect(() => {
    setShowAddForm.off()
  }, [siren])

  async function addUser(formData: any) {
    setEmail(formData.email)

    try {
      await fetcher(`/ownership/${siren}/${formData.email}`, {
        method: "PUT",
      })
      setEmail("")
      setShowAddForm.off()
      mutate([...owners, email])
      toastSuccess("Le responsable a été ajouté.")
    } catch (error) {
      console.error(error)
      toastError("Erreur pour ajouter cet email.")
    }
  }

  async function removeUser(owner: string, siren: string) {
    try {
      await fetcher(`/ownership/${siren}/${owner}`, {
        method: "DELETE",
      })
      mutate([]) // TODO ne pas tout supprimer
      toastSuccess("Le responsable a été supprimé.")
    } catch (error) {
      console.error(error)
      toastError("Erreur pour supprimer cet email.")
    }
  }

  const FormInput = z.object({
    email: z.string({ required_error: "L'adresse mail est requise" }).email({ message: "L'adresse mail est invalide" }),
  })

  return (
    <Box mt="4">
      <Toast message={message} />

      {isLoading ? (
        <Box m="6">
          <Spinner />
        </Box>
      ) : (
        <React.Fragment>
          <Text fontSize="md" fontWeight="bold" color="green.500" mb="2">
            Responsables
          </Text>

          <List spacing={3}>
            {owners?.map((owner: string) => (
              <UserListItem key={owner} owner={owner} siren={siren} removeUser={removeUser} />
            ))}
          </List>

          <Flex mt="6" direction="column">
            <LinkButton variant="ghost" onClick={setShowAddForm.toggle}>
              <span aria-hidden="true" style={{ marginRight: "20px" }}>
                🙋
              </span>
              &nbsp;Vous souhaitez ajouter un responsable ?
            </LinkButton>
            {showAddForm && (
              <Box mt="4">
                <Form
                  onSubmit={addUser}
                  validate={formValidator(FormInput)}
                  render={({ handleSubmit }) => (
                    <form onSubmit={handleSubmit}>
                      <HStack align="flex-end">
                        <InputControl name="email" label="Email du responsable" variant="blue-outline" />
                        <PrimaryButton type="submit">Ajouter</PrimaryButton>
                      </HStack>
                    </form>
                  )}
                />
              </Box>
            )}
          </Flex>
        </React.Fragment>
      )}
    </Box>
  )
}

function MesEntreprises() {
  useTitle(title)

  const { ownership: sirens } = useUser()
  const orderedSirens = sirens.sort()

  const [chosenSiren, setChosenSiren] = React.useState(orderedSirens?.[0] || "")

  return (
    <SinglePageLayout>
      <Page title={title}>
        {!sirens?.length ? (
          <p>Vous ne gérez pas encore d'entreprise.</p>
        ) : (
          <React.Fragment>
            <FormControl id="siren">
              <FormLabel>SIREN</FormLabel>
              <Select
                onChange={(event) => setChosenSiren(event?.target?.value)}
                defaultValue={chosenSiren}
                aria-label="Liste des SIREN"
              >
                {orderedSirens.map((siren) => (
                  <option key={siren} value={siren}>
                    {siren}
                  </option>
                ))}
              </Select>
            </FormControl>

            <Flex mt="6" direction="column">
              <InfoEntreprise siren={chosenSiren} />
              <UtilisateursEntreprise siren={chosenSiren} />
              &nbsp;
            </Flex>
          </React.Fragment>
        )}
      </Page>
    </SinglePageLayout>
  )
}

export default MesEntreprises
