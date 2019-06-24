/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import globalStyles from "../../../utils/globalStyles";

import { IconSearch, IconClose } from "../../../components/Icons";

interface Props {
  searchTerm: string;
  setSearchTerm: (searchTerm: string) => void;
}

function FAQSearchBox({ searchTerm, setSearchTerm }: Props) {
  const onChange = (event: any) => setSearchTerm(event.target.value);
  return (
    <div css={styles.container}>
      {searchTerm !== "" ? (
        <div
          css={[styles.icon, styles.iconEnabled]}
          onClick={() => setSearchTerm("")}
        >
          <IconClose />
        </div>
      ) : (
        <div css={[styles.icon, styles.iconDisabled]}>
          <IconSearch />
        </div>
      )}

      <input
        css={styles.input}
        type="search"
        value={searchTerm}
        onChange={onChange}
        placeholder="Cherchez par mot clef"
      />
    </div>
  );
}

const styles = {
  container: css({
    position: "relative"
  }),
  input: css({
    appearance: "none",
    height: 52,
    paddingLeft: 52,
    paddingRight: 26,
    border: `solid ${globalStyles.colors.primary} 1px`,
    width: "100%",
    fontSize: 14,
    fontWeight: "bold",
    color: globalStyles.colors.primary,
    "::placeholder": {
      fontWeight: "normal",
      color: globalStyles.colors.primary
    },
    "::-webkit-search-cancel-button": {
      WebkitAppearance: "none"
    }
  }),
  icon: css({
    height: 52,
    width: 52,
    position: "absolute",
    top: 0,
    left: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  }),
  iconEnabled: css({
    cursor: "pointer"
  }),
  iconDisabled: css({
    pointerEvents: "none"
  })
};

export default FAQSearchBox;
