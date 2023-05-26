import { getCsrfToken } from "next-auth/react";
import { Suspense } from "react";

import { InsideComp } from "./InsideComp";

const FrontAuthPage = async () => {
  const csrfToken = await getCsrfToken();
  return (
    <Suspense>
      <InsideComp csrfToken={csrfToken} />
    </Suspense>
  );
};

export default FrontAuthPage;
