import React from "react"
import {
  Box,
  FormControl,
  FormControlProps,
  Input,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  VisuallyHidden,
  useToken,
  Text,
} from "@chakra-ui/react"
import { Field } from "react-final-form"

import { isFieldHasError } from "../../utils/formHelpers"
import ActivityIndicator from "../ActivityIndicator"

export type InputGroupRowProps = FormControlProps & {
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

const InputGroupRow: React.FC<InputGroupRowProps> = ({
  isLabelHidden,
  label,
  placeholder,
  fieldName,
  message,
  autocomplete = "off",
  isLoading,
  hasError,
  type = "text",
  textAlign = "left",
  validate,
  min,
  max,
  showError = true,
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
    <Field name={fieldName} validate={validate} component="input">
      {({ input, meta }) => {
        const remainingCharacters = maxLength ? maxLength - input.value?.length : 0
        const color = remainingCharacters < 10 ? warningColor : successColor

        return (
          <>
            <FormControl isInvalid={hasError || isFieldHasError(meta) || (meta.error && meta.touched)} {...rest}>
              <FormLabel htmlFor={input.name}>
                {isLabelHidden ? <VisuallyHidden>{label}</VisuallyHidden> : label}
              </FormLabel>
              <Box position="relative">
                <Input
                  id={input.name}
                  placeholder={placeholder}
                  autoComplete={autocomplete}
                  type={type}
                  width={width}
                  {...(htmlSize && { htmlSize })}
                  {...input}
                  {...(textAlign && { textAlign })}
                  {...(type === "number" && min && { min })}
                  {...(type === "number" && max && { max })}
                  {...(maxLength && { maxLength })}
                />
                {isLoading && (
                  <Box position="absolute" right={2} top={2} zIndex={2} pointerEvents="none">
                    <ActivityIndicator />
                  </Box>
                )}
                {showError && message?.error && <FormErrorMessage sx={msgStyle}>{message.error}</FormErrorMessage>}
                {showError && !message?.error && meta?.error && (
                  <FormErrorMessage sx={msgStyle}>{meta.error}</FormErrorMessage>
                )}
                {showRemainingCharacters && maxLength && (
                  <Text color={color} mt="1" fontSize="sm">
                    {remainingCharacters} caractère{remainingCharacters > 1 && "s"} restant
                    {remainingCharacters > 1 && "s"}
                  </Text>
                )}
              </Box>
              {message?.help && <FormHelperText sx={msgStyle}>{message.help}</FormHelperText>}
            </FormControl>
          </>
        )
      }}
    </Field>
  )
}

export default InputGroupRow
