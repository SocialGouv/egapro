import React from "react"
import { RouteComponentProps, useHistory, useLocation } from "react-router-dom"
import { ActionType, AppState } from "../globals"
import { postIndicatorsDatas } from "../utils/api"

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
    console.log("state", state)

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
