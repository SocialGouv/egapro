import React from "react"
import { Flex } from "@chakra-ui/layout"
import { FormControl, FormLabel } from "@chakra-ui/form-control"

import { useTitle } from "../../utils/hooks"
import { SinglePageLayout } from "../../containers/SinglePageLayout"
import Page from "../../components/Page"
import { useUser } from "../../components/AuthContext"
import InfoEntreprise from "../../components/InfoEntreprise"
import UtilisateursEntreprise from "../../components/UtilisateursEntreprise"
// import Combobox from "../../components/ds/Combobox"

const title = "Mes entreprises"

function GererUtilisateursPage() {
  useTitle(title)

  const { ownership: sirens } = useUser()
  const orderedSirens = sirens.sort()

  const [chosenSiren, setChosenSiren] = React.useState(orderedSirens?.[0] || "")

  return (
    <SinglePageLayout>
      <Page title={title}>
        {!sirens?.length ? (
          <p>Vous ne gérez pas encore d'entreprise.</p>
        ) : (
          <React.Fragment>
            <FormControl id="siren">
              <FormLabel>SIREN</FormLabel>
              {/* <Combobox /> */}
            </FormControl>

            <Flex mt="6" direction="column">
              <InfoEntreprise siren={chosenSiren} />
              <UtilisateursEntreprise siren={chosenSiren} />
            </Flex>
          </React.Fragment>
        )}
      </Page>
    </SinglePageLayout>
  )
}

export default GererUtilisateursPage
