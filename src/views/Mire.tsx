import React from "react"
import { Box, Text } from "@chakra-ui/layout"
import { Form } from "react-final-form"
import { z } from "zod"

import { SinglePageLayout } from "../containers/SinglePageLayout"
import { useTitle, useToastMessage } from "../utils/hooks"
import { sendValidationEmail } from "../utils/api"
import PrimaryButton from "../components/ds/PrimaryButton"
import Page from "../components/Page"
import { DebugForm, formValidator, InputControl } from "../components/ds/form-lib"
import { Redirect, useHistory } from "react-router"
import { useUser } from "../components/AuthContext"

const title = "Accéder à mes entreprises et déclarations réalisées"

/**
 * Check if a token is present in the URL bar. If so, store it in local storage and remove it from the URL bar.
 *
 * An event listener is set on storage event to handle this token and get the user's data (see AuthContext).
 */
function checkIfTokenIsInURL() {
  const urlParams = new URLSearchParams(window.location.search)

  const tokenInURL = urlParams.get("token")

  if (tokenInURL) {
    localStorage.setItem("token", tokenInURL)
  }

  window.history.pushState({}, document.title, window.location.pathname)
}

function Mire() {
  useTitle(title)

  const history = useHistory()
  const { toastSuccess, toastError } = useToastMessage({})
  const [submitted, setSubmitted] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const { isAuthenticated } = useUser()

  checkIfTokenIsInURL()

  const onSubmit = (formData: any) => {
    setEmail(formData.email)

    sendValidationEmail(formData.email)
      .then(() => {
        toastSuccess("Un courriel vous a été envoyé. Veuillez consulter votre boîte !")
        setSubmitted(true)
      })
      .catch((error: Error) => {
        console.error(error)
        toastError("Erreur lors de l'envoi de l'email de validation, est-ce que l'email est valide ?")
        setSubmitted(false)
      })
  }
  const FormInput = z.object({
    email: z.string({ required_error: "Le courriel est requis" }).email({ message: "Le courriel est invalide" }),
  })

  if (isAuthenticated) return <Redirect to="/tableauDeBord/mes-entreprises" />

  return (
    <SinglePageLayout>
      <Page title={title}>
        {submitted ? (
          <Box>
            <Text as="p" mb="4">
              Un courriel vous a été envoyé. Veuillez consulter votre boîte.
            </Text>
            <Text as="p" mb="4">
              Si vous ne recevez pas ce mail sous peu, il se peut que l'adresse saisie (<strong>{email}</strong>) soit
              incorrect, ou bien que le mail ait été déplacé dans votre dossier de courriers indésirables ou dans le
              dossier SPAM.
            </Text>
            <Text as="p" mb="4">
              En cas d'échec, la procédure devra être reprise avec une autre adresse.
            </Text>
            <PrimaryButton mt={6} onClick={() => history.go(0)}>
              Réessayer avec une autre adresse
            </PrimaryButton>
          </Box>
        ) : (
          <Box>
            <Box>
              <Text as="p" mb="4">
                Merci de renseigner votre adresse mail de déclaration.
              </Text>
              <Text as="p" mb="4">
                Un lien vous sera envoyée pour pouvoir accéder à votre espace. Vous pourrez alors voir les entreprises
                que vous gérer, ou bien voir vos déclarations passées.
              </Text>
            </Box>
            <Form
              onSubmit={onSubmit}
              validate={formValidator(FormInput)}
              render={({ handleSubmit, values, submitting, pristine }) => (
                <form onSubmit={handleSubmit}>
                  <InputControl name="email" label="Courriel" />

                  <DebugForm show={false} values={values} />

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
