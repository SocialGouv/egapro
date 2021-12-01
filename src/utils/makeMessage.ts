import { EXPIRED_TOKEN_MESSAGE } from "../utils/fetcher"
import { AlertMessageType } from "../globals"

export function makeMessage(error: Error & { info: string; status: number }): AlertMessageType {
  return !error
    ? null
    : error?.info === EXPIRED_TOKEN_MESSAGE
    ? {
        kind: "error",
        text: "Votre session a expiré, veuillez vous reconnecter.",
      }
    : { kind: "error", text: "Une erreur est survenue lors de la récupération des données." }
}
