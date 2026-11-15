export type AvailabilityStatus = "open" | "busy" | "closed";

export type HeaderTab = "home" | "work" | "stack" | "pricing" | "contact";

export interface Profile {
  username: string;
  yearsOfExperience: number;
  skills: readonly string[];
}

export interface ContactDetails {
  discordUserId: string;
  robloxUsername: string;
}

export interface GameEntry {
  /** Roblox place id: the number in roblox.com/games/<placeId>/... */
  placeId: number;
}

export interface CommunityEntry {
  /** Roblox group id: the number in roblox.com/communities/<groupId>/... */
  groupId: number;
}

export interface SeoConfig {
  /** Absolute origin the site is served from (used for canonical, OG and sitemap urls). */
  siteUrl: string;
  /** <title> and social title; keep it at or under 60 characters. */
  title: string;
  /** Meta description; keep it at or under 160 characters. */
  description: string;
  /** Target search keywords, most important first. */
  keywords: readonly string[];
  /** Open Graph locale, e.g. en_US. */
  locale: string;
}

export interface PricingConfig {
  /** USD per hour for small, hourly projects. */
  hourlyRateUsd: number;
}

export interface SiteConfig {
  availability: AvailabilityStatus;
  /** Roblox user id; the avatar headshot is fetched from this at build/dev time. */
  robloxUserId: number;
  /** One-line summary shown under the name on the home page. */
  tagline: string;
  profile: Profile;
  contact: ContactDetails;
  paymentMethods: readonly string[];
  pricing: PricingConfig;
  /** Games shown in the Work section; name, stats and thumbnail are fetched live. */
  games: readonly GameEntry[];
  /** Communities whose member counts are fetched live and totalled in About Me. */
  communities: readonly CommunityEntry[];
  seo: SeoConfig;
}

export const siteConfig: SiteConfig = {
  availability: "open",
  robloxUserId: 81878687,
  tagline:
    "Full-stack developer with 10+ YoE creating fun, engaging ROBLOX games",
  profile: {
    username: "DemonLexe",
    yearsOfExperience: 10,
    skills: [
      "Frontend programming",
      "Backend programming",
      "Web programming",
      "UI design",
      "Basic modelling",
      "Social media",
      "Basic animation",
    ],
  },
  contact: {
    // TODO: replace with the real Discord user ID (numeric snowflake).
    discordUserId: "REPLACE_WITH_DISCORD_USER_ID",
    robloxUsername: "DemonLexe",
  },
  paymentMethods: ["Robux", "PayPal (USD)"],
  pricing: { hourlyRateUsd: 30 },
  games: [
    // Pick a Gear Tower
    { placeId: 85115018573521 },
    // Clean a Beach
    { placeId: 125204338128040 },
  ],
  communities: [
    // HexPlum
    { groupId: 6323399 },
    // CastawayStudios (owns Clean a Beach)
    { groupId: 10804046 },
  ],
  seo: {
    siteUrl: "https://demonlexe.github.io/",
    title: "DemonLexe | Roblox Developer for Hire",
    description:
      "Hire DemonLexe, a full-stack Roblox developer with 10+ years of experience building engaging games, scripts, UI and backend systems.",
    keywords: [
      "Roblox developer",
      "Roblox scripter",
      "hire Roblox developer",
      "Roblox game developer",
      "Roblox developer for hire",
      "full-stack Roblox developer",
      "Roblox portfolio",
      "Roblox scripting",
      "Luau",
      "Roblox UI design",
      "Roblox backend developer",
      "DemonLexe",
    ],
    locale: "en_US",
  },
};
