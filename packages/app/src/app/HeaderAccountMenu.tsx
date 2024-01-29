import { fr } from "@codegouvfr/react-dsfr";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { type Session } from "next-auth";

import style from "./root.module.scss";

export const HeaderAccountMenu = (props: {
  isMonCompteProTest: boolean;
  session: { data: Session };
  staff: boolean;
}) => {
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
              {props.staff && (
                <li>
                  <a className="fr-nav__link" href="/mon-espace/les-entreprises" target="_self">
                    Les entreprises
                  </a>
                </li>
              )}
              {!props.staff && (
                <li>
                  <a className="fr-nav__link" href="/mon-espace/mes-entreprises" target="_self">
                    Mes entreprises
                  </a>
                </li>
              )}
              <li>
                <a className="fr-nav__link" href="/mon-espace/mes-declarations" target="_self">
                  {staffLinkText} déclarations
                </a>
              </li>
              <li>
                <a
                  className="fr-nav__link"
                  href={`https://app${props.isMonCompteProTest ? "-test" : ""}.moncomptepro.beta.gouv.fr`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Accès à mon compte MonComptePro
                </a>
              </li>
            </ul>
          </div>
        </li>
      </ul>
    </nav>
  );
};
