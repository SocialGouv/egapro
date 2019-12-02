/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { ReactNode } from "react";

import ButtonLink from "./ButtonLink";
import TextLink from "./TextLink";

interface Props {
  children: ReactNode;
}

function UserBar() {
  return (
    <div css={styles.userBar}>
      <TextLink
        css={styles.connectLink}
        label="se connecter"
        to="/connection"
      />
      &emsp;
      <ButtonLink label="s'inscrire" to="/inscription" />
    </div>
  );
}

const styles = {
  userBar: css({
    backgroundColor: "#FFF",
    height: 80,
    flexShrink: 0,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "right",
    borderBottom: "1px solid #EFECEF"
  }),
  connectLink: css({
    marginRight: 24
  })
};

export default UserBar;
