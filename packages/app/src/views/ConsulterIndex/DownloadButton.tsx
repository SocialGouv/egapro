/** @jsx jsx */
import {css, jsx} from "@emotion/core";
import downloadUrl from "./download.png";

const DownloadButton = () => (
  <a href="https://egaproprod.blob.core.windows.net/public/index-egalite-hf.csv" target="_blank" css={styles.downloadButton} download>
    <img css={styles.downloadImage} alt="Télécharger" src={downloadUrl} />
  </a>
);

const styles = {
  downloadButton: css({
    height: "40px",
    width: "40px",
    padding: 0,
    border: "none",
    cursor: "pointer"
  }),
  downloadImage: css({
    height: "40px",
    width: "40px"
  })
};

export default DownloadButton;
