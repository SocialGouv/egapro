import { Dialog } from "@headlessui/react";
import clsx from "clsx";
import type { PropsWithChildren } from "react";

import styles from "./Modale.module.css";

export type ModaleProps = PropsWithChildren<
  React.ReactHTMLElement<HTMLDivElement> & {
    isOpen: boolean;
    onClose: () => void;
  }
>;

export const Modale = ({ isOpen, onClose, children }: ModaleProps) => {
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
                  <Dialog.Title as="h1" className="fr-modal__title">
                    <span className="fr-fi-arrow-right-line fr-fi--lg" />
                    Deactivate account
                  </Dialog.Title>
                  {children}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
};
