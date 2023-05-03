import { ImageResponse } from "next/server";

import { ImgHome } from "../../design-system/img/ImgHome";

export const alt = "Recherche Egapro";
export const size = {
  height: 385,
  width: 500,
};
export const contentType = "image/png";

const og = () => {
  return new ImageResponse(<ImgHome />, size);
};

export default og;
