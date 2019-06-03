/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import globalStyles from "../../../utils/globalStyles";

function FAQSearchBox() {
  return (
    <input
      css={styles.input}
      type="search"
      placeholder="saisissez un mot clef"
    />
  );
}

const styles = {
  input: css({
    appearance: "none",
    height: 52,
    paddingLeft: 26,
    paddingRight: 26,
    border: `solid ${globalStyles.colors.women} 1px`,
    width: "100%",
    fontSize: 14,
    fontWeight: "bold",
    color: globalStyles.colors.women,
    "::placeholder": {
      fontWeight: "normal",
      color: globalStyles.colors.women
    }
  })
};

export default FAQSearchBox;
