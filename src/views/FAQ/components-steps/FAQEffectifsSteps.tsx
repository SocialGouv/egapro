/** @jsx jsx */
import { css, jsx } from "@emotion/core"
import { Fragment } from "react"

import { IconLamp, IconText, IconPeople } from "../../../components/Icons"
import FAQStep from "../components/FAQStep"

function FAQEffectifsSteps() {
  return (
    <Fragment>
      <FAQStep icon={<IconText>CSP</IconText>}>
        L’effectif de l’entreprise est apprécié en effectif physique sur la période de référence. Il doit être renseigné
        par <strong>catégories socio-professionnelles.</strong>
      </FAQStep>

      <FAQStep icon={<IconLamp />}>
        Les caractéristiques individuelles (âge, catégorie de poste) sont appréciées au dernier jour de la période de
        référence ou dernier jour de présence du salarié dans l’entreprise.
      </FAQStep>

      <FAQStep icon={<IconPeople valid={false} />}>
        <p>
          <strong>Ne sont pas pris en compte dans les effectifs :</strong>
        </p>
        <ul css={styles.list}>
          <li>• les apprentis et les contrats de professionnalisation</li>
          <li>
            • les salariés mis à la disposition de l'entreprise par une entreprise extérieure (dont les intérimaires)
          </li>
          <li>• les expatriés</li>
          <li>• les salariés en pré-retraite</li>
          <li>
            • les salariés absents plus de 6 mois sur la période de référence (arrêt maladie, congés sans solde, cdd
            &lt;6mois etc.).
          </li>
        </ul>
      </FAQStep>
    </Fragment>
  )
}

const styles = {
  list: css({
    padding: 0,
    margin: 0,
    listStyle: "none",
    marginTop: 6,
  }),
}

export default FAQEffectifsSteps
