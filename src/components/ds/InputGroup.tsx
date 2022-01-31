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
  isLabelHidden?: boolean
  fieldName: string
  autocomplete?: string
  isLoading?: boolean
  hasError?: boolean
  message?: {
    help?: React.ReactElement | string
    error?: React.ReactElement | string
  }
}

const InputGroup: FunctionComponent<InputGroupProps> = ({
  isLabelHidden,
  label,
  fieldName,
  message,
  autocomplete,
  isLoading,
  hasError,
  ...rest
}) => {
  const msgStyle = { flexDirection: "column", alignItems: "flex-start" }
  return (
    <Field name={fieldName} component="input">
      {({ input, meta }) => (
        <FormControl isInvalid={hasError || isFieldHasError(meta)} {...rest}>
          <FormLabel htmlFor={input.name}>{isLabelHidden ? <VisuallyHidden>{label}</VisuallyHidden> : label}</FormLabel>
          <Box position="relative">
            <Input id={input.name} autocomplete={autocomplete} {...input} />
            {isLoading && (
              <Box position="absolute" right={2} top={2} zIndex={2} pointerEvents="none">
                <ActivityIndicator />
              </Box>
            )}
          </Box>
          {message?.help && <FormHelperText sx={msgStyle}>{message.help}</FormHelperText>}
          {message?.error && <FormErrorMessage sx={msgStyle}>{message.error}</FormErrorMessage>}
        </FormControl>
      )}
    </Field>
  )
}

export default InputGroup
