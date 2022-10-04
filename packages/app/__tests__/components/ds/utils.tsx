import { ChakraProvider } from "@chakra-ui/react";
import type { queries, Queries, RenderOptions, RenderResult } from "@testing-library/react";
import { render } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { theme } from "@/theme";

const Providers = ({ children }: PropsWithChildren) => <ChakraProvider theme={theme}>{children}</ChakraProvider>;

const customRender = <
  Q extends Queries = typeof queries,
  Container extends DocumentFragment | Element = HTMLElement,
  BaseElement extends DocumentFragment | Element = Container,
>(
  ui: React.ReactElement,
  options?: RenderOptions<Q, Container, BaseElement>,
): RenderResult<Q, Container, BaseElement> =>
  render<Q, Container, BaseElement>(ui, {
    wrapper: Providers,
    ...options,
  });

export * from "@testing-library/react";
export { customRender as render };
