import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import { Container } from "@design-system";
import { type PropsWithChildren } from "react";

const RepEqLayout = ({ children }: PropsWithChildren) => {
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
                href: "/index-egapro_",
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

export default RepEqLayout;
