import { Avatar } from "@chakra-ui/avatar"
import { Box, HStack, Text, VStack } from "@chakra-ui/layout"
import React from "react"
import { useHistory } from "react-router-dom"
import { useUser } from "../../components/AuthContext"
import PrimaryButton from "../../components/ds/PrimaryButton"
import Page from "../../components/Page"
import { SinglePageLayout } from "../../containers/SinglePageLayout"
import { useTitle } from "../../utils/hooks"

const title = "Mon profil"

function MonProfil() {
  useTitle(title)
  const history = useHistory()
  const { email, logout } = useUser()

  function logoutUser() {
    logout()
    history.goBack()
  }

  return (
    <SinglePageLayout>
      <Page title={title}>
        <div>
          <div>
            {email ? (
              <VStack spacing={8} alignItems="flex-start">
                <HStack spacing={4}>
                  <Avatar size="sm" name={email} />
                  <Box ml={4}>
                    <VStack>
                      <Text fontSize="lg">{email}</Text>
                    </VStack>
                  </Box>
                </HStack>
                <Box>
                  <PrimaryButton onClick={logoutUser}>Me déconnecter</PrimaryButton>
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
