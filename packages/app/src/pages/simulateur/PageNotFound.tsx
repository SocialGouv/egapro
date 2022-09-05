import React from "react"
import { useHistory } from "react-router-dom"

import { useTitle } from "./src/utils/hooks"

import ButtonAction from "./src/components/ds/ButtonAction"
import Page from "./src/components/Page"
import ActionBar from "./src/components/ActionBar"

const PageNotFound = () => {
  useTitle("Page inexistante")
  const history = useHistory()

  return (
    <Page title="Malheureusement la page que vous cherchez n'existe pas !">
      <ActionBar>
        <ButtonAction label="retour" onClick={() => history.goBack()} />
      </ActionBar>
    </Page>
  )
}

export default PageNotFound
