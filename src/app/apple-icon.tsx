import { ImageResponse } from "next/og";

// iOS home screens want a raster icon, so the same mark is drawn at 180 square.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const BARS = [
  { colour: "#E4577E", height: 68 },
  { colour: "#E9A84A", height: 102 },
  { colour: "#5FD3C8", height: 85 },
];

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 12,
          paddingBottom: 39,
          background: "#0E0F0F",
        }}
      >
        {BARS.map((bar) => (
          <div
            key={bar.colour}
            style={{
              width: 28,
              height: bar.height,
              borderRadius: 14,
              background: bar.colour,
            }}
          />
        ))}
      </div>
    ),
    size,
  );
}
