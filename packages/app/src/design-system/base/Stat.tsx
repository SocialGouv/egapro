import { Box } from "./Box";
import { type HeadingProps, Text } from "./Typography";

export interface StatProps {
  align?: "center" | "left" | "right";
  display?: HeadingProps["display"];
  helpText?: string;
  label?: string;
  text: string;
}

export const Stat = ({ text, display = "lg", helpText, label, align = "center" }: StatProps) => {
  return (
    <Box style={{ textAlign: align }}>
      {label && <Text text={label} variant="md" dsfrClassName="fr-m-0" />}
      <Text text={text} dsfrClassName={[`fr-display--${display}`, "fr-m-0"]} />
      {helpText && <Text text={helpText} variant="bold" dsfrClassName="fr-m-0" />}
    </Box>
  );
};
