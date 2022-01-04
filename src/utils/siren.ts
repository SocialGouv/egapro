import { ownersForSiren } from "./api"

/**
 * A SIREN is free if it has no owners already bound to it.
 */
export async function sirenIsFree(siren: string) {
  let isFree = true

  try {
    const { jsonBody } = await ownersForSiren(siren)
    console.log("jsonBody", jsonBody)
    isFree = jsonBody?.owners.length === 0
  } catch (ignore) {
    // the API is designed to return an error if the user is not granted for the siren. This is what we want to ensure.
    isFree = false
  }
  console.log("isFree", siren, isFree)

  return isFree
}
