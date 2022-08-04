import React, { FunctionComponent, useState } from "react"
import { Form } from "react-final-form"
import { z } from "zod"
import { Box, Heading, Text, Image } from "@chakra-ui/react"

import { useTitle } from "../utils/hooks"
import { sendValidationEmail } from "../utils/api"

import ButtonAction from "../components/ds/ButtonAction"
import InputGroup from "../components/ds/InputGroup"
import { formValidator } from "../components/ds/form-lib"
import FormStack from "../components/ds/FormStack"
import Page from "../components/Page"
import ActionBar from "../components/ActionBar"
import FormError from "../components/FormError"
import FormSubmit from "../components/FormSubmit"

const FormInput = z.object({
  email: z
    .string({ required_error: "L'adresse mail est requise" })
    .min(1, { message: "L'adresse mail est requise" })
    .email({ message: "L'adresse mail est invalide" }),
})

interface AskEmailProps {
  tagLine?: string
  reason?: string
}

const title = "Validation de l'email"

const AskEmail: FunctionComponent<AskEmailProps> = ({ tagLine, reason }) => {
  useTitle(title)

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
  const [submitted, setSubmitted] = useState(false)

  const onSubmit = (formData: any) => {
    setLoading(true)
    setErrorMessage(undefined)
    sendValidationEmail(formData.email)
      .then(() => {
        setLoading(false)
        setSubmitted(true)
      })
      .catch((error: Error) => {
        console.error(error)
        setLoading(false)
        setSubmitted(false)
        setErrorMessage("Erreur lors de l'envoi de l'email de validation, est-ce que l'email est valide ?")
      })
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
              {reason && <Text mt={2}>{reason}</Text>}
              <Text>
                L’email saisi doit être valide. Il sera celui sur lequel sera adressé l’accusé de réception en fin de
                procédure et celui qui vous permettra d'accéder à votre déclaration une fois validée et transmise.
              </Text>
              <Text mt={2}>
                <strong>Attention&nbsp;:</strong> en cas d'email erroné, vous ne pourrez pas remplir le formulaire ou
                accéder à votre déclaration déjà transmise.
              </Text>
              <Box mt={6} maxW="lg">
                <form onSubmit={handleSubmit}>
                  <FormStack>
                    {errorMessage && submitFailed && hasValidationErrors && <FormError message={errorMessage} />}
                    <InputGroup fieldName="email" label="Votre Email" type="email" />
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
