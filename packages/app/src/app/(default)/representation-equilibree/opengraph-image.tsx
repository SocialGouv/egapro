import { ImageResponse } from "next/og";

export const alt = "Représentation Équilibrée Egapro";
export const size = {
  height: 380,
  width: 476,
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
          fontSize: 40,
          fontWeight: "bold",
          letterSpacing: "-0.025em",
          color: "#000",
          background: "white",
        }}
      >
        Représentation<br/>Équilibrée<br/>Egapro
      </div>
    ),
    size
  );
}
