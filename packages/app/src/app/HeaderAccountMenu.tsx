import { fr } from "@codegouvfr/react-dsfr";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { type Session } from "next-auth";

import style from "./root.module.scss";

const _proconnectDiscoveryUrl = process.env.EGAPRO_PROCONNECT_DISCOVERY_URL;

export const HeaderAccountMenu = (props: {
  isEmailLogin: boolean;
  isProConnectTest: boolean;
  session: { data: Session };
  staff: boolean;
}) => {
  return (
    <nav className="fr-nav fr-pr-4v">
      <ul className="fr-nav__list">
        <li className="fr-nav__item">
          <button className={cx(fr.cx("fr-btn"), style["account-menu-button"])}>
            <span
              className={`${props.staff ? "fr-icon-github-line" : "fr-icon-menu-fill"} fr-pr-2v`}
              aria-hidden="true"
            />
            {`${props.session.data.user.email}${props.staff ? " " : ""}`}
          </button>
        </li>
      </ul>
    </nav>
  );
};
