import { Box, Flex, FormControl, FormLabel, Select } from "@chakra-ui/react"
import React from "react"
import { useHistory, useParams } from "react-router-dom"

import { useTitle } from "../../utils/hooks"

import { useUser } from "../../components/AuthContext"
import DeclarationsListe from "../../components/DeclarationsListe"
import InfoEntreprise from "../../components/InfoEntreprise"
import NoSiren from "../../components/ds/NoSiren"
import Page from "../../components/Page"
import { SinglePageLayout } from "../../containers/SinglePageLayout"

const title = "Mes déclarations"

const MesDeclarations = () => {
  useTitle(title)
  const history = useHistory()

  const { siren: sirenFromUrl } = useParams<{ siren?: string }>()

  const { ownership: sirens } = useUser()
  const orderedSirens = [...sirens].sort()

  const siren = sirenFromUrl || orderedSirens?.[0]

  return (
    <SinglePageLayout size="container.xl">
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
                    onChange={(event) => history.push(`/tableauDeBord/mes-declarations/${event?.target?.value}`)}
                    defaultValue={siren}
                    aria-label="Liste des SIREN"
                  >
                    {orderedSirens.map((siren) => (
                      <option key={siren} value={siren}>
                        {siren}
                      </option>
                    ))}
                  </Select>
                  <Box flex="auto">
                    <InfoEntreprise siren={siren} />
                  </Box>
                </Flex>
              </FormControl>

              <Box mt="6">
                <DeclarationsListe siren={siren} />
              </Box>
            </Flex>
          </>
        )}
      </Page>
    </SinglePageLayout>
  )
}

export default MesDeclarations
