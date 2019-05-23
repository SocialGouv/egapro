/** @jsx jsx */
import { jsx } from "@emotion/core";
import { RouteComponentProps } from "react-router-dom";

import Page from "../components/Page";

import ActionBar from "../components/ActionBar";
import Button from "../components/Button";

function PageNotFound({ history }: RouteComponentProps) {
  return (
    <Page title="Malheureusement la page que vous cherchez n’existe pas !">
      <ActionBar>
        <div onClick={() => history.goBack()}>
          <Button label="retour" />
        </div>
      </ActionBar>
    </Page>
  );
}

export default PageNotFound;
