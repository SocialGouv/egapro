import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/extend-expect"

import userEvent from "@testing-library/user-event"

import AskEmail from "./AskEmail"
import * as mockApi from "../utils/api"

test("AskEmail should not accept empty email", () => {
  render(<AskEmail />)
  expect(screen.getByLabelText(/Email/i)).toHaveValue("")
  fireEvent.submit(screen.getByRole("button", { name: "Envoyer" }))
  expect(screen.getByText("L'adresse mail est requise")).toBeInTheDocument()
})

test("AskEmail should not invalid email", () => {
  render(<AskEmail />)
  userEvent.type(screen.getByLabelText(/Email/i), "invalid")
  expect(screen.getByLabelText(/Email/i)).toHaveValue("invalid")
  fireEvent.submit(screen.getByRole("button", { name: "Envoyer" }))
  expect(screen.getByText("L'adresse mail est invalide")).toBeInTheDocument()
})

test("AskEmail should accept valid email", async () => {
  jest.spyOn(mockApi, "sendValidationEmail")
  ;(mockApi.sendValidationEmail as jest.Mock).mockImplementation(() => Promise.resolve())

  render(<AskEmail />)
  userEvent.type(screen.getByLabelText(/Email/i), "john@maclane.us")
  expect(screen.getByLabelText(/Email/i)).toHaveValue("john@maclane.us")
  fireEvent.submit(screen.getByRole("button", { name: "Envoyer" }))

  await screen.findByText(
    /Vous allez recevoir un mail sur l'adresse email que vous avez indiquée à l'étape précédente/i,
  )
  await screen.findByRole("button", { name: "Modifier l'email" })
})
