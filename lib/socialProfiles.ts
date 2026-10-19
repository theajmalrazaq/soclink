type Platform = "instagram" | "linkedin";

export function socialHandle(value: string, platform: Platform): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const domain = platform === "instagram" ? "instagram.com" : "linkedin.com";
  const match = trimmed.match(
    new RegExp(`^(?:https?://)?(?:www\\.)?${domain.replace(".", "\\.")}/(.+)$`, "i"),
  );
  if (match) {
    const segments = match[1].split(/[/?#]/).filter(Boolean);
    return (segments[segments.length - 1] || "").replace(/^@/, "");
  }

  return trimmed.replace(/^@/, "");
}

export function socialProfileUrl(value: string, platform: Platform): string {
  const handle = socialHandle(value, platform);
  if (!handle) return "";

  const valid = platform === "instagram" ? /^[a-zA-Z0-9._]{1,30}$/ : /^[a-zA-Z0-9-]{1,100}$/;
  if (!valid.test(handle)) {
    throw new Error(
      `Enter a valid ${platform === "instagram" ? "Instagram username" : "LinkedIn page username"}`,
    );
  }

  return platform === "instagram"
    ? `https://www.instagram.com/${handle}/`
    : `https://www.linkedin.com/company/${handle}/`;
}
