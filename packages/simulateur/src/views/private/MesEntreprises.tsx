import { Box, Flex, FormControl, FormLabel, Select } from "@chakra-ui/react"
import React, { useState } from "react"

import { useTitle } from "../../utils/hooks"

import { useUser } from "../../components/AuthContext"
import InfoEntreprise from "../../components/InfoEntreprise"
import NoSiren from "../../components/ds/NoSiren"
import Page from "../../components/Page"
import UtilisateursEntreprise from "../../components/UtilisateursEntreprise"
import { SinglePageLayout } from "../../containers/SinglePageLayout"
import InfoBlock from "../../components/ds/InfoBlock"

const title = "Mes entreprises"

const MesEntreprises = () => {
  useTitle(title)

  const { ownership: sirens } = useUser()
  const orderedSirens = sirens.sort()

  const [chosenSiren, setChosenSiren] = useState(orderedSirens?.[0] || "")

  return (
    <SinglePageLayout>
      <Page title={title}>
        <InfoBlock
          mb="2"
          text={
            <>
              <p>
                Pour effectuer une déclaration sur le site Egapro, l’email du déclarant doit être rattaché au numéro
                Siren de l’entreprise. Egalement, les déclarants rattachés sont destinataires de l’accusé de réception
                lors de la validation de la déclaration.
              </p>
              <br />
              <p>
                Dans ce menu, vous pouvez ainsi rattacher et supprimer l’email d’un déclarant, en sélectionnant au
                préalable dans la liste déroulante le numéro Siren de l'entreprise concernée si vous gérez plusieurs
                entreprises.
              </p>
            </>
          }
        />
        {!sirens?.length ? (
          <NoSiren />
        ) : (
          <>
            <Flex direction="column">
              <FormControl id="siren">
                <FormLabel>SIREN</FormLabel>
                <Flex direction="row" gap="4">
                  <Select
                    w="fit-content"
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
                  <Box flex="auto">
                    <InfoEntreprise siren={chosenSiren} />
                  </Box>
                </Flex>
              </FormControl>

              <UtilisateursEntreprise siren={chosenSiren} />
            </Flex>
          </>
        )}
      </Page>
    </SinglePageLayout>
  )
}

export default MesEntreprises
