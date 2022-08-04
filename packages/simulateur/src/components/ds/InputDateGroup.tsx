import React, { FunctionComponent } from "react"
import fr from "date-fns/locale/fr"
import DatePicker, { registerLocale } from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { Input, FormControl, FormErrorMessage, FormLabel, Stack } from "@chakra-ui/react"
import { Field } from "react-final-form"

import { isFieldHasError, validateDate } from "../../utils/formHelpers"
import { dateToString, parseDate } from "../../utils/date"
import { displayMetaErrors } from "../../utils/form-error-helpers"

registerLocale("fr", fr)

interface InputDateGroupProps {
  label: string
  fieldName: string
  isReadOnly: boolean
  autovalidation?: boolean // If true, the field will be validated via default validators. If no, you can use your own validator (see ObjectifsMesuresPage.tsx).
}

const InputDateGroup: FunctionComponent<InputDateGroupProps> = ({
  label,
  fieldName,
  isReadOnly,
  children,
  autovalidation = true,
  ...rest
}) => {
  return (
    <Field name={fieldName} {...(autovalidation && { validate: validateDate })} component="input">
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
              onChange={(date) => {
                // @ts-ignore
                if (date) input.onChange(dateToString(date))
              }}
              // required to see the input as touched and trigger the validation if Final form is set as validateOnBlur.
              onCalendarClose={() => input.onBlur()}
              {...((isFieldHasError(meta) || (meta.error && meta.touched)) && { borderColor: "#E53E3E" })}
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
