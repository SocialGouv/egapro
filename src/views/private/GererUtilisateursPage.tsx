import React, { FunctionComponent } from "react"
import { Flex, FormControl, FormLabel, Text, Input } from "@chakra-ui/react"

import { useTitle } from "../../utils/hooks"

import { SinglePageLayout } from "../../containers/SinglePageLayout"
import Page from "../../components/Page"
import { useUser } from "../../components/AuthContext"
import InfoEntreprise from "../../components/InfoEntreprise"
import UtilisateursEntreprise from "../../components/UtilisateursEntreprise"

const title = "Gérer les utilisateurs"

const GererUtilisateursPage: FunctionComponent = () => {
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
          <Text>Vous n'êtes pas membre du staff.</Text>
        ) : (
          <>
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
          </>
        )}
      </Page>
    </SinglePageLayout>
  )
}

export default GererUtilisateursPage
