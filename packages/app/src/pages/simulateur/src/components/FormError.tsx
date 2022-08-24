import React, { FunctionComponent } from "react"
import { Box } from "@chakra-ui/react"

import InfoBlock from "./ds/InfoBlock"

export type FormErrorProps = {
  message: string
}

const FormError: FunctionComponent<FormErrorProps> = ({ message }) => {
  return (
    <InfoBlock
      type="error"
      text={
        <Box as="span" fontWeight="semibold" color="red.900">
          {message}
        </Box>
      }
    />
  )
}

export default FormError
