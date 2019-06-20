/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { useState } from "react";

import { contact } from "../../data/contact";
import { FAQContactBloc } from "../../globals";
import globalStyles from "../../utils/globalStyles";

import ActionLink from "../../components/ActionLink";
import FAQTitle from "./components/FAQTitle";

function FAQContact() {
  return (
    <div>
      <FAQTitle>Liste des référents égalité professionnelle</FAQTitle>

      {contact.map((contactBloc, i) => (
        <FAQContactBlocSection key={i} contactBloc={contactBloc} />
      ))}
    </div>
  );
}

function FAQContactBlocSection({
  contactBloc: { title, people }
}: {
  contactBloc: FAQContactBloc;
}) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  return (
    <div css={styles.blocSection}>
      <FAQContactBlocSectionTitle
        title={title}
        isOpen={isOpen}
        toggleBloc={() => setIsOpen(!isOpen)}
      />

      <div css={[styles.blocPeople, isOpen && styles.blocPeopleOpen]}>
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
  );
}

function FAQContactBlocSectionTitle({
  title,
  isOpen,
  toggleBloc
}: {
  title: FAQContactBloc["title"];
  isOpen: boolean;
  toggleBloc: () => void;
}) {
  return (
    <ActionLink onClick={toggleBloc} style={styles.actionLink}>
      <div css={styles.row}>
        <span css={styles.title}>{title}</span>
        {!isOpen && <span css={styles.chevron}>›</span>}
      </div>
    </ActionLink>
  );
}

const styles = {
  blocSection: css({
    marginBottom: 26
  }),
  blocPeople: css({
    display: "none"
  }),
  blocPeopleOpen: css({
    display: "block"
  }),
  blocPerson: css({
    marginBottom: 12
  }),

  actionLink: css({
    width: "100%",
    textDecoration: "none",
    marginBottom: 6
  }),
  row: css({
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  }),
  title: css({
    fontSize: 12,
    fontWeight: "bold",
    lineHeight: "15px",
    color: globalStyles.colors.primary,
    textTransform: "uppercase"
  }),
  chevron: css({
    marginLeft: 14,
    lineHeight: "15px",
    color: globalStyles.colors.primary
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
