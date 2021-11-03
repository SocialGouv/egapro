/** @jsx jsx */
import { css, jsx } from "@emotion/core"
import { Fragment } from "react"

import { IconLamp } from "../../../components/Icons"
import FAQStep from "../components/FAQStep"

function FAQResultatSteps() {
  return (
    <Fragment>
      <FAQStep icon={<IconLamp />}>
        Les entreprises doivent transmettre leurs résultats au Ministère du Travail via le{" "}
        <a
          href="https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle-discrimination-et-harcelement/indexegapro"
          target="_blank"
          rel="noopener noreferrer"
        >
          formulaire en ligne
        </a>
        . Toutes les informations nécessaires à la transmission se trouvent sur ce récapitulatif.
      </FAQStep>
      <FAQStep icon={<IconLamp />}>
        L'index doit être publié sur le site internet de l'entreprise déclarante ou en l'absence de site internet,
        communiqué aux salariés. Les résultats doivent par ailleurs être communiqués au CSE.
      </FAQStep>
      <FAQStep icon={<IconLamp />}>
        <p css={styles.para}>
          Si l’entreprise obtient moins de 75 points, elle devra mettre en oeuvre des mesures de correction lui
          permettant d’atteindre au moins 75 points dans un délai 3 ans.
        </p>
        <p css={styles.para}>Les mesures prises seront définies :</p>
        <ul css={styles.list}>
          <li>• dans le cadre de la négociation relative à l’égalité professionnelle</li>
          <li>
            • ou à défaut d’accord, par décision unilatérale de l’employeur et après consultation du comité social et
            économique. Cette décision devra être déposée auprès des services de la Direccte. Elle pourra être intégrée
            au plan d’action devant être établi à défaut d’accord relatif à l’égalité professionnelle.
          </li>
        </ul>
      </FAQStep>
    </Fragment>
  )
}

const styles = {
  para: css({
    marginBottom: 6,
  }),
  list: css({
    padding: 0,
    margin: 0,
    listStyle: "none",
  }),
}

export default FAQResultatSteps
