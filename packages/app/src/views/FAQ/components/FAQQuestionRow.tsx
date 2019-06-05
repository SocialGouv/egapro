/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Link } from "react-router-dom";

import globalStyles from "../../../utils/globalStyles";

interface Props {
  part: string;
  index: number;
  question: string;
}

function FAQQuestionRow({ part, index, question }: Props) {
  return (
    <Link
      to={{ state: { faq: `/part/${part}/question/${index}` } }}
      css={styles.link}
    >
      <p css={styles.questionRow}>• {question}</p>
    </Link>
  );
}

const styles = {
  questionRow: css({
    marginBottom: 12,
    fontSize: 14,
    lineHeight: "17px"
  }),
  link: css({
    color: globalStyles.colors.default,
    textDecoration: "none"
  })
};

export default FAQQuestionRow;
