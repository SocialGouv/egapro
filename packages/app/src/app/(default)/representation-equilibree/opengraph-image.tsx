import { ImgRepresentationEquilibree } from "@design-system";
import { ImageResponse } from "next/og";

export const alt = "Représentation Équilibrée Egapro";
export const size = {
  height: 380,
  width: 476,
};
export const contentType = "image/png";

const og = () => {
  return new ImageResponse(<ImgRepresentationEquilibree />, size);
};

export default og;
