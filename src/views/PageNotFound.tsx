/** @jsx jsx */
import { jsx } from "@emotion/core"
import { RouteComponentProps } from "react-router-dom"

import Page from "../components/Page"

import ActionBar from "../components/ActionBar"
import ButtonAction from "../components/ButtonAction"
import { useTitle } from "../utils/hooks"

function PageNotFound({ history }: RouteComponentProps) {
  useTitle("Page inexistante")

  return (
    <Page title="Malheureusement la page que vous cherchez n’existe pas !">
      <ActionBar>
        <ButtonAction label="retour" onClick={() => history.goBack()} />
      </ActionBar>
    </Page>
  )
}

export default PageNotFound
