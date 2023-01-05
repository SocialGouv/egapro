import React, { useState } from "react"
import { Flex, FormControl, FormLabel, Text, Input, Box, Spacer } from "@chakra-ui/react"

import { useTitle } from "../../utils/hooks"

import { SinglePageLayout } from "../../containers/SinglePageLayout"
import Page from "../../components/Page"
import { useUser } from "../../components/AuthContext"
import InfoEntreprise from "../../components/InfoEntreprise"
import UtilisateursEntreprise from "../../components/UtilisateursEntreprise"

const title = "Gérer les utilisateurs"

const GererUtilisateursPage = () => {
  useTitle(title)

  const { staff } = useUser()

  const [siren, setSiren] = useState("")
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
            <Flex mt="6" direction="column">
              <FormControl id="siren">
                <FormLabel>SIREN</FormLabel>
                <Flex direction="row" gap="4">
                  <Input
                    w="fit-content"
                    value={siren}
                    onChange={handleChange}
                    placeholder="Saisissez le SIREN de l'entreprise"
                  />
                  <Box flex="auto">{siren?.length === 9 ? <InfoEntreprise siren={siren} /> : <Spacer />}</Box>
                </Flex>
              </FormControl>
              {siren?.length === 9 && <UtilisateursEntreprise siren={siren} />}
            </Flex>
          </>
        )}
      </Page>
    </SinglePageLayout>
  )
}

export default GererUtilisateursPage
