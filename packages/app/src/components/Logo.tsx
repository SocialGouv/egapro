/** @jsx jsx */
import { css, jsx } from "@emotion/core";

function Logo() {
  return (
    <div css={styles.container}>
      <img
        css={styles.image}
        src={process.env.PUBLIC_URL + "/marianne.png"}
        alt="ministère du travail"
      />
      <span css={styles.text}>ministère du travail</span>
    </div>
  );
}

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column",
    width: 76
  }),
  image: css({
    display: "block",
    width: 76,
    height: 46,
    border: "solid black 1px"
  }),
  text: css({
    marginTop: 3,
    fontSize: 9,
    textAlign: "center"
  })
};

export default Logo;
