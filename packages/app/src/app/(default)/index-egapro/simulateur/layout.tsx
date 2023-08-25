import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import { Container } from "@design-system";
import { type PropsWithChildren } from "react";

const SimuFunnelLayout = ({ children }: PropsWithChildren) => {
  return (
    <>
      <Container>
        <Breadcrumb
          homeLinkProps={{
            href: "/",
          }}
          segments={[
            {
              label: "Index",
              linkProps: {
                href: "/index-egapro",
              },
            },
          ]}
          currentPageLabel="Calcul de l'Index"
        />
      </Container>
      {children}
    </>
  );
};

export default SimuFunnelLayout;
