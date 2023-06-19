import * as React from "react"
import { z } from "zod"
import { EMAIL_REGEX } from "../../utils/regex"

import { fieldValidator, InputControl, InputControlProps } from "./form-lib"

type FieldEmailProps = Partial<InputControlProps>

const FieldInput = z
  .string({ required_error: "L'adresse mail est requise" })
  .min(1, { message: "L'adresse mail est requise" })
  .regex(EMAIL_REGEX, { message: "L'adresse mail est invalide" })

export function FieldEmail({ ...rest }: FieldEmailProps) {
  return (
    <InputControl
      name="email"
      label="Email"
      placeholder="Email"
      rafConfig={{
        parse: (email: string) => email && email.trim().toLowerCase(),
        validate: fieldValidator(FieldInput),
        ...rest?.rafConfig,
      }}
      {...rest}
      type="text"
    />
  )
}
