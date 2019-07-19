/** @jsx jsx */
import { css, jsx } from "@emotion/core";

interface Props {
  listTitle: string;
  list: Array<string>;
  scaleTitle: string;
  scale: Array<string>;
}

function FAQCalculScale({ listTitle, list, scaleTitle, scale }: Props) {
  return (
    <div css={styles.container}>
      <div css={styles.leftColumn}>
        <span css={[styles.text, styles.title]}>{listTitle}</span>
        {list.map(listEl => (
          <span css={styles.text}>• {listEl}</span>
        ))}
      </div>
      <div css={styles.rightColumn}>
        <span css={[styles.text, styles.title]}>{scaleTitle}</span>
        {scale.map(scaleEl => (
          <span css={styles.text}>{scaleEl}</span>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: css({
    display: "flex",
    marginBottom: 12,
    padding: "13px 25px",
    backgroundColor: "#F9F7F9",
    borderRadius: 5
  }),
  leftColumn: css({
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "auto",
    display: "flex",
    flexDirection: "column"
  }),
  rightColumn: css({
    marginLeft: 6,
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "auto",
    display: "flex",
    flexDirection: "column"
  }),
  text: css({
    fontSize: 14,
    lineHeight: "17px"
  }),
  title: css({
    marginBottom: 8,
    fontWeight: "bold"
  })
};

export default FAQCalculScale;
