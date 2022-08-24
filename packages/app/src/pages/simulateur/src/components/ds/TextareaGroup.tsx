import React, { FunctionComponent } from "react"
import {
  FormControl,
  FormControlProps,
  Textarea,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  VisuallyHidden,
} from "@chakra-ui/react"
import { Field } from "react-final-form"
import { isFieldHasError, required } from "../../utils/formHelpers"

export type TextareaGroupProps = FormControlProps & {
  label: string
  fieldName: string
  isLabelHidden?: boolean
  message?: {
    help?: string
    error?: string
  }
  autovalidation?: boolean // If true, the field will be validated via default validators. If no, you can use your own validator (see ObjectifsMesuresPage.tsx).
}

const TextareaGroup: FunctionComponent<TextareaGroupProps> = ({
  isLabelHidden,
  label,
  fieldName,
  message,
  autovalidation = true,
  ...rest
}) => (
  <Field name={fieldName} {...(autovalidation && { validate: required })} component="textarea">
    {({ input, meta }) => (
      <FormControl isInvalid={isFieldHasError(meta) || (meta.error && meta.touched)} {...rest}>
        <FormLabel htmlFor={input.name}>{isLabelHidden ? <VisuallyHidden>{label}</VisuallyHidden> : label}</FormLabel>
        <Textarea id={input.name} {...input} />
        {message?.help && <FormHelperText>{message.help}</FormHelperText>}
        {message?.error && <FormErrorMessage>{message.error}</FormErrorMessage>}
        {!message?.error && meta?.error && <FormErrorMessage>{meta.error}</FormErrorMessage>}
      </FormControl>
    )}
  </Field>
)

export default TextareaGroup
