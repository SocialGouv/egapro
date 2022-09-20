import type { FunctionComponent } from "react";
import type { PropsWithChildren } from "react";

import { Footer } from "../base/Footer";
import { Header } from "../base/Header";

// eslint-disable-next-line @typescript-eslint/ban-types -- props with children
export type AppProps = PropsWithChildren<{}>;

export const App: FunctionComponent<AppProps> = ({ children }) => {
  return (
    <div>
      <Header />
      <main role="main" id="content">
        {children}
      </main>
      <Footer />
    </div>
  );
};
