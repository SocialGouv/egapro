import React, { FunctionComponent } from "react"
import { Avatar, Badge, Box, HStack, Text, VStack } from "@chakra-ui/react"

import { useUser } from "../../components/AuthContext"
import Page from "../../components/Page"
import { SinglePageLayout } from "../../containers/SinglePageLayout"
import { useTitle } from "../../utils/hooks"

const title = "Mon profil"

const MonProfil: FunctionComponent = () => {
  useTitle(title)
  const { email, staff } = useUser()

  return (
    <SinglePageLayout>
      <Page title={title}>
        {email ? (
          <VStack spacing={8} alignItems="flex-start">
            <HStack spacing={4}>
              <Avatar size="sm" name={email} />
              <Box ml={4}>
                <VStack>
                  <Text fontSize="lg">
                    {email}
                    {"  "}
                    {staff && <Badge colorScheme="green">Staff</Badge>}
                  </Text>
                </VStack>
              </Box>
            </HStack>
          </VStack>
        ) : (
          "Utilisateur non connecté"
        )}
      </Page>
    </SinglePageLayout>
  )
}

export default MonProfil
