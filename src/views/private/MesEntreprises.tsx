import React from "react"
import { SinglePageLayout } from "../../containers/SinglePageLayout"
import { useTitle, useUser } from "../../utils/hooks"
import Page from "../../components/Page"
import { Select } from "@chakra-ui/select"
import useSWR from "swr"
import { fetcher } from "../../utils/fetcher"
import { Box, Flex, HStack, List, ListIcon, ListItem, Text } from "@chakra-ui/layout"
import { EntrepriseType } from "../../globals"
import { AddIcon, DragHandleIcon } from "@chakra-ui/icons"
import PrimaryButton from "../../components/ds/PrimaryButton"
import { Spinner } from "@chakra-ui/spinner"
import { FormControl, FormHelperText, FormLabel } from "@chakra-ui/form-control"
import { Input } from "@chakra-ui/input"
import { useHistory } from "react-router"

const title = "Mes entreprises"

function InfoEntreprise({ data }: { data: EntrepriseType }) {
  if (!data) return null
  const { raison_sociale, commune } = data

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

function UtilisateursEntreprise({ siren, isReady = false }: { siren: string; isReady: boolean }) {
  if (!isReady) return null

  const { data, error } = useSWR(siren ? `/ownership/${siren}` : null, fetcher)

  if (error) return <Text>{JSON.stringify(error)}</Text>
  return (
    <Box mt="4">
      <Text fontSize="md" fontWeight="bold" color="green.500" mb="2">
        Responsables enregistrés
      </Text>

      <List spacing={3}>
        {data?.owners?.map((owner: string) => (
          <ListItem key={owner}>
            <ListIcon as={DragHandleIcon} color="green.500" />

            {owner}
          </ListItem>
        ))}
      </List>
    </Box>
  )
}

function useSiren(siren: string) {
  const { data: entreprise, error } = useSWR(siren ? `/validate-siren?siren=${siren}` : null, fetcher)

  const isLoading = !entreprise && !error
  const isError = Boolean(error)

  return { entreprise, error, isLoading, isError }
}

function MesEntreprises() {
  useTitle(title)
  const { ownership: sirens } = useUser()
  const [email, setEmail] = React.useState("")

  const [chosenSiren, setChosenSiren] = React.useState(sirens?.[0] || "")

  const { entreprise, error, isLoading } = useSiren(chosenSiren)

  const history = useHistory()

  /**
   *
   * Je suis sur l'ajout d'un owner. ça marche mais la liste des users n'est pas mis à jour.
   *
   * Pour ça, je pense qu'il faut passer par mutate de swr pour lui demander de revalider.
   *
   * https://swr.vercel.app/docs/mutation
   *
   * Ensuite, il faudra ajouter des icones pour supprimer les users.
   *
   * Et revoir un peu le layout
   *
   */

  async function addUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      const result = await fetcher(`/ownership/${chosenSiren}/${email}`, {
        method: "PUT",
      })
      setEmail("")
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <SinglePageLayout>
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
                <InfoEntreprise data={entreprise} />
                <UtilisateursEntreprise siren={chosenSiren} isReady={Boolean(entreprise)} />
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
