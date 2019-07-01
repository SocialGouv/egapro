/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import globalStyles from "../utils/globalStyles";

import MobileHome from "../views/MobileHome";
import FAQ from "../views/FAQ";

function MobileLayout() {
  const openMenu = () => {
    console.log("openMenu");
  };
  return (
    <div css={styles.mobileLayout}>
      <div css={styles.scroll}>
        <MobileHome openMenu={openMenu} />
      </div>
      {/*<FAQ />*/}
    </div>
  );
}

const styles = {
  mobileLayout: css({
    overflow: "hidden",
    position: "fixed",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,

    display: "flex",
    flexDirection: "column",

    /* *** /!\ *** */
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: globalStyles.grid.maxWidth - 375,
    minWidth: 0,
    /*
      Fix issue with IE11
      the intention would be something like:

      flexGrow: 1,
      flexShrink: 1,
      flexBasis: "auto",
      maxWidth: globalStyles.grid.maxWidth - 375,

      but the code above is a workaround described here:
      https://github.com/philipwalton/flexbugs#flexbug-17
    */

    background:
      "linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, #FFFFFF 100%), #EFF0FA",

    "@media print": {
      display: "block"
    }
  }),
  scroll: css({
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "0%",
    position: "relative"
  })
};

export default MobileLayout;
