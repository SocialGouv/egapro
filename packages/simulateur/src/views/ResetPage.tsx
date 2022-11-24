import { useEffect } from "react"
import { RouteComponentProps, useHistory, useLocation } from "react-router-dom"
import { useCheckTokenInURL } from "../components/AuthContext"
import { ActionType, AppState } from "../globals"
import { postSimulation } from "../utils/api"

/**
 * Virtual page, used to reset the state and redirect on a fresh simulation page.
 *
 * It didn't work in adding this logic in Declaration.tsx.
 * Because then, the state will be undefined (what we want) but then the Simulateur.tsx page will be rendered and
 * this page is made to show a spinner when state is falsy.
 *
 * So, in waiting for a better state management and route management, we decided to add this page.
 */
interface ResetPageProps extends RouteComponentProps {
  state: AppState | undefined
  dispatch: (action: ActionType) => void
}

function ResetPage({ dispatch, state }: ResetPageProps): null {
  const history = useHistory()
  const location = useLocation()

  useCheckTokenInURL()

  useEffect(() => {
    dispatch({ type: "resetState" })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- We don't need to subscribe to dispatch changes.
  }, [])

  useEffect(() => {
    if (state === undefined) {
      postSimulation({})
        .then(({ jsonBody: { id } }) => {
          history.push(`/simulateur/${id}`, location.state ? location.state : {})
        })
        .catch((error) => {
          const errorMessage = (error.jsonBody && error.jsonBody.message) || "Erreur lors de la récupération du code"
          console.error(errorMessage)
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- We don't need to subscribe to history and location.state changes.
  }, [state])

  return null
}

export default ResetPage
