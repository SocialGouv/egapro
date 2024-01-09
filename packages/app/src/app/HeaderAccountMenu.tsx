import { fr } from "@codegouvfr/react-dsfr";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { type Session } from "next-auth";

import style from "./root.module.scss";

export const HeaderAccountMenu = (props: { session: { data: Session }; staff: boolean }) => {
  const staffLinkText = props.staff ? "Les" : "Mes";
  return (
    <nav className="fr-nav fr-pr-4v">
      <ul className="fr-nav__list">
        <li className="fr-nav__item">
          <button
            className={cx(fr.cx("fr-btn"), style["account-menu-button"])}
            aria-expanded="false"
            aria-controls="account-menu-list"
          >
            <span
              className={`${props.staff ? "fr-icon-github-line" : "fr-icon-menu-fill"} fr-pr-2v`}
              aria-hidden="true"
            />
            {`${props.session.data.user.email}${props.staff ? " " : ""}`}
          </button>
          <div className={cx(fr.cx("fr-collapse"), style["account-menu-list"])} id="account-menu-list">
            <ul className="fr-menu__list">
              <li>
                <a className="fr-nav__link" href="#" target="_self">
                  {staffLinkText} entreprises
                </a>
              </li>
              <li>
                <a className="fr-nav__link" href="/mon-espace/mes-declarations" target="_self">
                  {staffLinkText} déclarations
                </a>
              </li>
            </ul>
          </div>
        </li>
      </ul>
    </nav>
  );
};
