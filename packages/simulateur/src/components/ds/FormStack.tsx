import React, { FunctionComponent } from "react"
import { VStack, StackProps } from "@chakra-ui/react"

export type FormStackProps = StackProps

const FormStack: FunctionComponent<FormStackProps> = ({ children, ...rest }) => {
  return (
    <VStack spacing={6} align="stretch" {...rest}>
      {children}
    </VStack>
  )
}

export default FormStack
