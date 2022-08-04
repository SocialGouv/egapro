// Build an URLSearchParams from an object.
export function buildUrlParams(params: Record<string, string | string[]> = {}): URLSearchParams {
  var searchParams = new URLSearchParams()

  const entries = Object.entries(params)

  for (const [key, value] of entries) {
    if (Array.isArray(value)) {
      for (const element of value) {
        if (value) searchParams.append(key, element)
      }
    } else {
      if (value) searchParams.set(key, value)
    }
  }

  return searchParams
}

export function buildUrlParamsString(params: Record<string, string | string[]> = {}): string {
  return buildUrlParams(params).toString()
}
