import React from "react"
import { RouteComponentProps, useHistory, useLocation } from "react-router-dom"
import { ActionType, AppState } from "../globals"
import { postIndicatorsDatas } from "../utils/api"

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

function ResetPage({ dispatch, state }: ResetPageProps) {
  const history = useHistory()
  const location = useLocation()

  React.useEffect(() => {
    dispatch({ type: "resetState" })
  }, [])

  React.useEffect(() => {
    if (state === undefined) {
      postIndicatorsDatas({})
        .then(({ jsonBody: { id } }) => {
          history.push(`/simulateur/${id}`, {
            ...(location.state && location.state),
          })
        })
        .catch((error) => {
          const errorMessage = (error.jsonBody && error.jsonBody.message) || "Erreur lors de la récupération du code"
          console.error(errorMessage)
        })
    }
  }, [postIndicatorsDatas, state])

  return null
}

export default ResetPage
