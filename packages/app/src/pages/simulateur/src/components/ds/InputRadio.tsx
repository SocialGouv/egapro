import React, { FunctionComponent } from "react"
import { Box, Radio, RadioProps } from "@chakra-ui/react"
import { useField } from "react-final-form"

type RadioButtonProps = RadioProps & { fieldName: string; choiceValue: string }

const InputRadio: FunctionComponent<RadioButtonProps> = ({ fieldName, choiceValue, children, ...rest }) => {
  const { input } = useField(fieldName, { type: "radio", value: choiceValue })
  return (
    <Box
      as={Radio}
      colorScheme="primary"
      bg="transparent"
      borderColor="gray.500"
      borderWidth="1px"
      isFocusable
      {...rest}
      {...input}
    >
      {children}
    </Box>
  )
}

export default InputRadio
