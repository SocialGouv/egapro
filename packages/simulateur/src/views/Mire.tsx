import React, { useState } from "react"
import { Box, Text } from "@chakra-ui/layout"
import { Form } from "react-final-form"
import { Redirect, useHistory } from "react-router"

import { useTitle, useToastMessage } from "../utils/hooks"
import { sendValidationEmail } from "../utils/api"
import { FieldEmail } from "../components/ds/FieldEmail"
import PrimaryButton from "../components/ds/PrimaryButton"
import Page from "../components/Page"
import { useCheckTokenInURL, useUser } from "../components/AuthContext"
import { SinglePageLayout } from "../containers/SinglePageLayout"

const title = "Accéder à mes entreprises et déclarations transmises"

const Mire = () => {
  useTitle(title)

  const history = useHistory()
  const { toastSuccess, toastError } = useToastMessage({})
  const [submitted, setSubmitted] = useState(false)
  const [email, setEmail] = useState("")
  const { isAuthenticated, staff } = useUser()

  useCheckTokenInURL()

  const onSubmit = (formData: any) => {
    setEmail(formData.email)

    sendValidationEmail(formData.email)
      .then(() => {
        toastSuccess("Un mail vous a été envoyé")
        setSubmitted(true)
      })
      .catch((error: Error) => {
        console.error(error)
        toastError("Erreur lors de l'envoi de l'email de validation, est-ce que l'email est valide ?")
        setSubmitted(false)
      })
  }

  if (staff) return <Redirect to="/tableauDeBord/gerer-utilisateurs" />
  if (isAuthenticated) return <Redirect to="/tableauDeBord/mes-declarations" />

  return (
    <SinglePageLayout>
      <Page title={title}>
        {submitted ? (
          <Box>
            <Text as="p" mb="4">
              Un mail vous a été envoyé.
            </Text>
            <Text as="p" mb="4">
              Si vous ne recevez pas ce mail sous peu, il se peut que l'email saisi (<strong>{email}</strong>) soit
              incorrect, ou bien que le mail ait été déplacé dans votre dossier de courriers indésirables ou dans le
              dossier SPAM.
            </Text>
            <Text as="p" mb="4">
              En cas d'échec, la procédure devra être reprise avec un autre email.
            </Text>
            <PrimaryButton mt={6} onClick={() => history.go(0)}>
              Réessayer
            </PrimaryButton>
          </Box>
        ) : (
          <Box>
            <Box>
              <Text as="p" mb="4">
                Veuillez saisir votre email.
              </Text>
              <Text as="p" mb="4">
                Un lien vous sera envoyé pour pouvoir accéder à votre espace. Vous pourrez alors voir les entreprises
                que vous gérez ainsi que les déclarations déjà transmises.
              </Text>
            </Box>
            <Form
              onSubmit={onSubmit}
              render={({ handleSubmit, submitting, pristine }) => (
                <form onSubmit={handleSubmit}>
                  <FieldEmail />

                  <PrimaryButton type="submit" disabled={submitting || pristine} mt={6}>
                    Envoyer
                  </PrimaryButton>
                </form>
              )}
            />
          </Box>
        )}
      </Page>
    </SinglePageLayout>
  )
}

export default Mire
