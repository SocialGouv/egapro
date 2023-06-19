import { FormLayout } from "@design-system";
import { times } from "lodash";
import Skeleton from "react-loading-skeleton";

export interface SkeletonFormProps {
  /**
   * Default: 3
   */
  fields?: number;
}

export const SkeletonForm = ({ fields = 3 }: SkeletonFormProps) => {
  return (
    <FormLayout>
      {times(fields).map(idx => (
        <div key={idx}>
          <Skeleton width="70%" />
          <Skeleton height="2.5rem" />
        </div>
      ))}
    </FormLayout>
  );
};
