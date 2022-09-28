import { Dialog } from "@headlessui/react";
import type { PropsWithChildren } from "react";
import React from "react";

export type ModaleTitleProps = PropsWithChildren<{
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}>;

export const ModaleTitle = ({ as = "h1", children }: ModaleTitleProps) => {
  return (
    <Dialog.Title as={as} className="fr-modal__title">
      <span className="fr-fi-arrow-right-line fr-fi--lg" />
      {children}
    </Dialog.Title>
  );
};

ModaleTitle.displayName = "xxxxxxxx";
