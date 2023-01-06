import type { PropsWithChildren, ReactNode } from "react";

export interface ConditionalWrapperProps {
  condition: boolean;
  elseWrapper?: (children: ReactNode) => JSX.Element;
  wrapper: (children: ReactNode) => JSX.Element;
}

export const ConditionalWrapper = ({
  condition,
  wrapper,
  elseWrapper,
  children,
}: PropsWithChildren<ConditionalWrapperProps>) => {
  return <>{condition ? wrapper(children) : elseWrapper?.(children) ?? children}</>;
};
