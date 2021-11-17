let API_URL = "/api"
if (window.location.href.includes("localhost:")) {
  API_URL = "http://127.0.0.1:2626"
}

export const fetcher = async (endpoint: string, options: RequestInit) => {
  options = {
    ...options,
    headers: {
      ...options?.headers,
      "API-KEY": localStorage.token,
    },
  }

  const response = await fetch(API_URL + endpoint, options)

  if (!response.ok) {
    const { error: message } = await response.json()

    throw new Error(message || "Erreur serveur")
  }

  return response.json()
}

export default fetcher
