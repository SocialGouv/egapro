import React, { useEffect, useState } from "react"
import { Box, Flex, HStack, List, ListIcon, ListItem, Text } from "@chakra-ui/layout"
import { Spinner } from "@chakra-ui/spinner"
import { IconButton } from "@chakra-ui/button"
import { useBoolean, useDisclosure } from "@chakra-ui/hooks"
import { Form } from "react-final-form"
import { z } from "zod"

import { fetcher } from "../utils/fetcher"
import { useToastMessage } from "../utils/hooks"
import { useOwnersOfSiren } from "../hooks/useOwnersOfSiren"
import { useSoloToastMessage } from "../utils/hooks"
import PrimaryButton from "../components/ds/PrimaryButton"
import { formValidator, InputControl } from "./ds/form-lib"
import ButtonAction from "./ds/ButtonAction"
import Modal from "./ds/Modal"
import { IconDelete, IconDrag } from "./ds/Icons"
import { EMAIL_REGEX } from "../utils/regex"

function UtilisateurItem({
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

export default function UtilisateursEntreprise({ siren }: { siren: string }) {
  const [email, setEmail] = useState("")
  const { toastSuccess, toastError } = useToastMessage({})
  const [showAddForm, setShowAddForm] = useBoolean()

  const { owners, message, isLoading, mutate } = useOwnersOfSiren(siren)
  useSoloToastMessage("utilisateurs-entreprise-toast", message)

  useEffect(() => {
    setShowAddForm.off()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setShowAddForm is not added because the properties returned by useBoolean are stable values.
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
    email: z
      .string({ required_error: "L'adresse email est requise" })
      .regex(EMAIL_REGEX, { message: "L'adresse email est invalide" }),
  })

  return (
    <Box mt="4">
      {isLoading ? (
        <Box m="6">
          <Spinner />
        </Box>
      ) : (
        <>
          <Text fontSize="md" fontWeight="bold" color="green.500" mb="2">
            Responsables
          </Text>

          <List spacing={3}>
            {owners?.map((owner: string) => (
              <UtilisateurItem key={owner} owner={owner} siren={siren} removeUser={removeUser} />
            ))}
          </List>

          <Flex mt="6" direction="column">
            <ButtonAction
              variant="outline"
              onClick={setShowAddForm.toggle}
              label="Vous souhaitez ajouter un responsable ?"
              leftIcon={<span aria-hidden="true">🙋</span>}
            />

            {showAddForm && (
              <Box mt="4">
                <Form
                  onSubmit={addUser}
                  validate={formValidator(FormInput)}
                  render={({ handleSubmit }) => (
                    <form onSubmit={handleSubmit}>
                      <HStack spacing={4} align="flex-start">
                        <InputControl name="email" label="Email du responsable" />
                        <Box pt={8}>
                          <PrimaryButton type="submit">Ajouter</PrimaryButton>
                        </Box>
                      </HStack>
                    </form>
                  )}
                />
              </Box>
            )}
          </Flex>
        </>
      )}
    </Box>
  )
}
