import { fr } from "@codegouvfr/react-dsfr";
import { Box, CenteredContainer } from "@design-system";
import { type PropsWithChildren } from "react";

const DEFAULT_TITLE = "Mon Espace";

const MonEspaceLayout = ({ children }: PropsWithChildren) => {
  return (
    <Box className={fr.cx("fr-mt-8w")}>
      <CenteredContainer>{children}</CenteredContainer>
    </Box>
  );
};

export default MonEspaceLayout;

export const metadata = {
  title: { default: DEFAULT_TITLE, template: `%s - ${DEFAULT_TITLE}` },
  description:
    "Egapro permet aux entreprises de mesurer, en toute transparence, les écarts de rémunération entre les sexes et de mettre en évidence leurs points de progression.",
};
