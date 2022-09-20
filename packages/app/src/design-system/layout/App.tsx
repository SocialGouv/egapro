import type { FunctionComponent } from "react";

import { Footer } from "../base/Footer";
import { Header } from "../base/Header";

export const App: FunctionComponent = ({ children }) => {
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
