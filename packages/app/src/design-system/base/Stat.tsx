import { fr } from "@codegouvfr/react-dsfr";
import { type ReactNode } from "react";

import { Box } from "./Box";
import { type HeadingProps, Text, type TextProps } from "./Typography";

export interface StatProps {
  align?: "center" | "left" | "right";
  display?: { asText: TextProps<false>["variant"] } | { asTitle: HeadingProps["display"] };
  helpText?: string;
  helpTextVariant?: TextProps<false>["variant"];
  label?: string;
  text: ReactNode;
}

export const Stat = ({ text, display = { asTitle: "lg" }, helpText, label, align = "center" }: StatProps) => {
  return (
    <Box className={`text-${align}`}>
      {label && <Text text={label} variant="md" className={fr.cx("fr-m-0")} />}
      <Text
        text={text}
        {...("asText" in display ? { variant: display.asText } : {})}
        className={fr.cx("asTitle" in display && display.asTitle && `fr-display--${display.asTitle}`, "fr-m-0")}
      />
      {helpText && <Text text={helpText} variant="bold" className={fr.cx("fr-m-0")} />}
    </Box>
  );
};
