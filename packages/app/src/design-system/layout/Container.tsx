import clsx from "clsx";
import type { FunctionComponent } from "react";

export type ContainerProps = {
  className?: string;
};

export const Container: FunctionComponent<ContainerProps> = ({ children, className }) => {
  return <div className={clsx("fr-container", className)}>{children}</div>;
};
