import React from "react"
import { Box } from "@chakra-ui/layout"
import { Form } from "react-final-form"
import { z } from "zod"

import { SinglePageLayout } from "../containers/SinglePageLayout"
import { useTitle, useToastMessage } from "../utils/hooks"
import { sendValidationEmail } from "../utils/api"
import PrimaryButton from "../components/ds/PrimaryButton"
import Page from "../components/Page"
import { DebugForm, formValidator, InputControl } from "../components/ds/form-lib"

const title = "Renseigner votre courriel"

function Mire() {
  useTitle(title)
  const { toastSuccess, toastError } = useToastMessage({})
  const [submitted, setSubmitted] = React.useState(false)

  const onSubmit = (formData: any) => {
    console.log("email", formData.email)

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

  return (
    <SinglePageLayout>
      <Page title={title}>
        {submitted ? (
          <Box>Un courriel vous a été envoyé. Veuillez consulter votre boîte !</Box>
        ) : (
          <Box>
            <Form
              onSubmit={onSubmit}
              validate={formValidator(FormInput)}
              render={({ handleSubmit, values, submitting, pristine }) => (
                <form onSubmit={handleSubmit}>
                  <InputControl name="email" label="Courriel" />

                  <DebugForm show={true} values={values} />

                  <PrimaryButton type="submit" disabled={submitting || pristine} mt={4}>
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
