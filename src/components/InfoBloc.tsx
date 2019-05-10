/** @jsx jsx */
import { css, jsx } from "@emotion/core";

interface Props {
  title: string;
  text: string;
}

function InfoBloc({ title, text }: Props) {
  return (
    <div css={styles.bloc}>
      <p css={styles.blocTitle}>{title}</p>
      <p css={styles.blocText}>{text}</p>
    </div>
  );
}

const styles = {
  bloc: css({
    padding: 16,
    backgroundColor: "#FFF",
    border: "1px solid #EFECEF"
  }),
  blocTitle: css({
    fontSize: 18,
    lineHeight: "22px",
    textTransform: "uppercase"
  }),
  blocText: css({
    marginTop: 4,
    fontSize: 14,
    lineHeight: "17px"
  })
};

export default InfoBloc;
