/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Fragment } from "react";

import { IconLamp } from "../../../components/Icons";
import FAQStep from "../components/FAQStep";

function FAQResultatSteps() {
  return (
    <Fragment>
      <FAQStep icon={<IconLamp />}>
        Toutes les informations nécessaires à la déclaration sur SOLEN se
        trouvent sur ce récapitulatif
      </FAQStep>
      <FAQStep icon={<IconLamp />}>
        Par la suite la note globale doit-être publiée sur le site internet de
        la société déclarante ou à minima communiquée aux salariés ainsi qu’au
        CSE
      </FAQStep>
      <FAQStep icon={<IconLamp />}>
        <p css={styles.para}>
          Si l’entreprise obtient moins de 75points, elle devra mettre en oeuvre
          des mesures de corrections lui permettant d’atteindre au moins 75
          points d’ici 3 ans.
        </p>
        <p css={styles.para}>
          Les mesures prises pourront-être annulles ou pluriannuelles et seront
          définies :
        </p>
        <ul css={styles.list}>
          <li>
            • dans le cadre de la négociation relative à l’égalité
            professionnelles
          </li>
          <li>
            • ou à défaut d’accord, par décision unilatérale de l’employeur et
            après consultation du comité social et économique. Cette décision
            devra être déposée auprès des services de la Direccte. Elle pourra
            être intégrée au plan d’action devant être établi à défaut d’accords
            relatif à l’égalité professionnelle.
          </li>
        </ul>
      </FAQStep>
    </Fragment>
  );
}

const styles = {
  para: css({
    marginBottom: 6
  }),
  list: css({
    padding: 0,
    margin: 0,
    listStyle: "none"
  })
};

export default FAQResultatSteps;
