import { Disclosure } from "@headlessui/react";
import clsx from "clsx";
import type { FunctionComponent } from "react";

import styles from "./SideMenuCollapse.module.css";

export type SideMenuCollapseProps = {
  isCurrent?: boolean;
  isExpandedDefault?: boolean;
  title: string;
};

export const SideMenuCollapse: FunctionComponent<SideMenuCollapseProps> = ({
  isCurrent = false,
  isExpandedDefault = false,
  title,
  children,
}) => {
  return (
    <Disclosure as="li" className="fr-sidemenu__item" defaultOpen={isExpandedDefault}>
      <Disclosure.Button className={clsx("fr-sidemenu__btn", isCurrent && styles.current)}>{title}</Disclosure.Button>
      <Disclosure.Panel as="ul" className="fr-sidemenu__list">
        {children}
      </Disclosure.Panel>
    </Disclosure>
  );
};
