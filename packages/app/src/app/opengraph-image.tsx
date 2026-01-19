import { ImageResponse } from "next/og";

export const alt = "Egapro";
export const size = {
  height: 385,
  width: 500,
};
export const contentType = "image/png";

export default function og() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 60,
          fontWeight: "bold",
          letterSpacing: "-0.025em",
          color: "#000",
          background: "white",
        }}
      >
        Egapro
      </div>
    ),
    size
  );
}
