import { ImageResponse } from "next/og";

export const alt = "Kevan Wee — Computing & Law, LegalTech";
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
          padding: "0 110px",
          backgroundColor: "#faf8f4",
          backgroundImage:
            "radial-gradient(800px at 85% 15%, rgba(132,169,140,0.14), transparent 70%)",
        }}
      >
        <div
          style={{
            width: 72,
            height: 6,
            backgroundColor: "#4e8570",
            borderRadius: 3,
            marginBottom: 44,
          }}
        />
        <div
          style={{
            fontSize: 104,
            fontWeight: 700,
            color: "#352b21",
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
          }}
        >
          Kevan Wee
        </div>
        <div
          style={{
            marginTop: 30,
            fontSize: 38,
            color: "#6e5f53",
          }}
        >
          Computing &amp; Law · Singapore Management University
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: 30,
            fontWeight: 600,
            color: "#3a6b59",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          LegalTech · LegalOps · Legal AI
        </div>
      </div>
    ),
    size
  );
}
