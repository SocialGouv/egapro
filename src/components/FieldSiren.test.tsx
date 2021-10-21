jest.mock("../utils/api")
import * as api from "../utils/api"

api.validateSiren.mockImplementation((siren: string) => {
  if (siren === "123456782") {
    // Fake a proper response from the API
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
  return { jsonBody: {} }
})
import { sirenValidator } from "./FieldSiren"

const mockUpdateSirenData = jest.fn(() => undefined)
const validator = sirenValidator(mockUpdateSirenData)

describe("isValidSiren", () => {
  test("returns true for a valid existing siren", async () => {
    await expect(validator("123456782")).resolves.toBe(undefined)
  })

  test("returns an error message for an invalid siren", async () => {
    expect(validator("005720784a")).toBe("ce champ n’est pas valide, renseignez un numéro SIREN de 9 chiffres")
    expect(validator("a")).toBe("ce champ n’est pas valide, renseignez un numéro SIREN de 9 chiffres")
    expect(validator("")).toBe("Ce champ ne peut être vide")
    await expect(validator("000000000")).resolves.toBe(
      "Ce Siren n'existe pas, veuillez vérifier votre saisie, sinon veuillez contacter votre référent de l'égalité professionnelle",
    )
  })
})
