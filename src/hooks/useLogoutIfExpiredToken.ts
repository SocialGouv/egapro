import { useUser } from "../components/AuthContext"
import { EXPIRED_TOKEN_MESSAGE } from "../utils/fetcher"

export function useLogoutIfExpiredToken(error: Error & { info: string; status: number }) {
  const { logout } = useUser()

  if (error?.info === EXPIRED_TOKEN_MESSAGE) {
    logout()
  }
}
