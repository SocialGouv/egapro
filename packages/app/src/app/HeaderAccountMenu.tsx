import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
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
          <Button
            priority="secondary"
            iconId="fr-icon-account-fill"
            className="fr-pr-2v"
          >
            {`${props.session.data.user.email}${props.staff ? " " : ""}`}
          </Button>
        </li>
      </ul>
    </nav>
  );
};
