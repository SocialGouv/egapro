import { Avatar } from "@chakra-ui/avatar"
import { Box, HStack, Text, VStack } from "@chakra-ui/layout"
import React from "react"
import { useHistory } from "react-router-dom"
import PrimaryButton from "../../components/ds/PrimaryButton"
// import Title1 from "../../components/ds/Title1"
import Page from "../../components/Page"
import { SinglePageLayout } from "../../containers/SinglePageLayout"
import { useTitle } from "../../utils/hooks"

const title = "Mon profil"

function MonProfil() {
  useTitle(title)
  const history = useHistory()

  const tokenInfoLS = localStorage.getItem("tokenInfo")
  const tokenInfo = tokenInfoLS ? JSON.parse(tokenInfoLS) : null

  function deconnectUser() {
    localStorage.setItem("token", "")
    localStorage.setItem("tokenInfo", "")

    history.goBack()
  }

  return (
    <SinglePageLayout>
      <Page title={title}>
        <div>
          <div>
            {tokenInfo ? (
              <VStack spacing={8} alignItems="flex-start">
                <HStack spacing={4}>
                  <Avatar size="sm" name={tokenInfo?.email} />
                  <Box ml={4}>
                    <VStack>
                      <Text fontSize="lg">{tokenInfo?.email}</Text>
                    </VStack>
                  </Box>
                </HStack>
                <Box>
                  <PrimaryButton onClick={deconnectUser}>Me déconnecter</PrimaryButton>
                </Box>
              </VStack>
            ) : (
              "Utilisateur non connecté"
            )}
          </div>
        </div>
      </Page>
    </SinglePageLayout>
  )
}

export default MonProfil
