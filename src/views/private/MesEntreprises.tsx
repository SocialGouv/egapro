import React from "react"
import { Select } from "@chakra-ui/select"
import { Box, Flex, HStack, List, ListIcon, ListItem, Text } from "@chakra-ui/layout"
import { Spinner } from "@chakra-ui/spinner"
import { FormControl, FormHelperText, FormLabel } from "@chakra-ui/form-control"
import { Input } from "@chakra-ui/input"
import { AddIcon, DragHandleIcon } from "@chakra-ui/icons"

import { SinglePageLayout } from "../../containers/SinglePageLayout"
import { useTitle, useToastMessage, useUser } from "../../utils/hooks"
import { useSiren } from "../../hooks/useSiren"
import { useOwnersOfSiren } from "../../hooks/useOwnersOfSiren"
import Page from "../../components/Page"
import { fetcher } from "../../utils/fetcher"
import { AlertMessageType, EntrepriseType } from "../../globals"
import PrimaryButton from "../../components/ds/PrimaryButton"
import Toast from "../../components/ds/Toast"

const title = "Mes entreprises"

function InfoEntreprise({ entreprise }: { entreprise: EntrepriseType }) {
  if (!entreprise) return null
  const { raison_sociale, commune } = entreprise

  return (
    <Box maxW="sm" borderWidth="3px" borderRadius="lg" as="section">
      <Box p="6" pt="4" pb="4">
        <Box mt="1" fontWeight="semibold" as="h4" lineHeight="tight" isTruncated>
          {raison_sociale}
        </Box>
        <Text fontSize="md" color="gray.600">
          {commune}
        </Text>
      </Box>
    </Box>
  )
}

function UtilisateursEntreprise({ owners, isReady = false }: { owners: string[]; isReady: boolean }) {
  if (!isReady || !owners) return null

  return (
    <Box mt="4">
      <Text fontSize="md" fontWeight="bold" color="green.500" mb="2">
        Responsables enregistrés
      </Text>

      <List spacing={3}>
        {owners?.map((owner: string) => (
          <ListItem key={owner}>
            <ListIcon as={DragHandleIcon} color="green.500" />

            {owner}
          </ListItem>
        ))}
      </List>
    </Box>
  )
}

function MesEntreprises() {
  useTitle(title)
  const toastMessage = useToastMessage()

  const { ownership: sirens } = useUser()
  const [email, setEmail] = React.useState("")

  const [chosenSiren, setChosenSiren] = React.useState(sirens?.[0] || "")
  const { entreprise, error: errorSiren, isLoading: isLoadingSiren } = useSiren(chosenSiren)
  const { owners, error: errorOwners, isLoading: isLoadingOwners, mutate: mutateOwners } = useOwnersOfSiren(chosenSiren)

  const isLoading = isLoadingSiren || isLoadingOwners

  const message: AlertMessageType = React.useMemo(
    () =>
      !errorSiren && !errorOwners
        ? null
        : { kind: "error", text: "Une erreur est survenue lors de la récupération des données." },
    [chosenSiren, errorOwners, errorSiren],
  )

  /**
   * Ensuite, il faudra ajouter des icones pour supprimer les users.
   *
   * Et revoir un peu le layout
   *
   * Et voir comment se connecter.
   *
   */

  async function addUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      await fetcher(`/ownership/${chosenSiren}/${email}`, {
        method: "PUT",
      })
      setEmail("")
      mutateOwners([...owners, email])
      toastMessage({ kind: "success", text: "L'utilisateur est ajouté." })
    } catch (error) {
      console.error(error)
      toastMessage({ kind: "error", text: "Erreur pour ajouter cet email" })
    }
  }

  return (
    <SinglePageLayout>
      <Toast message={message} />
      <Page title={title}>
        {!sirens?.length ? (
          <p>Vous ne gérez pas encore d'entreprise.</p>
        ) : (
          <React.Fragment>
            <Select
              onChange={(event) => setChosenSiren(event?.target?.value)}
              defaultValue={chosenSiren}
              aria-label="Liste des SIREN"
            >
              {sirens.map((siren) => (
                <option key={siren} value={siren}>
                  {siren}
                </option>
              ))}
            </Select>
            {isLoading ? (
              <Box m="6">
                <Spinner />
              </Box>
            ) : (
              <Flex mt="6" direction="column">
                <InfoEntreprise entreprise={entreprise} />
                <UtilisateursEntreprise owners={owners} isReady={Boolean(entreprise)} />
                <Box mt="8">
                  <form onSubmit={addUser}>
                    <HStack>
                      <FormControl id="email">
                        <FormLabel>Courriel du responsable</FormLabel>
                        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                        <FormHelperText>Un courriel lui sera envoyé pour confirmer son adresse.</FormHelperText>
                      </FormControl>
                      <PrimaryButton leftIcon={<AddIcon />} type="submit">
                        Ajouter
                      </PrimaryButton>
                    </HStack>
                  </form>
                </Box>
              </Flex>
            )}
          </React.Fragment>
        )}
      </Page>
    </SinglePageLayout>
  )
}

export default MesEntreprises
