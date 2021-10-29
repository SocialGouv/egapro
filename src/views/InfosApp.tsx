/** @jsx jsx */
import { css, jsx } from "@emotion/core"
import { useHistory } from "react-router"

import Page from "../components/Page"
import config from "../../package.json"

/**
 * App informations and user profile view & management.
 */
function InfosApp() {
  const history = useHistory()

  // TODO: use a hook to manage localStorage
  const tokenInfoLS = localStorage.getItem("tokenInfo")
  const tokenInfo = tokenInfoLS ? JSON.parse(tokenInfoLS) : null
  const version = process.env.REACT_APP_VERSION || config?.version

  function deconnectUser() {
    localStorage.setItem("token", "")
    localStorage.setItem("tokenInfo", "")

    history.go(0)
  }

  return (
    <Page title="Infos application">
      <div css={styles.content}>
        <div style={{ marginBottom: 10 }}>
          <b>Version de l'application</b> : {version}
        </div>

        <div style={{ marginBottom: 20 }}>
          {tokenInfo ? (
            <table>
              <caption style={{ textAlign: "left", marginBottom: 10 }}>Informations sur l'utilisateur</caption>
              <tbody>
                <tr>
                  <th scope="row" style={{ textAlign: "left" }}>
                    <b>Courriel</b>
                  </th>
                  <td>{tokenInfo?.email}</td>
                </tr>
                <tr>
                  <th scope="row" style={{ textAlign: "left" }}>
                    <b>SIREN</b>
                  </th>
                  <td>{tokenInfo?.ownership?.length ? tokenInfo?.ownership.join(", ") : "N/A"}</td>
                </tr>
              </tbody>
            </table>
          ) : (
            "Utilisateur non connecté"
          )}
        </div>
        <div>{tokenInfo && <button onClick={deconnectUser}>Je souhaite me déconnecter</button>}</div>
      </div>
    </Page>
  )
}

const styles = {
  content: css({}),
  title: css({
    fontSize: 18,
    lineHeight: "22px",
    fontWeight: "bold",
    marginTop: 30,
    marginLeft: 0,
    marginRight: 0,
    marginBottom: 20,
  }),
  subtitle: css({
    fontSize: 16,
    lineHeight: "22px",
    fontWeight: "bold",
    marginTop: 20,
    marginLeft: 0,
    marginRight: 0,
    marginBottom: 10,
  }),
}

export default InfosApp
