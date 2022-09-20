import clsx from "clsx";
import type { FunctionComponent } from "react";
import { useState } from "react";

import { useCollapse } from "../hooks/useCollapse";

export type SideMenuProps = {
  buttonLabel: string;
  title: string;
};

export const SideMenu: FunctionComponent<SideMenuProps> = ({ title, buttonLabel, children }) => {
  const [isExpanded, setExpanded] = useState(false);
  const wrapperId = "fr-sidemenu-wrapper";
  const { item, collapse } = useCollapse(wrapperId, isExpanded);
  return (
    <nav className="fr-sidemenu" aria-label="Menu latéral">
      <div className="fr-sidemenu__inner">
        <button
          className="fr-sidemenu__btn"
          hidden
          aria-controls={wrapperId}
          aria-expanded={isExpanded}
          onClick={() => setExpanded(!isExpanded)}
        >
          {buttonLabel}
        </button>
        <div
          className={clsx("fr-collapse", isExpanded && "fr-collapse--expanded")}
          id={wrapperId}
          style={{
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore : custom var
            "--collapse-max-height": item.stateHeight,
            "--collapse": collapse,
          }}
        >
          <div className="fr-sidemenu__title">{title}</div>
          <ul className="fr-sidemenu__list">{children}</ul>
        </div>
      </div>
    </nav>
  );
};
