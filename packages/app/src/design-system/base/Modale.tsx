import { Dialog } from "@headlessui/react";
import clsx from "clsx";
import type { PropsWithChildren, ReactNode } from "react";
import React, { Children } from "react";

import type { AuthorizedChildType } from "../utils/compatible-components";
import { compatibleComponents } from "../utils/compatible-components";
import styles from "./Modale.module.css";

export type ModaleProps = PropsWithChildren<
  React.ReactHTMLElement<HTMLDivElement> & {
    isOpen: boolean;
    onClose: () => void;
  }
>;

export const Modale = ({ isOpen, onClose, children }: ModaleProps) => {
  const arrayOfChildren = Children.toArray(children);
  compatibleComponents(["FormButton", "ModaleTitle", "ModaleContent"], arrayOfChildren);

  const buttons = arrayOfChildren.filter(child => (child as AuthorizedChildType).type.name === "FormButton");
  const title = arrayOfChildren.filter(child => (child as AuthorizedChildType).type.name === "ModaleTitle");
  const content = arrayOfChildren.filter(child => (child as AuthorizedChildType).type.name === "ModaleContent");

  return (
    <Dialog as="dialog" open={isOpen} onClose={onClose} className={clsx("fr-modal", isOpen && styles.open)}>
      <Dialog.Panel>
        <div className="fr-container fr-container--fluid fr-container-md">
          <div className="fr-grid-row fr-grid-row--center">
            <div className="fr-col-12 fr-col-md-8 fr-col-lg-6">
              <div className="fr-modal__body">
                <div className="fr-modal__header">
                  <button onClick={onClose} className="fr-btn--close fr-btn">
                    Fermer
                  </button>
                </div>
                <div className="fr-modal__content">
                  {title}
                  {content}
                </div>
              </div>
              {buttons.length && (
                <div className="fr-modal__footer">
                  <ul className="fr-btns-group fr-btns-group--right fr-btns-group--inline-lg fr-btns-group--icon-left">
                    {buttons.map((el, index) => (
                      <li key={index}>{el}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
};

Modale.Title = function ModaleTitle({
  as = "h1",
  children,
}: {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  children: ReactNode;
}) {
  return (
    <Dialog.Title as={as} className="fr-modal__title">
      <span className="fr-fi-arrow-right-line fr-fi--lg" />
      {children}
    </Dialog.Title>
  );
};

Modale.Content = function ModaleContent({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
};
