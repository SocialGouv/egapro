import React, { FunctionComponent } from "react"
import { FormControl, FormControlProps, Checkbox, FormErrorMessage, FormHelperText } from "@chakra-ui/react"
import { FieldMetaState, FieldRenderProps } from "react-final-form"

export type InputCheckboxGroupProps = FormControlProps & {
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

const InputCheckboxGroup: FunctionComponent<InputCheckboxGroupProps> = ({
  label,
  field: { input, meta },
  message,
  ...rest
}) => (
  <FormControl isInvalid={hasError(meta)} {...rest}>
    <Checkbox id={input.name} {...input}>
      {label}
    </Checkbox>
    {message?.help && <FormHelperText>{message.help}</FormHelperText>}
    {message?.error && <FormErrorMessage>{message.error}</FormErrorMessage>}
  </FormControl>
)

export default InputCheckboxGroup
