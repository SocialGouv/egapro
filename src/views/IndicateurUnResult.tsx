/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import React from "react";

import { displayPercent } from "../utils/helpers";
import LinkButton from "../components/LinkButton";

interface Props {
  indicateurCalculable: boolean;
  indicateurEcartRemuneration: number | undefined;
  noteIndicateurUn: number | undefined;
}

function IndicateurUnResult({
  indicateurCalculable,
  indicateurEcartRemuneration,
  noteIndicateurUn
}: Props) {
  return (
    <div>
      <div css={styles.bloc}>
        <p css={styles.blocTitle}>
          Indicateur 1 {indicateurCalculable ? "Calculable" : "Non Calculable"}
        </p>

        <div css={styles.message}>
          {indicateurEcartRemuneration !== undefined ? (
            <p>
              indicateur d'écart de rémunération :{" "}
              {indicateurEcartRemuneration.toFixed(1)}%
            </p>
          ) : (
            <p>---</p>
          )}
        </div>

        <div css={styles.message}>
          {noteIndicateurUn !== undefined ? (
            <p>Note : {noteIndicateurUn}</p>
          ) : (
            <p>---</p>
          )}
        </div>

        {/* <LinkButton to="/indicateur1" label="Continuer" /> */}
      </div>
    </div>
  );
}

const styles = {
  bloc: css({
    display: "flex",
    flexDirection: "column",
    maxWidth: 800,
    padding: "12px 24px",
    margin: "24px auto",
    backgroundColor: "white",
    borderRadius: 6,
    boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.12)"
  }),
  blocTitle: css({
    fontSize: 24,
    paddingTop: 6,
    paddingBottom: 24,
    color: "#353535",
    textAlign: "center"
  }),
  message: css({
    fontSize: 26,
    fontWeight: 200,
    textAlign: "center",
    marginBottom: 32,
    marginTop: 12
  })
};

export default IndicateurUnResult;
