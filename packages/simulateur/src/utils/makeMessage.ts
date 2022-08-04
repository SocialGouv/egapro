import { EXPIRED_TOKEN_MESSAGE } from "./fetcher"
import { AlertMessageType } from "../globals"
import type { FetchError } from "./fetcher"

function makeMessage(kind: AlertMessageType["kind"]) {
  return function (text: string): AlertMessageType {
    return { kind, text }
  }
}

/**
 * Build a success message to display in a Toast
 *
 * @param text Text to display in the alert
 * @returns AlertMessageType
 */
export function sucessMessage(text: string): AlertMessageType {
  return makeMessage("success")(text)
}

/**
 * Build an error message to display in a Toast
 *
 * @param text Text to display in the alert
 * @returns AlertMessageType
 */
export function errorMessage(text: string): AlertMessageType {
  return makeMessage("error")(text)
}

// Helper to have generic messages for app.
export function genericErrorMessage(error: FetchError): AlertMessageType | null {
  if (!error) return null

  switch (error?.status) {
    case 404: {
      return errorMessage("Aucun résultat trouvé.")
    }
    case 500: {
      return errorMessage("Une erreur est survenue lors de la récupération des données.")
    }
    case 403: {
      if (error?.info === EXPIRED_TOKEN_MESSAGE) {
        return errorMessage("Votre session a expiré, veuillez vous reconnecter.")
      }
      return errorMessage("Problème de droits d'accès.")
    }
    default: {
      return errorMessage("Une erreur imprévue est survenue lors de la récupération des données.")
    }
  }
}
