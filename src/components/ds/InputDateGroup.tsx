import React, { FunctionComponent } from "react"
import fr from "date-fns/locale/fr"
import DatePicker, { registerLocale } from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { Input, FormControl, FormErrorMessage, FormLabel, Stack } from "@chakra-ui/react"
import { Field } from "react-final-form"

import { isFieldHasError, validateDate } from "../../utils/formHelpers"
import { dateToString, parseDate } from "../../utils/helpers"

registerLocale("fr", fr)

interface InputDateGroupProps {
  label: string
  fieldName: string
  isReadOnly: boolean
}

const displayMetaErrors = (error: { [key: string]: string }) =>
  error ? (
    <>
      {Object.keys(error)
        .map((key) => error[key])
        .join(", ")}
    </>
  ) : null

const InputDateGroup: FunctionComponent<InputDateGroupProps> = ({
  label,
  fieldName,
  isReadOnly,
  children,
  ...rest
}) => {
  return (
    <Field name={fieldName} validate={validateDate} component="input">
      {({ input, meta }) => (
        <FormControl
          isInvalid={isFieldHasError(meta) || (meta.error && meta.touched)}
          isReadOnly={isReadOnly}
          {...rest}
        >
          <FormLabel htmlFor={input.name}>{label}</FormLabel>
          <Stack direction={["column", "row"]}>
            <Input
              as={DatePicker}
              locale="fr"
              dateFormat="dd/MM/yyyy"
              selected={parseDate(input.value)}
              // @ts-ignore
              onChange={(date) => (date ? input.onChange(dateToString(date)) : "")}
            />
            {children}
          </Stack>
          <FormErrorMessage>{displayMetaErrors(meta.error)}</FormErrorMessage>
        </FormControl>
      )}
    </Field>
  )
}

export default InputDateGroup
