import React from "react"
import { FormControl, FormErrorMessage, FormLabel } from "@chakra-ui/form-control"
import { Input, InputProps } from "@chakra-ui/input"
import { Box } from "@chakra-ui/layout"
import { useField, UseFieldConfig } from "react-final-form"
import { z } from "zod"

export type InputControlProps = {
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
  variant?: InputProps["variant"]
  rafConfig?: UseFieldConfig<string, string> // Field config in Final Form
}

export const formValidator =
  <T extends z.ZodType<any, any>>(schema: T) =>
  (values: any) => {
    try {
      schema.parse(values)
    } catch (err) {
      return (err as z.ZodError).flatten().fieldErrors
    }
  }

export const fieldValidator =
  <T extends z.ZodType<any, any>>(schema: T) =>
  (value: any) => {
    try {
      schema.parse(value)
    } catch (err) {
      const zodError = (err as z.ZodError).issues

      const res = zodError.map((current) => current.message)
      // Return the first error message.
      return res?.length ? res[0] : undefined
    }
  }

export function InputControl({
  name,
  label,
  type,
  placeholder,
  variant = "outline",
  rafConfig,
  ...rest
}: InputControlProps) {
  const { input, meta } = useField(name, rafConfig)

  const { error, touched, submitting } = meta

  return (
    <FormControl isInvalid={error && touched} {...rest}>
      <FormLabel htmlFor={name}>{label}</FormLabel>
      <Input
        {...input}
        variant={variant}
        type={type}
        id={name}
        name={name}
        placeholder={placeholder}
        isDisabled={submitting}
      />
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

/*
 * To debug a field in React Final Form, try <FormLabel htmlFor={name} {...debugTitle({ input, meta })}>
 */
export function debugTitle({ input, meta }: any) {
  return { title: JSON.stringify({ input, meta }, null, 2) }
}
