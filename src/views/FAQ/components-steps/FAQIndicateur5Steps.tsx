/** @jsx jsx */
import { jsx } from "@emotion/core"
import { Fragment } from "react"

import { IconMoney } from "../../../components/Icons"
import FAQStep from "../components/FAQStep"

function FAQIndicateur5Steps() {
  return (
    <Fragment>
      <FAQStep icon={<IconMoney valid={true} />}>
        Renseignez le nombre de femmes et d'hommes parmi les dix plus hautes rémunérations de l’entreprise.
      </FAQStep>
    </Fragment>
  )
}

export default FAQIndicateur5Steps
