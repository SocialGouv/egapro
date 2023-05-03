import { Suspense } from "react";

import { InsideComp } from "./InsideComp";

const FrontAuthPage = () => {
  return (
    <Suspense>
      <InsideComp />
    </Suspense>
  );
};

export default FrontAuthPage;
