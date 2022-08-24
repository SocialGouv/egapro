import React, { FunctionComponent } from "react"
import {
  Box,
  FormControl,
  FormControlProps,
  Input,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  VisuallyHidden,
} from "@chakra-ui/react"
import { Field } from "react-final-form"

import { isFieldHasError } from "../../utils/formHelpers"
import ActivityIndicator from "../ActivityIndicator"

export type InputGroupProps = FormControlProps & {
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
  message?: {
    help?: React.ReactElement | string
    error?: React.ReactElement | string
  }
}

const InputGroup: FunctionComponent<InputGroupProps> = ({
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
  ...rest
}) => {
  const msgStyle = { flexDirection: "column", alignItems: "flex-start" }
  return (
    <Field name={fieldName} validate={validate} component="input">
      {({ input, meta }) => {
        return (
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
                {...input}
                {...(textAlign && { textAlign })}
                {...(type === "number" && min && { min })}
                {...(type === "number" && max && { max })}
              />
              {isLoading && (
                <Box position="absolute" right={2} top={2} zIndex={2} pointerEvents="none">
                  <ActivityIndicator />
                </Box>
              )}
            </Box>
            {message?.help && <FormHelperText sx={msgStyle}>{message.help}</FormHelperText>}
            {showError && message?.error && <FormErrorMessage sx={msgStyle}>{message.error}</FormErrorMessage>}
            {showError && !message?.error && meta?.error && (
              <FormErrorMessage sx={msgStyle}>{meta.error}</FormErrorMessage>
            )}
          </FormControl>
        )
      }}
    </Field>
  )
}

export default InputGroup
