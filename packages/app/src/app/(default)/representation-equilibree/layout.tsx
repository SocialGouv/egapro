import { Container } from "@design-system";
import { type PropsWithChildren } from "react";

import { RepEqBreadcrumb } from "./Breadcrumb";

const RepEqLayout = ({ children }: PropsWithChildren) => {
  return (
    <>
      <Container>
        <RepEqBreadcrumb />
      </Container>
      {children}
    </>
  );
};

export default RepEqLayout;
