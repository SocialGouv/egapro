import clsx from "clsx";
import type { FunctionComponent } from "react";

export type FormLabelProps = {
  as?: "label" | "legend";
  hint?: string;
  htmlFor: string;
};

export const FormLabel: FunctionComponent<FormLabelProps> = ({ as: HtmlTag = "label", htmlFor, hint, children }) => {
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
