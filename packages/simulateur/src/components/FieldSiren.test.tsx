import { NOT_ALLOWED_MESSAGE, sirenValidatorWithOwner } from "./FieldSiren"

jest.mock("../utils/api", () => ({
  validateSiren: (siren: string) => {
    switch (siren) {
      case "123456782": {
        return Promise.resolve({
          jsonBody: {
            raison_sociale: "foobar",
            code_naf: "70.10Z",
            "r\u00e9gion": "11",
            "d\u00e9partement": "92",
            adresse: "allée des champs",
            commune: "COURBEVOIE",
            code_postal: "92400",
          },
        })
      }
      case "234567891": {
        return Promise.resolve({
          jsonBody: {
            raison_sociale: "barfoo",
            code_naf: "70.10Z",
            "r\u00e9gion": "11",
            "d\u00e9partement": "92",
            adresse: "allée des bois",
            commune: "Vincennes",
            code_postal: "94300",
          },
        })
      }
      default: {
        const error: any = new Error()
        error.response = {
          status: 404,
        }
        return Promise.reject(error)
      }
    }
  },
  ownersForSiren: (siren: string) => {
    switch (siren) {
      case "123456782": {
        return Promise.resolve({
          jsonBody: {
            owners: ["m.leconte@lanormandise.fr", "rh@lanormandise.fr"],
          },
        })
      }
      case "234567891": {
        return Promise.reject(new Error("You have no rights to access this data"))
      }
      default: {
        return { jsonBody: {} }
      }
    }
  },
}))

const validator = sirenValidatorWithOwner(2020)(jest.fn())

let consoleErrorMock: jest.SpyInstance

beforeAll(() => {
  consoleErrorMock = jest.spyOn(console, "error").mockImplementation()
})

afterAll(() => {
  consoleErrorMock.mockRestore()
})

describe("isValidSiren", () => {
  test("returns true for a valid existing siren", async () => {
    await expect(validator("123456782")).resolves.toBe(undefined)
  })

  test("returns an error message for an invalid siren", async () => {
    expect(validator("005720784a")).toBe("Ce champ n'est pas valide, renseignez un numéro Siren de 9 chiffres.")
    expect(validator("a")).toBe("Ce champ n'est pas valide, renseignez un numéro Siren de 9 chiffres.")
    expect(validator("")).toBe("Ce champ ne peut être vide")
    await expect(validator("000000000")).resolves.toBe(
      "Ce Siren n'existe pas, veuillez vérifier votre saisie, sinon veuillez contacter votre référent de l'égalité professionnelle.",
    )
  })

  test("returns an error message for a not allowed user", async () => {
    await expect(validator("234567891")).resolves.toBe(NOT_ALLOWED_MESSAGE)
  })
})
