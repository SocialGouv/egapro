import { ownersForSiren } from "./api"

/**
 * A SIREN is free if it has no owners already bound to it.
 */
export async function sirenIsFree(siren: string) {
  let isFree = true

  try {
    const { jsonBody } = await ownersForSiren(siren)
    isFree = jsonBody?.owners.length === 0
  } catch (_ignoreError) {
    // the API is designed to return an error if the user is not granted for the siren. This is what we want to ensure.
    isFree = false
  }

  return isFree
}
