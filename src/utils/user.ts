type TokenInfo = {
  email: string
  déclarations: string[]
  ownership: string[]
  staff: boolean
}

function getTokenInfo(): TokenInfo | null {
  const tokenInfoString = localStorage.getItem("tokenInfo")

  if (!tokenInfoString) {
    return null
  }

  return JSON.parse(tokenInfoString)
}

export function isUserGrantedForSiren(siren: string) {
  const tokenInfo = getTokenInfo()

  if (tokenInfo?.staff) {
    return true
  }

  const ownership = tokenInfo?.ownership

  if (!ownership?.length) {
    return false
  }

  return ownership.indexOf(siren) !== -1
}
