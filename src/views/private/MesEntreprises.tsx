import React from "react"
import { Select } from "@chakra-ui/select"
import { Box, Flex, HStack, List, ListIcon, ListItem, Text } from "@chakra-ui/layout"
import { Spinner } from "@chakra-ui/spinner"
import { FormControl, FormHelperText, FormLabel } from "@chakra-ui/form-control"
import { Input } from "@chakra-ui/input"
import { AddIcon, DeleteIcon, DragHandleIcon } from "@chakra-ui/icons"

import { SinglePageLayout } from "../../containers/SinglePageLayout"
import { useTitle, useToastMessage, useUser } from "../../utils/hooks"
import { useSiren } from "../../hooks/useSiren"
import { useOwnersOfSiren } from "../../hooks/useOwnersOfSiren"
import Page from "../../components/Page"
import { fetcher } from "../../utils/fetcher"
import { AlertMessageType, EntrepriseType } from "../../globals"
import PrimaryButton from "../../components/ds/PrimaryButton"
import LinkButton from "../../components/ds/LinkButton"
import Toast from "../../components/ds/Toast"
import { useBoolean } from "@chakra-ui/hooks"
import { OfficeBuildingIcon } from "../../components/ds/icons/OfficeBuildingIcon"
import { IconButton } from "@chakra-ui/button"

const title = "Mes entreprises"

function InfoEntreprise({ entreprise }: { entreprise: EntrepriseType }) {
  if (!entreprise) return null
  const { raison_sociale, commune } = entreprise

  return (
    <Box maxW="sm" borderWidth="3px" borderRadius="lg" as="section">
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
          <ListItem key={owner} verticalAlign="center">
            <ListIcon as={DragHandleIcon} color="green.500" />
            {owner}&nbsp;
            <IconButton
              variant="none"
              colorScheme="teal"
              aria-label="Supprimer cet utilisateur"
              icon={<DeleteIcon />}
              onClick={() => removeUser(owner, siren)}
              h="6"
            />
          </ListItem>
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

  const [chosenSiren, setChosenSiren] = React.useState(sirens?.[0] || "")
  const { entreprise, error: errorSiren, isLoading: isLoadingSiren } = useSiren(chosenSiren)
  const { owners, error: errorOwners, isLoading: isLoadingOwners, mutate: mutateOwners } = useOwnersOfSiren(chosenSiren)
  const [showAddForm, setShowAddForm] = useBoolean()

  const isLoading = isLoadingSiren || isLoadingOwners

  const message: AlertMessageType = React.useMemo(
    () =>
      !errorSiren && !errorOwners
        ? null
        : { kind: "error", text: "Une erreur est survenue lors de la récupération des données." },
    [chosenSiren, errorOwners, errorSiren],
  )

  React.useEffect(() => {
    setShowAddForm.off()
  }, [chosenSiren])

  /**
   * Je suis sur la suppression des utilisateurs.
   *
   * L'icône devrait être centré et rouge.
   * Il devrait appeler une modale qui va demander confirmation.
   * Si l'utilisateur à supprimer et l'utilisateur lui-même, modifier le message.
   * Voir comment bien typer OfficeBuildingIcon.
   * removeUser a un mutate, qui ne doit enlever que l'email à supprimer
   *
   * Gérer les erreurs renvoyées par Axe.
   *
   * Revoir un peu le layout
   * La zone rosée se décale quand il y a beacoup de hauteur ??
   * Les items de menu sont en teal. Mettre une couleur plus dans le ds.
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
      setShowAddForm.off()
      mutateOwners([...owners, email])
      toastSuccess("L'utilisateur est ajouté.")
    } catch (error) {
      console.error(error)
      toastError("Erreur pour ajouter cet email.")
    }
  }

  async function removeUser(owner: string, siren: string) {
    console.log("dans removuser")
    try {
      await fetcher(`/ownership/${siren}/${owner}`, {
        method: "DELETE",
      })
      mutateOwners([]) // TODO ne pas tout supprimer
      toastSuccess("L'utilisateur a été supprimé.")
    } catch (error) {
      console.error(error)
      toastError("Erreur pour supprimer cet email.")
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
