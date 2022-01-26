import React, { FunctionComponent } from "react"
import {
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

export type InputGroupProps = FormControlProps & {
  label: string
  isLabelHidden?: boolean
  fieldName: string
  autocomplete?: string
  message?: {
    help?: string
    error?: string
  }
}

const InputGroup: FunctionComponent<InputGroupProps> = ({
  isLabelHidden,
  label,
  fieldName,
  message,
  autocomplete,
  ...rest
}) => (
  <Field name={fieldName} component="input">
    {({ input, meta }) => (
      <FormControl isInvalid={isFieldHasError(meta)} {...rest}>
        <FormLabel htmlFor={input.name}>{isLabelHidden ? <VisuallyHidden>{label}</VisuallyHidden> : label}</FormLabel>
        <Input id={input.name} autocomplete={autocomplete} {...input} />
        {message?.help && <FormHelperText>{message.help}</FormHelperText>}
        {message?.error && <FormErrorMessage>{message.error}</FormErrorMessage>}
      </FormControl>
    )}
  </Field>
)

export default InputGroup
