import clsx from "clsx";
import type { PropsWithChildren } from "react";

export type FormLabelProps = PropsWithChildren<{
  as?: "label" | "legend";
  hint?: string;
  htmlFor: string;
}>;

export const FormLabel = ({ as: HtmlTag = "label", htmlFor, hint, children }: FormLabelProps) => {
  return (
    <HtmlTag className={clsx("fr-label", HtmlTag === "legend" && "fr-pl-0")} htmlFor={htmlFor}>
      {children}
      {hint && (
        <span className="fr-hint-text" id={`${htmlFor}-hint`}>
          {hint}
        </span>
      )}
    </HtmlTag>
  );
};
