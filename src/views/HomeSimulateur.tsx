import React, { FunctionComponent } from "react"
import {
  Text,
  Input,
  InputGroup,
  FormLabel,
  InputRightElement,
  VisuallyHidden,
  Button,
  Image,
  useClipboard,
  FormControl,
} from "@chakra-ui/react"

import { useTitle } from "../utils/hooks"

import Page from "../components/Page"
import ActionBar from "../components/ActionBar"
import { ButtonSimulatorLink } from "../components/SimulatorLink"

const title = "Début d'un calcul d'index"

const HomeSimulateur: FunctionComponent = () => {
  useTitle(title)
  const link = window.location.href
  const { hasCopied, onCopy } = useClipboard(link)

  return (
    <Page title="Bienvenue sur Index Egapro">
      <FormControl>
        <FormLabel htmlFor="link">
          <VisuallyHidden>Lien de la déclaration</VisuallyHidden>
        </FormLabel>
        <InputGroup size="md">
          <Input id="link" onClick={onCopy} defaultValue={link} pr="8rem" type={"text"} placeholder="Enter password" />
          <InputRightElement width="7rem" sx={{ right: 1 }}>
            <Button h="1.75rem" size="sm" onClick={onCopy} variant="outline" colorScheme="primary">
              {hasCopied ? <>Lien&nbsp;copié</> : <>Copier&nbsp;le&nbsp;lien</>}
            </Button>
          </InputRightElement>
        </InputGroup>
      </FormControl>

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

      <Image src={`${process.env.PUBLIC_URL}/illustration-home-simulator.svg`} alt="" aria-hidden="true" mt={20} />
    </Page>
  )
}

export default HomeSimulateur
