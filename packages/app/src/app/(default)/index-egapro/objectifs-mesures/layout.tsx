import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import { config } from "@common/config";
import { CenteredContainer, Container } from "@design-system";
import { type PropsWithChildren } from "react";

import { AlertExistingDeclaration } from "../declaration/AlertExistingDeclaration";

const DEFAULT_TITLE = "Déclaration d'index Egapro";

const DeclarationLayout = ({ children }: PropsWithChildren) => {
  return (
    <>
      <Container>
        <Breadcrumb
          currentPageLabel="Déclaration d'index"
          homeLinkProps={{
            href: "/",
          }}
          segments={[
            {
              linkProps: {
                href: `${config.base_declaration_url}/commencer`,
              },
              label: "Index",
            },
          ]}
        />
      </Container>
      <CenteredContainer>
        <AlertExistingDeclaration />
        {children}
      </CenteredContainer>
    </>
  );
};

export default DeclarationLayout;

export const metadata = {
  title: { default: DEFAULT_TITLE, template: `%s - ${DEFAULT_TITLE}` },
  description:
    "Egapro permet aux entreprises de mesurer, en toute transparence, les écarts de rémunération entre les sexes et de mettre en évidence leurs points de progression.",
};
