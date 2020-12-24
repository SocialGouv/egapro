/** @jsx jsx */
import { css, jsx } from "@emotion/core";

function Logo({ layout = "default" }: { layout?: "default" | "mobile" }) {
  return (
    <div
      css={[styles.container, layout === "mobile" && styles.containerMobile]}
    >
      <img
        css={[styles.image, layout === "mobile" && styles.imageMobile]}
        src={process.env.PUBLIC_URL + "/marianne.png"}
        alt="Ministère du Travail"
      />
      <span css={styles.text}>Ministère du Travail</span>
    </div>
  );
}

const styles = {
  container: css({
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    width: 76
  }),
  containerMobile: css({
    flexDirection: "row",
    alignItems: "flex-end",
    width: "auto"
  }),
  image: css({
    display: "block",
    width: 76,
    height: 46,
    border: "solid black 1px"
  }),
  imageMobile: css({
    width: 60,
    height: 36,
    marginRight: 3
  }),
  text: css({
    marginTop: 3,
    fontSize: 9,
    textAlign: "center"
  })
};

export default Logo;
