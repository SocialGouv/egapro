/** @jsx jsx */
import { css, jsx} from "@emotion/core";
import { FC } from "react";
import logoUrl from "./LogoIndex.png";

const LogoIndex: FC = () => (
  <div css={styles.logoContainer}>
    <img src={logoUrl} css={styles.logo} alt="Index égalité femme homme"/>
  </div>
);

const styles = {
  logoContainer: css({
    display: "flex",
    justifyContent: "center"
  }),
  logo: css({
    height: "150px",
    width: "150px"
  })
}

export default LogoIndex;
