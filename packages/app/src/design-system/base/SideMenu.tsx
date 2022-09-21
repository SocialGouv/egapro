import clsx from "clsx";
import type { CSSProperties, FunctionComponent } from "react";
import { useState } from "react";

import { useCollapse } from "../hooks/useCollapse";

export type SideMenuProps = {
  buttonLabel: string;
  className?: string;
  title: string;
};

export const SideMenu: FunctionComponent<SideMenuProps> = ({ title, buttonLabel, children, className }) => {
  const [isExpanded, setExpanded] = useState(false);
  const wrapperId = "fr-sidemenu-wrapper";
  const { item, collapse } = useCollapse(wrapperId, isExpanded);
  return (
    <nav className={clsx("fr-sidemenu", className)} aria-label="Menu latéral">
      <div className="fr-sidemenu__inner fr-py-12v">
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
          style={
            {
              "--collapse-max-height": item.stateHeight,
              "--collapse": collapse,
            } as CSSProperties
          }
        >
          <div className="fr-sidemenu__title">{title}</div>
          {children}
        </div>
      </div>
    </nav>
  );
};
