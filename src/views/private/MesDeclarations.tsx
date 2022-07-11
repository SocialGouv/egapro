import React, { FunctionComponent } from "react"
import { Select, Flex, FormControl, FormLabel, Text } from "@chakra-ui/react"

import { useTitle } from "../../utils/hooks"

import { SinglePageLayout } from "../../containers/SinglePageLayout"
import Page from "../../components/Page"
import { useUser } from "../../components/AuthContext"
import InfoEntreprise from "../../components/InfoEntreprise"
import DeclarationsListe from "../../components/DeclarationsListe"

const title = "Mes déclarations"

const MesDeclarations: FunctionComponent = () => {
  useTitle(title)

  const { ownership: sirens } = useUser()
  const orderedSirens = [...sirens].sort()

  const [chosenSiren, setChosenSiren] = React.useState(orderedSirens?.[0] || "")

  return (
    <SinglePageLayout size="container.xl">
      <Page title={title}>
        {!sirens?.length ? (
          <Text>Vous ne gérez pas encore d'entreprise.</Text>
        ) : (
          <>
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
              <DeclarationsListe siren={chosenSiren} />
            </Flex>
          </>
        )}
      </Page>
    </SinglePageLayout>
  )
}

export default MesDeclarations
