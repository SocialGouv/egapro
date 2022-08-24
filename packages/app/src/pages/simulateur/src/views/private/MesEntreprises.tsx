import { Flex, FormControl, FormLabel, Select } from "@chakra-ui/react"
import React, { FunctionComponent } from "react"

import { useTitle } from "../../utils/hooks"

import { useUser } from "../../components/AuthContext"
import InfoEntreprise from "../../components/InfoEntreprise"
import NoSiren from "../../components/ds/NoSiren"
import Page from "../../components/Page"
import UtilisateursEntreprise from "../../components/UtilisateursEntreprise"
import { SinglePageLayout } from "../../containers/SinglePageLayout"

const title = "Mes entreprises"

const MesEntreprises: FunctionComponent = () => {
  useTitle(title)

  const { ownership: sirens } = useUser()
  const orderedSirens = sirens.sort()

  const [chosenSiren, setChosenSiren] = React.useState(orderedSirens?.[0] || "")

  return (
    <SinglePageLayout>
      <Page title={title}>
        {!sirens?.length ? (
          <NoSiren />
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
              <UtilisateursEntreprise siren={chosenSiren} />
            </Flex>
          </>
        )}
      </Page>
    </SinglePageLayout>
  )
}

export default MesEntreprises
