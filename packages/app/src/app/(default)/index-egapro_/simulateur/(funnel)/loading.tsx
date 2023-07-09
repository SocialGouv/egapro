import { FormLayout } from "@design-system";
import Skeleton from "react-loading-skeleton";

const FunnelLoading = () => {
  return (
    <>
      <p>
        <Skeleton count={2} />
      </p>
      <FormLayout>
        <div>
          <Skeleton width="70%" />
          <Skeleton height="2.5rem" />
        </div>
        <div>
          <Skeleton width="70%" />
          <Skeleton height="2.5rem" />
        </div>
      </FormLayout>
    </>
  );
};

export default FunnelLoading;
