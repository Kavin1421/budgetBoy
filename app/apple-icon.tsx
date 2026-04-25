import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 36,
          background: "linear-gradient(135deg, #0f766e 0%, #1d4ed8 100%)",
          color: "white",
          fontSize: 100,
          fontWeight: 800,
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        B
      </div>
    ),
    size
  );
}
