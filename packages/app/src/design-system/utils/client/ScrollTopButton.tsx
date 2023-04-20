"use client";

import { Button, type ButtonProps } from "@codegouvfr/react-dsfr/Button";
import { type Any } from "@common/utils/types";

export type ScrollTopButtonProps = Omit<ButtonProps, "onClick"> & {
  skipHeader?: boolean;
  smooth?: boolean;
};

export const ScrollTopButton = ({ smooth, skipHeader, ...rest }: ScrollTopButtonProps) => (
  <Button
    {...(rest as Any)}
    onClick={() =>
      window.scrollTo({
        top: skipHeader ? document.querySelector("header")?.getBoundingClientRect().height ?? 0 : 0,
        behavior: smooth ? "smooth" : "auto",
      })
    }
  />
);
