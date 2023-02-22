import { Box, Flex, FormControl, FormLabel, Select } from "@chakra-ui/react"
import React, { useState } from "react"

import { useTitle } from "../../utils/hooks"

import { useUser } from "../../components/AuthContext"
import InfoEntreprise from "../../components/InfoEntreprise"
import NoSiren from "../../components/ds/NoSiren"
import Page from "../../components/Page"
import UtilisateursEntreprise from "../../components/UtilisateursEntreprise"
import { SinglePageLayout } from "../../containers/SinglePageLayout"

const title = "Mes entreprises"

const MesEntreprises = () => {
  useTitle(title)

  const { ownership: sirens } = useUser()
  const orderedSirens = sirens.sort()

  const [chosenSiren, setChosenSiren] = useState(orderedSirens?.[0] || "")

  return (
    <SinglePageLayout>
      <Page title={title}>
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
