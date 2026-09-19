// Serve requests dynamically, sharing GitHub's response for five minutes.
export const revalidate = 0;

export async function GET() {
  try {
    const response = await fetch("https://api.github.com/repos/LegalQuants/lq-plugin-oss", {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "kevanwee-portfolio",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error("GitHub unavailable");

    const { stargazers_count: stars } = await response.json();
    if (!Number.isSafeInteger(stars) || stars < 0) throw new Error("Invalid star count");

    return Response.json({ stars }, {
      headers: { "Cache-Control": "public, max-age=60, s-maxage=60" },
    });
  } catch {
    return Response.json({ stars: null }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
