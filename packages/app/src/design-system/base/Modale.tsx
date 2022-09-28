import { Dialog } from "@headlessui/react";
import clsx from "clsx";
import type { PropsWithChildren } from "react";
import React, { Children } from "react";

import styles from "./Modale.module.css";

export type ModaleProps = PropsWithChildren<
  React.ReactHTMLElement<HTMLDivElement> & {
    isOpen: boolean;
    onClose: () => void;
  }
>;

export const Modale = ({ isOpen, onClose, children }: ModaleProps) => {
  console.log(Children.toArray(children));
  const getButtonsArray = Children.toArray(children).filter(child => child.type.displayName === "FormButton");
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
                <div className="fr-modal__content">{children}</div>
              </div>
              {getButtonsArray && (
                <div className="fr-modal__footer">
                  <ul className="fr-btns-group fr-btns-group--right fr-btns-group--inline-lg fr-btns-group--icon-left">
                    {getButtonsArray.map((el, index) => (
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
