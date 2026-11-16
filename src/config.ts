import { yearsSince } from "./experience.ts";

/** Calendar year I started; every "years of experience" figure derives from it. */
const CAREER_START_YEAR = 2016;
const yearsOfExperience = yearsSince(CAREER_START_YEAR);

export type AvailabilityStatus = "open" | "busy" | "closed";

export type HeaderTab = "home" | "work" | "stack" | "pricing" | "contact";

export interface Profile {
  username: string;
  /** Calendar year I started; the Experience row is calculated from it. */
  careerStartYear: number;
  skills: readonly string[];
}

export interface ContactDetails {
  discordUserId: string;
  robloxUsername: string;
  githubUsername: string;
}

export interface StackTool {
  name: string;
  url: string;
  /** Short note on what it is used for. */
  description: string;
}

export interface StackGroup {
  category: string;
  tools: readonly StackTool[];
}

export interface Testimonial {
  /** Username of the person who left the comment. */
  author: string;
  /** The comment, one entry per paragraph. */
  quote: readonly string[];
  /** Optional star rating (1-5) shown under the comment. */
  rating?: number;
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
  /** Comments from clients, shown in the Testimonials section above Pricing. */
  testimonials: readonly Testimonial[];
  /** Page the testimonials were taken from. */
  testimonialsSourceUrl: string;
  /** Preferred tech stack shown in the Technologies used section, grouped by purpose. */
  stack: readonly StackGroup[];
  /** Games shown in the Work section; name, stats and thumbnail are fetched live. */
  games: readonly GameEntry[];
  /** Communities whose member counts are fetched live and totalled in About Me. */
  communities: readonly CommunityEntry[];
  seo: SeoConfig;
}

export const siteConfig: SiteConfig = {
  availability: "open",
  robloxUserId: 81878687,
  tagline: `Full-stack developer with ${yearsOfExperience}+ YoE creating fun, engaging ROBLOX games`,
  profile: {
    username: "DemonLexe",
    careerStartYear: CAREER_START_YEAR,
    skills: [
      "Frontend programming",
      "Backend programming",
      "Web programming",
      "UI design",
      "Basic modelling",
      "Social media",
      "Basic animation",
      "Project management",
    ],
  },
  contact: {
    // TODO: replace with the real Discord user ID (numeric snowflake).
    discordUserId: "REPLACE_WITH_DISCORD_USER_ID",
    robloxUsername: "DemonLexe",
    githubUsername: "demonlexe",
  },
  paymentMethods: ["Robux", "PayPal (USD)"],
  pricing: { hourlyRateUsd: 30 },
  testimonials: [
    {
      author: "moslugs",
      quote: [
        "Hello everyone,",
        "If you are reading this comment, you guys should most definitely give Avoxea a chance. She is one of the dedicated programmers I know on the ROBLOX DevForum, and I can assure you she is able to get the job done. She currently works for me with Valley Community High School alongside two other developers and serves as the Board of Development & Head Developer. Her work is worth it.",
      ],
    },
    {
      author: "TelMemes",
      quote: [
        "Extremely skilled and affordable. Hiring her for your game/group is literally a steal, knowing you’ll get work worth way beyond her prices.",
      ],
    },
    {
      author: "SamIsAcidic",
      quote: [
        "Massive vouch from me.",
        "If you’re looking for someone who knows what they’re doing, and who can complete a job quickly while keeping you updated, Lexi is the person to go to. Lexi demonstrated her overwhelming knowledge of Roblox LUA when they were programming a custom backpack/toolbar UI for me, and it turned out just as I wanted it, if not better.",
      ],
      rating: 5,
    },
  ],
  testimonialsSourceUrl:
    "https://devforum.roblox.com/t/open-demonlexes-portfolio-scriptingui/577664",
  stack: [
    {
      category: "Workflow",
      tools: [
        {
          name: "Rojo",
          url: "https://rojo.space",
          description: "Syncs files into Studio",
        },
        {
          name: "Roblox Studio",
          url: "https://create.roblox.com/docs/studio",
          description: "Build, test, publish",
        },
      ],
    },
    {
      category: "Languages",
      tools: [
        {
          name: "Luau",
          url: "https://luau.org",
          description: "Roblox's scripting language",
        },
        {
          name: "roblox-ts",
          url: "https://roblox-ts.com",
          description: "TypeScript compiled to Luau",
        },
      ],
    },
    {
      category: "Frontend",
      tools: [
        {
          name: "@rbxts/react",
          url: "https://www.npmjs.com/package/@rbxts/react",
          description: "React for in-game UI",
        },
      ],
    },
    {
      category: "UI design",
      tools: [
        {
          name: "Figma",
          url: "https://www.figma.com",
          description: "Interface design",
        },
      ],
    },
    {
      category: "Animation",
      tools: [
        {
          name: "Animation Editor",
          url: "https://create.roblox.com/docs/animation/using",
          description: "Built-in animation tool",
        },
      ],
    },
    {
      category: "Networking",
      tools: [
        {
          name: "Knit",
          url: "https://sleitnick.github.io/Knit/",
          description: "Services and networking",
        },
        {
          name: "Proton",
          url: "https://github.com/Sleitnick/rbxts-proton",
          description: "Game code structure, networking",
        },
      ],
    },
    {
      category: "Package management",
      tools: [
        {
          name: "Wally",
          url: "https://wally.run",
          description: "Roblox package manager",
        },
      ],
    },
    {
      category: "Version control",
      tools: [
        {
          name: "GitHub",
          url: "https://github.com",
          description: "Code hosting and history",
        },
      ],
    },
    {
      category: "Project management",
      tools: [
        {
          name: "GitHub Projects",
          url: "https://docs.github.com/en/issues/planning-and-tracking-with-projects",
          description: "Planning and tracking work",
        },
      ],
    },
  ],
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
      `Hire DemonLexe, a full-stack Roblox developer with ${yearsOfExperience}+ years of experience building engaging games, scripts, UI and backend systems.`,
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
