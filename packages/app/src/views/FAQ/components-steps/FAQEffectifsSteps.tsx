/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Fragment } from "react";

import {
  IconLamp,
  IconText,
  IconPeople,
  IconCalendar
} from "../../../components/Icons";
import FAQStep from "../components/FAQStep";

function FAQEffectifsSteps() {
  return (
    <Fragment>
      <FAQStep icon={<IconCalendar valid={true} />}>
        Les indicateurs sont calculés à partir des données de la période de
        référence annuelle choissies par l’entreprise.{" "}
        <strong>
          Cette période doit-être de 12 mois consécutifs et doit précéder
          l’année de publication.
        </strong>{" "}
        Elle doit donc nécessairement s’achever au plus tard le 31 décembre 2018
        pour un Index publié en 2019.
      </FAQStep>

      <FAQStep icon={<IconText>CSP</IconText>}>
        Les effectifs sont renseignés par{" "}
        <strong>catégories socio-professionnelles.</strong>
      </FAQStep>

      <FAQStep icon={<IconLamp />}>
        Les caractéristiques individuelles (âge, catégorie de poste) sont
        appréciées au dernier jour de la période de référence ou dernier jour de
        présence du salarié dans l’entreprise.
      </FAQStep>

      <FAQStep icon={<IconPeople valid={false} />}>
        <p>
          <strong>N’est pas pris en compte dans les effectifs :</strong>
        </p>
        <ul css={styles.list}>
          <li>• les apprentis et les contrats de professionnalisation</li>
          <li>• les salariés mis à disposition dont intérimaires</li>
          <li>• les expatriés</li>
          <li>• les salariés en pré-retraite</li>
          <li>
            • les salariés absents plus de 6mois sur la période de référence
            (arrêt maladie, congés sans solde, cdd inférieur à 6 mois etc.).
          </li>
        </ul>
      </FAQStep>
    </Fragment>
  );
}

const styles = {
  list: css({
    padding: 0,
    margin: 0,
    listStyle: "none",
    marginTop: 6
  })
};

export default FAQEffectifsSteps;
