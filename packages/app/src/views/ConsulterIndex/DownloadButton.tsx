/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import downloadUrl from "./download.png";
import { CSV_DOWNLOAD_URL } from "./env";

const DownloadButton = () => (
  <a
    href={CSV_DOWNLOAD_URL}
    rel="noopener noreferrer"
    target="_blank"
    css={styles.downloadButton}
    download
  >
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
