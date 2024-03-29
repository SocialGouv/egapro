import { type PropsWithChildren, type ReactNode } from "react";

export interface ConditionalWrapperProps {
  condition: boolean;
  elseWrapper?: (children: ReactNode) => JSX.Element;
  wrapper: (children: ReactNode) => JSX.Element;
}

/**
 * Wrapper component that conditionally wraps its children in a wrapper component.
 */
export const ConditionalWrapper = ({
  condition,
  wrapper,
  elseWrapper,
  children,
}: PropsWithChildren<ConditionalWrapperProps>) => {
  return <>{condition ? wrapper(children) : elseWrapper?.(children) ?? children}</>;
};
