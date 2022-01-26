import React, { FunctionComponent } from "react"
import fr from "date-fns/locale/fr"
import DatePicker, { registerLocale } from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { Box, Flex, Input, FormControl, FormErrorMessage, FormLabel } from "@chakra-ui/react"
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
        <FormControl isInvalid={isFieldHasError(meta)} isReadOnly={isReadOnly} {...rest}>
          <FormLabel htmlFor={input.name}>{label}</FormLabel>
          <Flex align="center">
            <Box
              flexGrow={1}
              sx={{
                ".react-datepicker-wrapper": {
                  display: "block",
                  width: "100%",
                },
              }}
            >
              <Input
                as={DatePicker}
                locale="fr"
                dateFormat="dd/MM/yyyy"
                selected={parseDate(input.value)}
                // @ts-ignore
                onChange={(date) => (date ? input.onChange(dateToString(date)) : "")}
              />
            </Box>
            {children}
          </Flex>
          <FormErrorMessage>{displayMetaErrors(meta.error)}</FormErrorMessage>
        </FormControl>
      )}
    </Field>
  )
}

export default InputDateGroup
