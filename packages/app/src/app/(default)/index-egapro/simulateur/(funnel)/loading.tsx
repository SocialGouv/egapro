import { CenteredContainer, FormLayout } from "@design-system";
import { Skeleton } from "@design-system/utils/client/skeleton";

const FunnelLoading = () => {
  return (
    <CenteredContainer pb="6w">
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
    </CenteredContainer>
  );
};

export default FunnelLoading;
