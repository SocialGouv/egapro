import {
  Box,
  FormControl,
  FormControlProps,
  FormErrorMessage,
  FormLabel,
  Text,
  Textarea,
  useToken,
} from "@chakra-ui/react"
import React from "react"
import { Field } from "react-final-form"

import { isFieldHasError } from "../../utils/formHelpers"

type Props = FormControlProps & {
  label: string
  placeholder?: string
  isLabelHidden?: boolean
  fieldName: string
  autocomplete?: string
  isLoading?: boolean
  hasError?: boolean
  validate?: any
  type?: React.HTMLInputTypeAttribute
  textAlign?: string
  min?: number
  max?: number
  showError?: boolean
  htmlSize?: number
  maxLength?: number
  showRemainingCharacters?: boolean
  width?: string
  message?: {
    help?: React.ReactElement | string
    error?: React.ReactElement | string
  }
}

const TextareaCounter: React.FC<Props> = ({
  label,
  placeholder,
  fieldName,
  type = "text",
  textAlign = "left",
  htmlSize,
  maxLength,
  showRemainingCharacters = false,
  width = "auto",
  ...rest
}) => {
  const [successColor] = useToken("colors", ["gray.500"])
  const [warningColor] = useToken("colors", ["orange.400"])

  const msgStyle = { flexDirection: "column", alignItems: "flex-start" }
  return (
    <Field name={fieldName} component="input">
      {({ input, meta }) => {
        const remainingCharacters = maxLength ? maxLength - input.value?.length : 0
        const color = remainingCharacters < 10 ? warningColor : successColor

        return (
          <FormControl isInvalid={isFieldHasError(meta) || (meta.error && meta.touched)} {...rest}>
            <FormLabel htmlFor={input.name}>{label}</FormLabel>
            <Box position="relative">
              <Textarea
                id={input.name}
                placeholder={placeholder}
                width="600px"
                {...(htmlSize && { htmlSize })}
                {...input}
                {...(textAlign && { textAlign })}
                {...(maxLength && { maxLength })}
              />

              {meta?.error && <FormErrorMessage sx={msgStyle}>{meta.error}</FormErrorMessage>}
              {showRemainingCharacters && maxLength && (
                <Text color={color} mt="1" fontSize="sm">
                  {remainingCharacters} caractère{remainingCharacters > 1 && "s"} restant
                  {remainingCharacters > 1 && "s"}
                </Text>
              )}
            </Box>
          </FormControl>
        )
      }}
    </Field>
  )
}

export default TextareaCounter
