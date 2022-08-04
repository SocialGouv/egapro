import { AlertMessageType } from "../globals"

export type FetcherReturn = {
  message: AlertMessageType | null
  isLoading: boolean
  isError: boolean
  mutate: (data: any) => void
  error: any
}
