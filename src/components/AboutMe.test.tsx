import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AboutMe from "./AboutMe.tsx";
import { siteConfig } from "../config.ts";
import { gameStore } from "../roblox/gameStore.ts";
import * as groupInfo from "../roblox/groupInfo.ts";

const VISITS: Record<number, number> = {
  85115018573521: 6106400,
  125204338128040: 7795,
  135717480652890: 1000,
  6829025363: 2000,
  5036935449: 3000,
};
const MEMBERS: Record<number, number> = {
  6323399: 2856,
  10804046: 97,
};

beforeEach(() => {
  vi.spyOn(gameStore, "loadLive").mockImplementation(async (placeId) => ({
    placeId,
    universeId: 1,
    name: "Game",
    playing: 0,
    visits: VISITS[placeId],
    imageUrl: null,
  }));
  vi.spyOn(groupInfo, "fetchGroupMemberCount").mockImplementation(
    async (groupId) => MEMBERS[groupId],
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("AboutMe", () => {
  it("shows total visits across every My Games game, once loaded", async () => {
    render(<AboutMe />);

    const term = screen.getByText("Total visits");
    expect(term.tagName).toBe("DT");
    expect(term.nextElementSibling).toHaveTextContent("…");

    expect(await screen.findByText("6,120,195+")).toBe(term.nextElementSibling);
    expect(gameStore.loadLive).toHaveBeenCalledWith(85115018573521);
    expect(gameStore.loadLive).toHaveBeenCalledWith(125204338128040);
    expect(gameStore.loadLive).toHaveBeenCalledWith(135717480652890);
    expect(gameStore.loadLive).toHaveBeenCalledWith(6829025363);
    expect(gameStore.loadLive).toHaveBeenCalledWith(5036935449);
  });

  it("shows community members summed across every community, once loaded", async () => {
    render(<AboutMe />);

    const term = screen.getByText("Community members");
    expect(term.tagName).toBe("DT");
    expect(term.nextElementSibling).toHaveTextContent("…");

    expect(await screen.findByText("2,953+")).toBe(term.nextElementSibling);
    expect(groupInfo.fetchGroupMemberCount).toHaveBeenCalledWith(
      6323399,
      expect.anything(),
      expect.anything(),
    );
    expect(groupInfo.fetchGroupMemberCount).toHaveBeenCalledWith(
      10804046,
      expect.anything(),
      expect.anything(),
    );
  });

  it("orders the stats after the experience row and before the skillset", () => {
    render(<AboutMe />);

    const labels = screen.getAllByRole("term").map((el) => el.textContent);
    expect(labels).toEqual([
      "Experience",
      "Bio",
      "Total visits",
      "Community members",
      "Skillset",
    ]);
  });

  it("shows a dash for a stat that fails to load, without breaking the other", async () => {
    vi.spyOn(gameStore, "loadLive").mockRejectedValue(new Error("boom"));

    render(<AboutMe />);

    expect(await screen.findByText("2,953+")).toBeInTheDocument();
    expect(
      screen.getByText("Total visits").nextElementSibling,
    ).toHaveTextContent("—");
  });

  it("totals only the games and communities it is given", async () => {
    render(
      <AboutMe
        games={[{ placeId: 125204338128040 }]}
        communities={[{ groupId: 10804046 }]}
      />,
    );

    expect(await screen.findByText("7,795+")).toBeInTheDocument();
    expect(await screen.findByText("97+")).toBeInTheDocument();
  });

  it("renders an ABOUT ME heading", () => {
    render(<AboutMe />);

    expect(
      screen.getByRole("heading", { level: 2, name: /about me/i }),
    ).toBeInTheDocument();
  });

  it("places the divider above the About Me heading", () => {
    render(<AboutMe />);

    const heading = screen.getByRole("heading", {
      level: 2,
      name: /about me/i,
    });
    const divider = screen.getByRole("separator");

    expect(
      divider.compareDocumentPosition(heading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(heading.previousElementSibling).toBe(divider);
  });

  it("does not show a username row", () => {
    render(<AboutMe />);

    expect(screen.queryByText("Username")).not.toBeInTheDocument();
    expect(screen.queryByText("DemonLexe")).not.toBeInTheDocument();
  });

  it("shows the experience calculated from the career start year", () => {
    vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-15T12:00:00Z") });
    render(<AboutMe />);

    expect(screen.getByText("10+ years")).toBeInTheDocument();
  });

  it("updates the experience as the years pass", () => {
    vi.useFakeTimers({ toFake: ["Date"], now: new Date("2027-01-01T12:00:00Z") });
    render(<AboutMe />);

    expect(screen.getByText("11+ years")).toBeInTheDocument();
  });

  it("lists every skill in the skillset", () => {
    render(<AboutMe />);

    const skills = within(
      screen.getByRole("list", { name: /skillset/i }),
    ).getAllByRole("listitem");
    expect(skills.map((item) => item.textContent)).toEqual([
      "Frontend programming",
      "Backend programming",
      "Web programming",
      "UI design",
      "Basic modelling",
      "Social media",
      "Basic animation",
      "Project management",
    ]);
    for (const item of skills) {
      expect(item).toHaveClass("skill-lozenge");
    }
  });

  it("makes the three programming skills purple and every other skill blue", () => {
    render(<AboutMe />);

    const items = within(
      screen.getByRole("list", { name: /skillset/i }),
    ).getAllByRole("listitem");
    const kinds = Object.fromEntries(
      items.map((item) => [
        item.textContent,
        item.classList.contains("skill-lozenge--programming")
          ? "programming"
          : item.classList.contains("skill-lozenge--other")
            ? "other"
            : "none",
      ]),
    );

    expect(Object.entries(kinds).filter(([, kind]) => kind === "programming").map(([name]) => name)).toEqual([
      "Frontend programming",
      "Backend programming",
      "Web programming",
    ]);
    expect(Object.values(kinds).filter((kind) => kind === "other")).toHaveLength(items.length - 3);
    expect(Object.values(kinds)).not.toContain("none");
  });

  it("accepts a custom profile", () => {
    render(
      <AboutMe
        profile={{
          username: "Someone",
          careerStartYear: new Date().getFullYear() - 1,
          bio: "Custom bio.",
          skills: [{ name: "Scripting", kind: "other" }],
        }}
      />,
    );

    expect(screen.getByText("1+ year")).toBeInTheDocument();
    expect(screen.getByRole("listitem")).toHaveTextContent("Scripting");
  });

  it("shows the bio in a Bio row directly under Experience", () => {
    render(<AboutMe />);

    const term = screen.getByText("Bio");
    expect(term.tagName).toBe("DT");
    expect(term.previousElementSibling).toBe(
      screen.getByText("Experience").nextElementSibling,
    );
    expect(term.nextElementSibling).toHaveTextContent(siteConfig.profile.bio);
    expect(term.nextElementSibling).toHaveTextContent(/I'm Lexi/);
  });

  it("ends the bio with a Discord ↗ link to the configured Discord user", () => {
    render(
      <AboutMe
        profile={{
          username: "Someone",
          careerStartYear: 2020,
          bio: "Hello there.",
          skills: [],
        }}
        contact={{
          discordUserId: "123456789",
          robloxUsername: "x",
          githubUsername: "y",
        }}
      />,
    );

    const bio = screen.getByText("Bio").nextElementSibling as HTMLElement;
    const link = within(bio).getByRole("link", { name: "Discord ↗" });
    expect(link).toHaveAttribute("href", "https://discord.com/users/123456789");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
    expect(bio).toHaveTextContent("Hello there. Discord ↗");
  });
});
