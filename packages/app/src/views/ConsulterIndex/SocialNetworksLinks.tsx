/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import facebookImage from "./RESEAU-Facebook.png";
import linkedinImage from "./RESEAU-in.png";
import tweeterImage from "./RESEAU-Tweeter.png";

const SocialNetworksLinks = () => (
  <div css={styles.iconsContainer}>
    <a target="_blank" rel="noopener noreferrer" href="https://www.facebook.com/MinTravail/"><img alt="facebook" src={facebookImage} /></a>&nbsp;
    <a target="_blank" rel="noopener noreferrer" href="https://www.linkedin.com/company/1032700/admin/"><img alt="linkedin" src={linkedinImage}/></a>&nbsp;
    <a target="_blank" rel="noopener noreferrer" href="https://twitter.com/Minist_Travail"><img alt="twitter" src={tweeterImage} /></a>
  </div>
);

const styles = {
  iconsContainer: css({
    display: "flex"
  })
};

export default SocialNetworksLinks;
