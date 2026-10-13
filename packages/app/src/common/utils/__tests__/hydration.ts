import { type ReactElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { act } from "react-dom/test-utils";

/**
 * Hydrates the server markup of `element` the way the browser receives it: parsed as HTML first.
 * The HTML parser rewrites invalid nesting (e.g. a `<ul>` or a `<p>` inside a `<p>`), so the DOM no
 * longer matches the React tree and hydration fails.
 */
export const expectToHydrateWithoutMismatch = async (element: ReactElement) => {
  const container = document.createElement("div");
  container.innerHTML = renderToString(element);
  document.body.appendChild(container);

  const errors: unknown[] = [];
  let root: ReturnType<typeof hydrateRoot> | undefined;
  await act(async () => {
    root = hydrateRoot(container, element, { onRecoverableError: error => errors.push(error) });
  });

  expect(errors).toEqual([]);

  act(() => root?.unmount());
  container.remove();
};
