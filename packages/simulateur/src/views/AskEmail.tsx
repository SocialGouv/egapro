import { Box, Heading, Image, Text } from "@chakra-ui/react"
import React, { PropsWithChildren, useState } from "react"
import { Form } from "react-final-form"
import { z } from "zod"

import { sendValidationEmail } from "../utils/api"
import { useTitle } from "../utils/hooks"

import ActionBar from "../components/ActionBar"
import ButtonAction from "../components/ds/ButtonAction"
import { formValidator } from "../components/ds/form-lib"
import FormStack from "../components/ds/FormStack"
import InputGroup from "../components/ds/InputGroup"
import FormError from "../components/FormError"
import FormSubmit from "../components/FormSubmit"
import Page from "../components/Page"
import { EMAIL_REGEX } from "../utils/regex"

const FormInput = z.object({
  email: z
    .string({ required_error: "L'adresse email est requise" })
    .min(1, { message: "L'adresse email est requise" })
    .regex(EMAIL_REGEX, { message: "L'adresse email est invalide" }),
})

interface AskEmailProps {
  tagLine?: string
}

const title = "Validation de l'email"

const AskEmail = ({ tagLine, children }: PropsWithChildren<AskEmailProps>) => {
  useTitle(title)

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
  const [submitted, setSubmitted] = useState(false)

  const onSubmit = async (formData: z.infer<typeof FormInput>) => {
    setLoading(true)
    setErrorMessage(undefined)

    try {
      await sendValidationEmail(formData.email)
      setSubmitted(true)
    } catch (error) {
      console.error(error)
      setSubmitted(false)
      setErrorMessage("Erreur lors de l'envoi de l'email de validation, est-ce que l'email est valide ?")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Page title={title}>
      {tagLine && (
        <Heading as="h2" fontSize="lg" mb={4}>
          {tagLine}
        </Heading>
      )}
      <Form onSubmit={onSubmit} validate={formValidator(FormInput)}>
        {({ handleSubmit, hasValidationErrors, submitFailed, values }) =>
          submitted ? (
            <>
              <Text>Vous allez recevoir un mail sur l'adresse email que vous avez indiquée à l'étape précédente.</Text>
              <Text mt={2}>
                <strong>Ouvrez ce mail et cliquez sur le lien de validation.</strong>
              </Text>
              <Text mt={2}>
                Si vous ne recevez pas ce mail sous peu, il se peut que l'email saisi (<strong>{values.email}</strong>)
                soit incorrect, ou bien que le mail ait été déplacé dans votre dossier de courriers indésirables ou dans
                le dossier SPAM. En cas d'échec, la procédure devra être reprise avec un autre email.
              </Text>
              <Box mt={6}>
                <ButtonAction onClick={() => setSubmitted(false)} label="Modifier l'email" />
              </Box>
            </>
          ) : (
            <>
              {children}
              <Box mt={6} maxW="lg">
                <form onSubmit={handleSubmit}>
                  <FormStack>
                    {errorMessage && submitFailed && hasValidationErrors && <FormError message={errorMessage} />}
                    <InputGroup fieldName="email" label="Adresse email" type="email" />
                  </FormStack>
                  <ActionBar>
                    <FormSubmit loading={loading} label="Envoyer" />
                  </ActionBar>
                </form>
              </Box>
            </>
          )
        }
      </Form>
      <Image src={`${process.env.PUBLIC_URL}/illustration-home-simulator.svg`} alt="" aria-hidden="true" mt={20} />
    </Page>
  )
}

export default AskEmail
