/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { ReactNode } from "react";

import globalStyles from "../utils/globalStyles";

function FAQHeader() {
  return (
    <div css={stylesHeader.container}>
      <span css={stylesHeader.title}>Aide</span>
    </div>
  );
}

const stylesHeader = {
  container: css({
    height: 80,
    flexShrink: 0,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderBottom: "1px solid #EFECEF",

    marginRight: 29,
    marginLeft: 29
  }),
  title: css({
    fontFamily: "'Gabriela', serif",
    fontSize: 18
  })
};

function FAQTitle({ children }: { children: ReactNode }) {
  return <span css={stylesTitle.title}>{children}</span>;
}

const stylesTitle = {
  title: css({
    fontSize: 18,
    lineHeight: "22px",
    color: globalStyles.colors.women,
    textTransform: "uppercase"
  })
};

function FAQSearchBox() {
  return (
    <input
      css={stylesSearchBox.input}
      type="search"
      placeholder="saisissez un mot clef"
    />
  );
}

const stylesSearchBox = {
  input: css({
    appearance: "none",
    height: 52,
    paddingLeft: 26,
    paddingRight: 26,
    border: `solid ${globalStyles.colors.women} 1px`,
    width: "100%",
    fontSize: 14,
    fontWeight: "bold",
    color: globalStyles.colors.women,
    "::placeholder": {
      fontWeight: "normal",
      color: globalStyles.colors.women
    }
  })
};

function FAQSectionRow({ title, detail }: { title: string; detail: string }) {
  return (
    <div css={stylesSectionRow.container}>
      <div css={stylesSectionRow.row}>
        <span css={stylesSectionRow.title}>{title}</span>
        <span css={stylesSectionRow.chevron}>›</span>
      </div>
      <span css={stylesSectionRow.detail}>{detail}</span>
    </div>
  );
}

const stylesSectionRow = {
  container: css({
    marginTop: 14,
    marginBottom: 14
  }),
  row: css({
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 6
  }),
  title: css({
    fontSize: 12,
    fontWeight: "bold",
    lineHeight: "15px",
    color: globalStyles.colors.women,
    textTransform: "uppercase"
  }),
  chevron: css({
    marginLeft: 14,
    lineHeight: "15px",
    color: globalStyles.colors.women
  }),
  detail: css({
    fontSize: 14,
    lineHeight: "17px"
  })
};

function FAQ() {
  return (
    <div css={styles.container}>
      <FAQHeader />

      <div css={styles.content}>
        <img css={css({})} src={process.env.PUBLIC_URL + "/faq-fake.png"} />
        {/*<div css={css({ marginBottom: 26 })}>
          <FAQTitle>Champ d'application et entrée en vigueur</FAQTitle>
        </div>

        <FAQSearchBox />

        <div
          css={css({
            marginTop: 14,
            marginBottom: 14,
            display: "flex",
            flexDirection: "column"
          })}
        >
          <FAQSectionRow
            title="Champ d'application et entrée en vigueur"
            detail="4 articles"
          />
          <FAQSectionRow
            title="Périeffectifs à prendre en compte pour le calcul des indicateurs de référence"
            detail="6 articles"
          />
        </div>*/}
      </div>
    </div>
  );
}

const styles = {
  container: css({
    flex: 1,
    display: "flex",
    flexDirection: "column"
    // paddingRight: 29,
    // paddingLeft: 29
  }),
  content: css({
    overflowY: "auto",
    flex: 1,
    display: "flex",
    flexDirection: "column"
    //paddingTop: 26
  })
};

export default FAQ;
