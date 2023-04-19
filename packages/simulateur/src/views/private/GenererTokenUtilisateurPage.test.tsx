import React from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/extend-expect"
import { BrowserRouter } from "react-router-dom"
import userEvent from "@testing-library/user-event"

import GenererTokenUtilisateurPage from "./GenererTokenUtilisateurPage"
import * as mockContext from "../../components/AuthContext"
import * as mockApi from "../../utils/api"

beforeAll(() => {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })
})

afterAll(() => {
  jest.restoreAllMocks()
})

test("Generer token page is only for staff member", () => {
  render(
    <BrowserRouter>
      <GenererTokenUtilisateurPage />
    </BrowserRouter>,
  )

  expect(screen.getByText("Vous n'êtes pas membre du staff.")).toBeInTheDocument()
})

test("Generer token page should not accept empty email", async () => {
  // @ts-ignore -- We only care of staff property for this test.
  jest.spyOn(mockContext, "useUser").mockReturnValue({ staff: true })

  render(
    <BrowserRouter>
      <GenererTokenUtilisateurPage />
    </BrowserRouter>,
  )
  expect(screen.getByLabelText(/Email/i)).toHaveValue("")
  fireEvent.submit(screen.getByRole("button", { name: /générer/i }))
  await screen.findByText(/L'email est incorrect/i)
})

test("Generer token page should be ok with a valid email", async () => {
  // @ts-ignore -- We only care of staff property for this test.
  jest.spyOn(mockContext, "useUser").mockReturnValue({ staff: true })

  jest.spyOn(mockApi, "generateImpersonateToken").mockReturnValue(Promise.resolve({ token: "token-123456789" }))

  render(
    <BrowserRouter>
      <GenererTokenUtilisateurPage />
    </BrowserRouter>,
  )
  await act(async () => {
    await userEvent.type(screen.getByLabelText(/email/i), "john@maclane.com")
  })
  fireEvent.submit(screen.getByRole("button", { name: /générer/i }))
  await screen.findByText(/Lien d'authentification vers le simulateur/i)
  await screen.findByText(/Lien d'authentification vers la déclaration/i)
})
