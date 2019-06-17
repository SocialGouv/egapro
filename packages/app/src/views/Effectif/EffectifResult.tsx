/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import { FormState } from "../../globals.d";

import globalStyles from "../../utils/globalStyles";

import Bubble from "../../components/Bubble";
import ActionLink from "../../components/ActionLink";

interface Props {
  totalNbSalarieHomme: number;
  totalNbSalarieFemme: number;
  validateEffectif: (valid: FormState) => void;
}

function EffectifResult({
  totalNbSalarieHomme,
  totalNbSalarieFemme,
  validateEffectif
}: Props) {
  return (
    <div css={styles.container}>
      <Bubble style={styles.bubble}>
        <div css={styles.blocNumbers}>
          <p css={styles.message}>
            <span css={styles.messageLabel}>Nombre de femmes</span>
            <span css={styles.messageData}>{totalNbSalarieFemme}</span>
          </p>
          <p css={styles.message}>
            <span css={styles.messageLabel}>Nombre d’hommes</span>
            <span css={styles.messageData}>{totalNbSalarieHomme}</span>
          </p>
        </div>
        <p css={styles.message}>
          <span css={styles.messageLabel}>Total effectifs</span>
          <span css={styles.messageData}>
            {totalNbSalarieFemme + totalNbSalarieHomme}
          </span>
        </p>
      </Bubble>

      <p css={styles.edit}>
        <ActionLink onClick={() => validateEffectif("None")}>
          modifier les données saisies
        </ActionLink>
      </p>
    </div>
  );
}

const styles = {
  container: css({
    maxWidth: 250,
    marginTop: 64
  }),
  edit: css({
    marginTop: 14,
    textAlign: "center"
  }),

  bubble: css({
    backgroundColor: "white",
    color: globalStyles.colors.default,
    border: "solid #EFECEF 1px",
    "@media print": {
      backgroundColor: "white",
      color: globalStyles.colors.default,
      border: "solid #EFECEF 1px"
    }
  }),

  blocNumbers: css({
    height: 50,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between"
  }),

  message: css({
    marginBottom: 2,
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
  })
};

export default EffectifResult;
