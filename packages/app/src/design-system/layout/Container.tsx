import type { FunctionComponent } from "react";

export const Container: FunctionComponent = ({ children }) => {
  return <div className="fr-container">{children}</div>;
};
