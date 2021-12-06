import React from "react"
import { Text, Input, InputGroup, InputRightElement, Button, Image, useToast } from "@chakra-ui/react"
import Page from "../components/Page"
import ActionBar from "../components/ActionBar"
import { ButtonSimulatorLink } from "../components/SimulatorLink"
import { useTitle } from "../utils/hooks"

const title = "Début d'un calcul d'index"

function HomeSimulateur(): JSX.Element {
  useTitle(title)
  const toast = useToast()
  const link = window.location.href

  const onCopy = () => {
    navigator.clipboard.writeText(link)
    toast({
      title: "Code copié",
      description: "Pensez à conserver ce code précieusement.",
      position: "bottom-right",
      status: "success",
      duration: 6000,
      isClosable: true,
    })
  }

  return (
    <Page title="Bienvenue sur Index Egapro">
      <InputGroup size="md">
        <Input onClick={onCopy} defaultValue={link} pr="8rem" type={"text"} placeholder="Enter password" />
        <InputRightElement width="7rem" sx={{ right: 1 }}>
          <Button h="1.75rem" size="sm" onClick={onCopy} variant="outline" colorScheme="primary">
            <div>Copier&nbsp;le&nbsp;lien</div>
          </Button>
        </InputRightElement>
      </InputGroup>

      <Text mt={6}>
        Afin de pouvoir réaccéder à tout moment à votre calcul&nbsp;:{" "}
        <strong>pensez à copier le code ci-dessus et le conserver précieusement</strong>.
      </Text>

      <ActionBar>
        <ButtonSimulatorLink
          to="/informations"
          label="Étape suivante"
          aria-label="Aller à : Informations calcul et période de référence"
        />
      </ActionBar>

      <Image src={`${process.env.PUBLIC_URL}/illustration-home-simulator.svg`} />
    </Page>
  )
}

export default HomeSimulateur
