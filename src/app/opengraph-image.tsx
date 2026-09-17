import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "EventConnect — run every side of your event, in one place";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#1C2B4A",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "#D9A441",
              alignItems: "center",
              justifyContent: "center",
              color: "#1C2B4A",
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            E
          </div>
          <div style={{ color: "#FFFFFF", fontSize: 28, fontWeight: 600 }}>EventConnect</div>
        </div>
        <div style={{ display: "flex", color: "#FFFFFF", fontSize: 56, fontWeight: 700, maxWidth: 900, lineHeight: 1.15 }}>
          Run every side of your event, in one place
        </div>
        <div style={{ display: "flex", color: "#B7C6ED", fontSize: 26, marginTop: 24, maxWidth: 780 }}>
          Organizers, speakers, attendees, and partners — one platform.
        </div>
      </div>
    ),
    { ...size },
  );
}
