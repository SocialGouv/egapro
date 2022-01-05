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
import { FieldMetaState, FieldRenderProps } from "react-final-form"

export type InputGroupProps = FormControlProps & {
  label: string
  isLabelHidden?: boolean
  field: FieldRenderProps<string, HTMLInputElement>
  message?: {
    help?: string
    error?: string
  }
}

const hasError = (meta: FieldMetaState<string>) =>
  (meta.error && meta.submitFailed) ||
  (meta.error && meta.touched && Object.values({ ...meta.error, required: false }).includes(true))

const InputGroup: FunctionComponent<InputGroupProps> = ({
  isLabelHidden,
  label,
  field: { input, meta },
  message,
  ...rest
}) => (
  <FormControl isInvalid={hasError(meta)} {...rest}>
    <FormLabel htmlFor={input.name}>{isLabelHidden ? <VisuallyHidden>{label}</VisuallyHidden> : label}</FormLabel>
    <Input id={input.name} {...input} />
    {message?.help && <FormHelperText>{message.help}</FormHelperText>}
    {message?.error && <FormErrorMessage>{message.error}</FormErrorMessage>}
  </FormControl>
)

export default InputGroup
