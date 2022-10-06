export function isOpenFeature(value: string | undefined) {
  return /on/i.test(value || "");
}

export type FeatureStatus =
  | {
      message: string;
      type: "error";
    }
  | {
      type: "idle";
    }
  | {
      type: "loading";
    }
  | { message: string; type: "success" };
