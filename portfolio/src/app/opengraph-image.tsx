import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const alt = "Kevan Wee — Computing & Law, LegalTech";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const read = (...segments: string[]) =>
  readFile(path.join(process.cwd(), ...segments));

const pngDataUri = async (...segments: string[]) =>
  `data:image/png;base64,${(await read(...segments)).toString("base64")}`;

// Mirrors the PokeballRow order on the site.
const POKEBALLS = [
  "cherish-ball",
  "quick-ball",
  "luxury-ball",
  "beast-ball",
  "fast-ball",
  "premier-ball",
];

export default async function OpengraphImage() {
  const [playfairBold, playfairBoldItalic, interMedium, interSemiBold] =
    await Promise.all([
      read("src", "assets", "og", "PlayfairDisplay-Bold.ttf"),
      read("src", "assets", "og", "PlayfairDisplay-BoldItalic.ttf"),
      read("src", "assets", "og", "Inter-Medium.ttf"),
      read("src", "assets", "og", "Inter-SemiBold.ttf"),
    ]);

  const cloud = await pngDataUri("public", "cloud-chibi.png");
  const balls = await Promise.all(
    POKEBALLS.map((b) => pngDataUri("public", "pokeballs", `${b}.png`))
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#faf8f4",
          backgroundImage:
            "radial-gradient(700px at 82% 18%, rgba(132,169,140,0.12), transparent 70%)",
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: "Playfair Display",
            fontSize: 132,
            fontWeight: 700,
            color: "#1a1512",
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}
        >
          Kevan
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            marginTop: 6,
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: "Playfair Display",
              fontStyle: "italic",
              fontSize: 132,
              fontWeight: 700,
              color: "#3a6b59",
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            Wee
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "Playfair Display",
              fontSize: 132,
              fontWeight: 700,
              color: "#ddd4c8",
              lineHeight: 1,
            }}
          >
            .
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cloud}
            alt=""
            width={172}
            height={176}
            style={{ marginLeft: -6, marginBottom: -12 }}
          />
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 40,
            fontFamily: "Inter",
            fontWeight: 600,
            fontSize: 30,
            letterSpacing: "0.24em",
            color: "#8a7a6d",
          }}
        >
          COMPUTING &amp; LAW
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 16,
            fontFamily: "Inter",
            fontWeight: 500,
            fontSize: 24,
            letterSpacing: "0.14em",
            color: "#c4b8aa",
          }}
        >
          LegalTech · LegalOps · Legal AI
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 26,
            marginTop: 42,
          }}
        >
          {balls.map((src, i) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img key={i} src={src} alt="" width={44} height={44} />
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Playfair Display",
          data: playfairBold,
          weight: 700,
          style: "normal",
        },
        {
          name: "Playfair Display",
          data: playfairBoldItalic,
          weight: 700,
          style: "italic",
        },
        { name: "Inter", data: interMedium, weight: 500, style: "normal" },
        { name: "Inter", data: interSemiBold, weight: 600, style: "normal" },
      ],
    }
  );
}
