/** @jsx jsx */
import { jsx } from "@emotion/core"

import { SinglePageLayout } from "../../containers/SinglePageLayout"
import { useTitle } from "../../utils/hooks"
import Page from "../../components/Page"

const title = "Mes entreprises"

function MesEntreprises() {
  useTitle(title)

  return (
    <SinglePageLayout>
      <Page title={title}>
        <h1>{title}</h1>
      </Page>
    </SinglePageLayout>
  )
}

// const styles = {
//   content: css({}),
//   title: css({
//     fontSize: 18,
//     lineHeight: "22px",
//     fontWeight: "bold",
//     marginTop: 30,
//     marginLeft: 0,
//     marginRight: 0,
//     marginBottom: 20,
//   }),
//   subtitle: css({
//     fontSize: 16,
//     lineHeight: "22px",
//     fontWeight: "bold",
//     marginTop: 20,
//     marginLeft: 0,
//     marginRight: 0,
//     marginBottom: 10,
//   }),
// }

export default MesEntreprises
