/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import FAQTitle from "./components/FAQTitle";
import FAQTitle2 from "./components/FAQTitle2";

import { contact } from "../../data/contact";
import globalStyles from "../../utils/globalStyles";

function FAQContact() {
  return (
    <div>
      <FAQTitle>List des référents égalité professionnelle</FAQTitle>

      {contact.map(({ title, people }, i) => (
        <div key={i} css={styles.blocSection}>
          <FAQTitle2>{title}</FAQTitle2>
          <div>
            {people.map(({ title, name, links }, j) => (
              <div key={j} css={styles.blocPerson}>
                <p css={styles.text}>
                  {title && `• ${title} : `}
                  <strong>{name}</strong>
                </p>

                {links.map(({ type, data }, k) => (
                  <p key={k} css={styles.text}>
                    <a
                      css={styles.link}
                      href={type === "email" ? `mailto:${data}` : data}
                    >
                      {data}
                    </a>
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  blocSection: css({
    marginBottom: 26
  }),
  blocPerson: css({
    marginBottom: 12
  }),
  text: css({
    marginBottom: 2,
    fontSize: 14,
    lineHeight: "17px"
  }),
  link: css({
    color: globalStyles.colors.default
  })
};

export default FAQContact;
