import type { pvoid } from "@common/utils/types";

export interface Service {
  /**
   * Prepare the service.
   */
  init?(): pvoid;
}
