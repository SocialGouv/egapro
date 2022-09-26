import clsx from "clsx";
import type { PropsWithChildren } from "react";

export type ContainerProps = PropsWithChildren<{
  className?: string;
}>;

export const Container = ({ children, className }: ContainerProps) => {
  return <div className={clsx("fr-container", className)}>{children}</div>;
};
