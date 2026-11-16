import { afterEach, describe, expect, it, vi } from "vitest";
import { siteConfig } from "./config.ts";
import { yearsSince } from "./experience.ts";

describe("siteConfig", () => {
  it("defaults availability to open", () => {
    expect(siteConfig.availability).toBe("open");
  });

  it("hides the Other Work section by default", () => {
    expect(siteConfig.showOtherWork).toBe(false);
  });

  it("stores the Roblox user id used to fetch the avatar headshot", () => {
    expect(siteConfig.robloxUserId).toBe(81878687);
  });

  it("defines the home page tagline using the calculated years of experience", () => {
    expect(siteConfig.tagline).toBe(
      `Full-stack developer with ${yearsSince(2016)}+ YoE creating fun, engaging ROBLOX games`,
    );
  });

  describe("years of experience", () => {
    afterEach(() => {
      vi.useRealTimers();
      vi.resetModules();
    });

    it("is calculated from the single career start year in the profile", () => {
      expect(siteConfig.profile.careerStartYear).toBe(2016);
    });

    it("flows into the tagline and SEO description as time passes", async () => {
      vi.useFakeTimers({ toFake: ["Date"], now: new Date("2030-03-01T12:00:00Z") });
      vi.resetModules();
      const { siteConfig: future } = await import("./config.ts");

      expect(future.tagline).toContain("14+ YoE");
      expect(future.seo.description).toContain("14+ years of experience");
    });
  });

  it("defines contact details with a Discord user ID and Roblox username", () => {
    expect(siteConfig.contact.discordUserId).toEqual(expect.any(String));
    expect(siteConfig.contact.discordUserId.length).toBeGreaterThan(0);
    expect(siteConfig.contact.robloxUsername).toBe("DemonLexe");
  });

  it("defines the GitHub username used in the Contact section", () => {
    expect(siteConfig.contact.githubUsername).toBe("demonlexe");
  });

  it("lists the games shown in the My Games section by Roblox place id", () => {
    expect(siteConfig.games).toEqual([
      { placeId: 85115018573521 },
      { placeId: 125204338128040 },
      // Retro SLAP
      { placeId: 135717480652890 },
      // Cook Away
      { placeId: 6829025363 },
      // Escape The Dark Forest Obby
      { placeId: 5036935449 },
    ]);
  });

  it("lists the communities whose members are totalled in About Me by Roblox group id", () => {
    expect(siteConfig.communities).toEqual([
      // HexPlum
      { groupId: 6323399 },
      // CastawayStudios (owns Clean a Beach)
      { groupId: 10804046 },
    ]);
  });

  it("lists DevForum testimonials credited by username", () => {
    expect(siteConfig.testimonials.map((t) => t.author)).toEqual([
      "moslugs",
      "TelMemes",
      "SamIsAcidic",
    ]);
    for (const t of siteConfig.testimonials) {
      expect(t.quote.length).toBeGreaterThan(0);
      expect(t.quote.every((p) => p.length > 0)).toBe(true);
    }
  });

  it("links testimonials back to the DevForum portfolio thread", () => {
    expect(siteConfig.testimonialsSourceUrl).toBe(
      "https://devforum.roblox.com/t/open-demonlexes-portfolio-scriptingui/577664",
    );
  });

  it("defines the hourly rate for small projects", () => {
    expect(siteConfig.pricing.hourlyRateUsd).toBe(30);
  });

  it("accepts Robux and PayPal (USD) as payment methods", () => {
    expect(siteConfig.paymentMethods).toEqual(["Robux", "PayPal (USD)"]);
  });

  describe("seo", () => {
    it("uses an absolute https site url", () => {
      expect(siteConfig.seo.siteUrl).toBe("https://demonlexe.github.io/");
    });

    it("keeps the title and description within search result limits", () => {
      expect(siteConfig.seo.title.length).toBeLessThanOrEqual(60);
      expect(siteConfig.seo.description.length).toBeGreaterThanOrEqual(70);
      expect(siteConfig.seo.description.length).toBeLessThanOrEqual(160);
    });

    it("targets Roblox developer hiring keywords without duplicates", () => {
      const keywords = siteConfig.seo.keywords.map((k) => k.toLowerCase());
      expect(keywords).toEqual(
        expect.arrayContaining([
          "roblox developer",
          "roblox scripter",
          "hire roblox developer",
          "roblox game developer",
          "luau",
        ]),
      );
      expect(new Set(keywords).size).toBe(keywords.length);
      expect(keywords.length).toBeLessThanOrEqual(15);
    });

    it("mentions the primary keyword in the title and description", () => {
      expect(siteConfig.seo.title).toMatch(/roblox developer/i);
      expect(siteConfig.seo.description).toMatch(/roblox developer/i);
    });
  });

  it("defines a bio that mentions the key facts", () => {
    expect(siteConfig.profile.bio).toMatch(/Lexi/);
    expect(siteConfig.profile.bio).toMatch(/5 games/);
    expect(siteConfig.profile.bio).toMatch(/10\+ clients/);
    expect(siteConfig.profile.bio).toMatch(/Head Developer/);
    expect(siteConfig.profile.bio).toMatch(/embraced coding agents/);
    expect(siteConfig.profile.bioContact).toMatch(/Message me/);
  });

  it("defines the profile used by the About Me section", () => {
    expect(siteConfig.profile).toEqual({
      username: "DemonLexe",
      careerStartYear: 2016,
      bio: expect.any(String),
      bioContact: expect.any(String),
      skills: [
        { name: "Frontend programming", kind: "programming" },
        { name: "Backend programming", kind: "programming" },
        { name: "Web programming", kind: "programming" },
        { name: "UI design", kind: "other" },
        { name: "Basic modelling", kind: "other" },
        { name: "Social media", kind: "other" },
        { name: "Basic animation", kind: "other" },
        { name: "Project management", kind: "other" },
      ],
    });
  });

  it("lists the preferred tech stack grouped by purpose", () => {
    expect(
      siteConfig.stack.map((group) => [group.category, group.tools.map((t) => t.name)]),
    ).toEqual([
      ["Workflow", ["Rojo", "Roblox Studio"]],
      ["Languages", ["Luau", "roblox-ts"]],
      ["Frontend", ["@rbxts/react"]],
      ["UI design", ["Figma"]],
      ["Animation", ["Animation Editor"]],
      ["Networking", ["Knit", "Proton"]],
      ["Data", ["ProfileStore"]],
      ["Package management", ["Wally"]],
      ["Version control", ["GitHub"]],
      ["Project management", ["GitHub Projects"]],
    ]);
  });

  it("links ProfileStore to its DevForum announcement", () => {
    const tool = siteConfig.stack
      .flatMap((g) => g.tools)
      .find((t) => t.name === "ProfileStore");
    expect(tool?.url).toBe(
      "https://devforum.roblox.com/t/profilestore-save-your-player-data-easy-datastore-module/3190543",
    );
  });

  it("does not mention the old Avoxea name anywhere in the config", () => {
    expect(JSON.stringify(siteConfig)).not.toMatch(/avoxea/i);
  });

  it("gives every stack tool a description and an https link", () => {
    for (const tool of siteConfig.stack.flatMap((g) => g.tools)) {
      expect(tool.description.length).toBeGreaterThan(0);
      expect(tool.url).toMatch(/^https:\/\//);
    }
  });
});
