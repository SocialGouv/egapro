import React, { FunctionComponent } from "react"
import { Input as InputChakra, InputProps as InputChakraProps } from "@chakra-ui/react"
import { FieldRenderProps, FieldMetaState } from "react-final-form"

export const hasFieldError = (meta: FieldMetaState<string>) =>
  (meta.error && meta.submitFailed) ||
  (meta.error && meta.touched && Object.values({ ...meta.error, required: false }).includes(true))

type InputProps = InputChakraProps & {
  field: FieldRenderProps<string, HTMLInputElement>
  autocomplete?: string
}

const Input: FunctionComponent<InputProps> = ({ field: { input, meta }, ...rest }) => {
  return <InputChakra isInvalid={hasFieldError(meta)} id={input.name} {...input} {...rest} />
}

export default Input
