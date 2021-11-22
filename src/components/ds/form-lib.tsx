import React from "react"
import { FormControl, FormErrorMessage, FormLabel } from "@chakra-ui/form-control"
import { Input } from "@chakra-ui/input"
import { Box } from "@chakra-ui/layout"
import { useField } from "react-final-form"
import { z } from "zod"

type InputControlProps = {
  name: string
  label: string
  type?:
    | "button"
    | "checkbox"
    | "date"
    | "datetime"
    | "email"
    | "hidden"
    | "number"
    | "password"
    | "file"
    | "number"
    | "radio"
    | "reset"
    | "search"
    | "submit"
    | "tel"
    | "text"
    | "time"
    | "url"
  placeholder?: string
}

export const formValidator =
  <T extends z.ZodType<any, any>>(schema: T) =>
  (values: any) => {
    try {
      schema.parse(values)
      return {}
    } catch (err) {
      return (err as z.ZodError).formErrors.fieldErrors
    }
  }

export function InputControl({ name, label, type, placeholder, ...rest }: InputControlProps) {
  const {
    input,
    meta: { error, touched, submitting },
  } = useField(name)

  return (
    <FormControl isInvalid={error && touched} {...rest}>
      <FormLabel htmlFor={name}>{label}</FormLabel>
      <Input {...input} type={type} id={name} name={name} placeholder={placeholder} isDisabled={submitting} />
      <FormErrorMessage>{error}</FormErrorMessage>
    </FormControl>
  )
}

export function DebugForm({ values, show }: { values?: Record<string, any>; show?: boolean } = { show: false }) {
  if (!show) return null

  return (
    <Box as="pre">
      <code>{JSON.stringify(values, null, 2)}</code>
    </Box>
  )
}
