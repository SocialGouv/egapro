import React, { FunctionComponent } from "react"
import { VStack } from "@chakra-ui/react"

import InfoBlock from "./ds/InfoBlock"
import ButtonAction from "./ButtonAction"

interface FormSubmitProps {
  submitFailed: boolean
  hasValidationErrors: boolean
  errorMessage?: string
  loading?: boolean
  label?: string
}

const FormSubmit: FunctionComponent<FormSubmitProps> = ({
  submitFailed,
  hasValidationErrors,
  errorMessage,
  loading = false,
  label = "Valider les" + " informations",
}) => {
  return (
    <VStack spacing={6} align="flex-start">
      <ButtonAction label={label} type="submit" disabled={loading} loading={loading} size="lg" />
      {errorMessage && submitFailed && hasValidationErrors && <InfoBlock type="error" title={errorMessage} />}
    </VStack>
  )
}

export default FormSubmit
