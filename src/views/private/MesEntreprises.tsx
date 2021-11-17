import React from "react"
import { SinglePageLayout } from "../../containers/SinglePageLayout"
import { useTitle, useUser } from "../../utils/hooks"
import Page from "../../components/Page"
import { Select } from "@chakra-ui/select"
import useSWR from "swr"
import { fetcher } from "../../utils/fetcher"
import { Box, Flex, List, ListIcon, ListItem, Text } from "@chakra-ui/layout"
import { EntrepriseType } from "../../globals"
import { AddIcon, DragHandleIcon } from "@chakra-ui/icons"
import PrimaryButton from "../../components/ds/PrimaryButton"
import { Spinner } from "@chakra-ui/spinner"

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
  const [chosenSiren, setChosenSiren] = React.useState(sirens?.[0] || "")

  const { entreprise, error, isLoading } = useSiren(chosenSiren)

  /**
   *
   * Je cherche à réucupérer les inforamtions des Siren
   *
   * Problème : j'ai une liste de SIREN pour lesquelles je dois récupérer les données.
   *
   * Dans un premier temps, j'essaie de récupérer les données du premier SIREN. Mais est-ce que ça a un sens le 1er SIREN ?
   *
   * Ce siren sera stocké dans un state, et sera modifié quand le user cliquera sur une nouvelle valeur du select.
   *
   *
   *
   */

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
                  <PrimaryButton leftIcon={<AddIcon />}> Ajouter un responsable</PrimaryButton>
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
