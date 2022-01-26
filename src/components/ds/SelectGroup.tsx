import React, { FunctionComponent } from "react"
import { Field } from "react-final-form"
import {
  Select,
  FormControl,
  FormErrorMessage,
  FormLabel,
  FormControlProps,
  VisuallyHidden,
  FormHelperText,
} from "@chakra-ui/react"

import { isFieldHasError } from "../../utils/formHelpers"

type SelectGroupProps = FormControlProps & {
  label: string
  isLabelHidden?: boolean
  fieldName: string
  options: Array<string>
  optionLabel?: string
  message?: {
    help?: string
    error?: string
  }
}

const SelectGroup: FunctionComponent<SelectGroupProps> = ({
  fieldName,
  label,
  isLabelHidden,
  options,
  optionLabel,
  message,
  ...rest
}) => {
  return (
    <Field name={fieldName} component="select">
      {({ input, meta }) => (
        <FormControl isInvalid={isFieldHasError(meta)} {...rest}>
          <FormLabel htmlFor={input.name}>{isLabelHidden ? <VisuallyHidden>{label}</VisuallyHidden> : label}</FormLabel>
          <Select id={input.name} {...input}>
            {optionLabel && (
              <option disabled selected value="">
                -- {optionLabel} --
              </option>
            )}
            {options.map((option) => (
              <option value={option} key={option}>
                {option}
              </option>
            ))}
          </Select>
          {message?.help && <FormHelperText>{message.help}</FormHelperText>}
          {message?.error && <FormErrorMessage>{message.error}</FormErrorMessage>}
        </FormControl>
      )}
    </Field>
  )
}

export default SelectGroup
