import React from "react"
import { Flex } from "@chakra-ui/layout"
import { FormControl, FormLabel } from "@chakra-ui/form-control"

import { useTitle } from "../../utils/hooks"
import { SinglePageLayout } from "../../containers/SinglePageLayout"
import Page from "../../components/Page"
import { useUser } from "../../components/AuthContext"
import InfoEntreprise from "../../components/InfoEntreprise"
import UtilisateursEntreprise from "../../components/UtilisateursEntreprise"
import { Input } from "@chakra-ui/react"

const title = "Gérer les utilisateurs"

function GererUtilisateursPage() {
  useTitle(title)

  const { staff } = useUser()

  const [siren, setSiren] = React.useState("")
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target?.value
    setSiren(value ? value.replace(/\s/g, "") : value)
  }

  return (
    <SinglePageLayout>
      <Page title={title}>
        {!staff ? (
          <p>Vous n'êtes pas membre du staff.</p>
        ) : (
          <React.Fragment>
            <FormControl id="siren">
              <FormLabel>SIREN</FormLabel>
              <Input value={siren} onChange={handleChange} placeholder="Saisissez le SIREN de l'entreprise" />
            </FormControl>

            {siren?.length === 9 && (
              <Flex mt="6" direction="column">
                <InfoEntreprise siren={siren} />
                <UtilisateursEntreprise siren={siren} />
              </Flex>
            )}
          </React.Fragment>
        )}
      </Page>
    </SinglePageLayout>
  )
}

export default GererUtilisateursPage
