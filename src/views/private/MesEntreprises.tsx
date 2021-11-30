import React from "react"
import { Select } from "@chakra-ui/select"
import { Box, Flex, HStack, List, ListIcon, ListItem, Text } from "@chakra-ui/layout"
import { Spinner } from "@chakra-ui/spinner"
import { FormControl, FormLabel } from "@chakra-ui/form-control"
import { DeleteIcon, DragHandleIcon } from "@chakra-ui/icons"
import { z } from "zod"

import { SinglePageLayout } from "../../containers/SinglePageLayout"
import { useTitle, useToastMessage } from "../../utils/hooks"
import { useSiren } from "../../hooks/useSiren"
import { useOwnersOfSiren } from "../../hooks/useOwnersOfSiren"
import Page from "../../components/Page"
import { EXPIRED_TOKEN_MESSAGE, fetcher } from "../../utils/fetcher"
import { AlertMessageType, EntrepriseType } from "../../globals"
import PrimaryButton from "../../components/ds/PrimaryButton"
import LinkButton from "../../components/ds/LinkButton"
import Toast from "../../components/ds/Toast"
import { useBoolean, useDisclosure } from "@chakra-ui/hooks"
import { OfficeBuildingIcon } from "../../components/ds/icons/OfficeBuildingIcon"
import { IconButton } from "@chakra-ui/button"
import { useUser } from "../../components/AuthContext"
import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/modal"
import { Form } from "react-final-form"
import { formValidator, InputControl } from "../../components/ds/form-lib"

const title = "Mes entreprises"

function InfoEntreprise({ entreprise }: { entreprise: EntrepriseType }) {
  if (!entreprise) return null
  const { raison_sociale, commune } = entreprise

  return (
    <Box borderWidth="3px" borderRadius="lg" as="section">
      <HStack spacing="4" p="6" pt="4" pb="4">
        <Flex>
          <OfficeBuildingIcon w={6} h={6} color="gray.500" />
        </Flex>
        <Box>
          <Text fontWeight="semibold" as="h4" lineHeight="tight" isTruncated>
            {raison_sociale}
          </Text>
          <Text fontSize="md" color="gray.600">
            {commune}
          </Text>
        </Box>
      </HStack>
    </Box>
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

function UtilisateursEntreprise({
  owners,
  siren,
  isReady = false,
  removeUser,
}: {
  owners: string[]
  siren: string
  isReady: boolean
  removeUser: (owner: string, siren: string) => void
}) {
  if (!isReady || !owners) return null

  return (
    <Box mt="4">
      <Text fontSize="md" fontWeight="bold" color="green.500" mb="2">
        Responsables
      </Text>

      <List spacing={3}>
        {owners?.map((owner: string) => (
          <UserListItem key={owner} owner={owner} siren={siren} removeUser={removeUser} />
        ))}
      </List>
    </Box>
  )
}

function MesEntreprises() {
  useTitle(title)
  const { toastSuccess, toastError } = useToastMessage({})

  const { ownership: sirens } = useUser()
  const [email, setEmail] = React.useState("")
  const orderedSirens = sirens.sort()

  const [chosenSiren, setChosenSiren] = React.useState(orderedSirens?.[0] || "")
  const { entreprise, error: errorSiren, isLoading: isLoadingSiren } = useSiren(chosenSiren)
  const { owners, error: errorOwners, isLoading: isLoadingOwners, mutate: mutateOwners } = useOwnersOfSiren(chosenSiren)
  const [showAddForm, setShowAddForm] = useBoolean()

  const isLoading = isLoadingSiren || isLoadingOwners

  const message: AlertMessageType = React.useMemo(
    () =>
      !errorSiren && !errorOwners
        ? null
        : errorSiren?.info === EXPIRED_TOKEN_MESSAGE || errorOwners?.info === EXPIRED_TOKEN_MESSAGE
        ? {
            kind: "error",
            text: "Votre session a expiré, veuillez vous reconnecter.",
          }
        : { kind: "error", text: "Une erreur est survenue lors de la récupération des données." },
    [chosenSiren, errorOwners, errorSiren],
  )

  React.useEffect(() => {
    setShowAddForm.off()
  }, [chosenSiren])

  async function addUser(formData: any) {
    setEmail(formData.email)

    try {
      await fetcher(`/ownership/${chosenSiren}/${formData.email}`, {
        method: "PUT",
      })
      setEmail("")
      setShowAddForm.off()
      mutateOwners([...owners, email])
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
      mutateOwners([]) // TODO ne pas tout supprimer
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
    <SinglePageLayout>
      <Toast message={message} />
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
            {isLoading ? (
              <Box m="6">
                <Spinner />
              </Box>
            ) : (
              <Flex mt="6" direction="column">
                <InfoEntreprise entreprise={entreprise} />
                <UtilisateursEntreprise
                  owners={owners}
                  siren={chosenSiren}
                  isReady={Boolean(entreprise)}
                  removeUser={removeUser}
                />
                &nbsp;
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
            )}
          </React.Fragment>
        )}
      </Page>
    </SinglePageLayout>
  )
}

export default MesEntreprises
