/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import globalStyles from "../../../utils/globalStyles";

interface Props {
  searchTerm: string;
  setSearchTerm: (searchTerm: string) => void;
}

function FAQSearchBox({ searchTerm, setSearchTerm }: Props) {
  const onChange = (event: any) => setSearchTerm(event.target.value);
  return (
    <input
      css={styles.input}
      type="search"
      value={searchTerm}
      onChange={onChange}
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
    border: `solid ${globalStyles.colors.primary} 1px`,
    width: "100%",
    fontSize: 14,
    fontWeight: "bold",
    color: globalStyles.colors.primary,
    "::placeholder": {
      fontWeight: "normal",
      color: globalStyles.colors.primary
    }
  })
};

export default FAQSearchBox;
