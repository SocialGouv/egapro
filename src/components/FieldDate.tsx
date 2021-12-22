import React, { Fragment, FunctionComponent } from "react"
import fr from "date-fns/locale/fr"
import DatePicker, { registerLocale } from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { Box, Flex, Input, FormControl, FormErrorMessage, FormLabel } from "@chakra-ui/react"
import { useField, Field } from "react-final-form"

import { hasFieldError } from "./Input"
import { validateDate } from "../utils/formHelpers"
import { dateToString, parseDate } from "../utils/helpers"

registerLocale("fr", fr)

type FieldDateProps = { name: string; label: string; readOnly: boolean }

const displayMetaErrors = (error: { [key: string]: string }) =>
  error ? (
    <>
      {Object.keys(error)
        .map((key) => error[key])
        .join(", ")}
    </>
  ) : null

const FieldDate: FunctionComponent<FieldDateProps> = ({ name, label, readOnly, children }) => {
  const field = useField(name, { validate: validateDate })
  const error = hasFieldError(field.meta)

  return (
    <FormControl isInvalid={error}>
      <FormLabel htmlFor={field.input.name}>{label}</FormLabel>
      <Field name={name} validate={validateDate}>
        {(props) => (
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
                selected={parseDate(props.input.value)}
                // @ts-ignore
                onChange={(date) => (date ? props.input.onChange(dateToString(date)) : "")}
                readOnly={readOnly}
                name={name}
              />
            </Box>
            {children}
          </Flex>
        )}
      </Field>
      <FormErrorMessage>{displayMetaErrors(field.meta.error)}</FormErrorMessage>
    </FormControl>
  )
}

export default FieldDate
