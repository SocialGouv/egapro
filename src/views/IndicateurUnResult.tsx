/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import globalStyles from "../utils/globalStyles";

import Action from "../components/Action";

interface Props {
  indicateurEcartRemuneration: number | undefined;
  noteIndicateurUn: number | undefined;
  validateIndicateurUn: (valid: boolean) => void;
}

function IndicateurUnResult({
  indicateurEcartRemuneration,
  noteIndicateurUn,
  validateIndicateurUn
}: Props) {
  const absoluteResult =
    indicateurEcartRemuneration !== undefined
      ? Math.abs(indicateurEcartRemuneration)
      : undefined;
  const genderFavoriteResult =
    indicateurEcartRemuneration !== undefined
      ? Math.sign(indicateurEcartRemuneration) < 0
        ? "femmes"
        : "hommes"
      : undefined;
  return (
    <div>
      <div css={styles.container}>
        <div css={styles.bloc}>
          <div>
            <p css={styles.message}>
              <span css={styles.messageLabel}>votre résultat final est </span>
              <span css={styles.messageData}>
                {absoluteResult !== undefined
                  ? absoluteResult.toFixed(1)
                  : "--"}{" "}
                %
              </span>
            </p>
            {genderFavoriteResult && (
              <p css={styles.info}>
                écart favorable aux {genderFavoriteResult}
              </p>
            )}
          </div>

          <div>
            <p css={styles.message}>
              <span css={styles.messageLabel}>votre note obtenue est </span>
              <span css={styles.messageData}>
                {noteIndicateurUn !== undefined ? noteIndicateurUn : "--"}
                /40
              </span>
            </p>
            <p css={styles.info}>mesures de correction prises en compte</p>
          </div>
        </div>
      </div>

      <p css={styles.edit}>
        <Action onClick={() => validateIndicateurUn(false)}>
          modifier les données saisies
        </Action>
      </p>
    </div>
  );
}

const styles = {
  container: css({
    marginTop: 64,
    width: "100%",
    position: "relative",
    height: 0,
    paddingTop: "100%"
  }),
  bloc: css({
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,

    padding: "26% 8%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",

    color: "white",
    backgroundColor: globalStyles.colors.default,
    borderRadius: "100%"
  }),
  message: css({
    marginBottom: 9,
    display: "flex",
    alignItems: "baseline",

    fontSize: 14,
    lineHeight: "17px"
  }),
  messageLabel: css({
    marginRight: "auto"
  }),
  messageData: css({
    fontWeight: "bold"
  }),
  info: css({
    fontSize: 12,
    fontStyle: "italic",
    lineHeight: "15px",

    borderBottom: "1px solid #FFFFFF"
  }),

  edit: css({
    marginTop: 14,
    textAlign: "center"
  })
};

export default IndicateurUnResult;
