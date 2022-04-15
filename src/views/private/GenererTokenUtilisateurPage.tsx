import React, { FunctionComponent } from "react"
import {
  Flex,
  FormControl,
  Text,
  Input,
  HStack,
  FormErrorMessage,
  useClipboard,
  VStack,
  Alert,
  AlertIcon,
  AlertDescription,
  FormLabel,
} from "@chakra-ui/react"
import * as z from "zod"

import { useTitle } from "../../utils/hooks"

import { SinglePageLayout } from "../../containers/SinglePageLayout"
import Page from "../../components/Page"
import { useUser } from "../../components/AuthContext"
import FormSubmit from "../../components/FormSubmit"
import PrimaryButton from "../../components/ds/PrimaryButton"
import { LinkIcon } from "@chakra-ui/icons"
import { generateImpersonateToken } from "../../utils/api"

const title = "Générer le token pour un utilisateur"

const URL_SIMU = "/nouvelle-simulation"
const URL_DECLA = "/declaration/"

const getOrigin = window?.location?.origin || ""

const buildUrl = (token: string, front: "simu" | "decla") =>
  `${getOrigin}${front === "simu" ? URL_SIMU : URL_DECLA}?token=${token}`

type Status =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "success"; token: string }
  | { type: "error"; error: string }

const GenererTokenUtilisateurPage: FunctionComponent = () => {
  useTitle(title)

  const { staff } = useUser()

  const [email, setEmail] = React.useState("")
  const [error, setError] = React.useState("")
  const [status, setStatus] = React.useState<Status>({ type: "idle" })

  const linkSimu = status.type === "success" ? buildUrl(status.token, "simu") : ""
  const linkDecla = status.type === "success" ? buildUrl(status.token, "decla") : ""

  const { hasCopied: hasCopiedSimu, onCopy: onCopySimu } = useClipboard(linkSimu)
  const { hasCopied: hasCopiedDecla, onCopy: onCopyDecla } = useClipboard(linkDecla)

  const schemaForm = z.string().email()

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const email = event.target?.value?.trim() || ""
    if (!email) setStatus({ type: "idle" })

    setEmail(email)
    setError("")
  }

  return (
    <SinglePageLayout>
      <Page title={title}>
        {!staff ? (
          <Text>Vous n'êtes pas membre du staff.</Text>
        ) : (
          <>
            <Alert status="info" variant="left-accent" mb="6">
              <AlertIcon />
              <AlertDescription>
                <Text fontSize="md">
                  Vous pouvez créer des liens authentifiés sur les sites de simulation ou de déclaration.
                </Text>

                <Text>
                  Ainsi, un lien peut être envoyé par un email personnel et éviter certains problèmes d'acheminement.
                </Text>
              </AlertDescription>
            </Alert>

            <form
              onSubmit={async (event) => {
                event.preventDefault()

                if (!schemaForm.safeParse(email).success) {
                  setError("L'adresse email n'est pas valide.")
                  setStatus({ type: "idle" })
                } else {
                  setStatus({ type: "loading" })

                  try {
                    const { token } = await generateImpersonateToken(email)
                    setStatus({ type: "success", token })
                  } catch (error: unknown) {
                    setStatus({ type: "error", error: (error as Error).message })
                  }
                }
              }}
            >
              <HStack id="hstack" alignItems="baseline">
                <FormControl id="email" flex="1" isInvalid={Boolean(error)}>
                  <FormLabel htmlFor="email">Email</FormLabel>
                  <Input value={email} onChange={handleChange} placeholder="Saisissez l'email d'un utilisateur" />
                  <FormErrorMessage>L'email est incorrect</FormErrorMessage>
                </FormControl>

                <VStack id="vstack">
                  {/* Text placeholder to kepp alignment correct */}
                  <Text visibility="hidden">No text</Text>
                  <FormSubmit
                    loading={status.type === "loading"}
                    label="Générer"
                    disabled={!email || Boolean(error)}
                    size="md"
                  />
                </VStack>
              </HStack>
            </form>

            <Flex direction="column">
              {status.type === "success" && (
                <VStack spacing="8" mt="16">
                  <HStack>
                    <PrimaryButton variant="outline" size="sm" minW={0} onClick={onCopySimu}>
                      {hasCopiedSimu ? (
                        <>Lien&nbsp;copié&nbsp;👍</>
                      ) : (
                        <>
                          <LinkIcon mr="2" /> Lien d'authentification vers le simulateur
                        </>
                      )}
                    </PrimaryButton>
                  </HStack>

                  <HStack mt={2}>
                    <PrimaryButton variant="outline" size="sm" minW={0} onClick={onCopyDecla}>
                      {hasCopiedDecla ? (
                        <>Lien&nbsp;copié&nbsp;👍</>
                      ) : (
                        <>
                          <LinkIcon mr="2" /> Lien d'authentification vers la déclaration
                        </>
                      )}
                    </PrimaryButton>
                  </HStack>
                </VStack>
              )}
            </Flex>
          </>
        )}
      </Page>
    </SinglePageLayout>
  )
}

export default GenererTokenUtilisateurPage
