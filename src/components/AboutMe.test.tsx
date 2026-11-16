import { act, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AboutMe, { REFRESH_MS } from "./AboutMe.tsx";
import { gameStore } from "../roblox/gameStore.ts";
import * as groupInfo from "../roblox/groupInfo.ts";

const INITIAL_VISITS: Record<number, number> = {
  85115018573521: 6106400,
  125204338128040: 7795,
  135717480652890: 1000,
  6829025363: 2000,
  5036935449: 3000,
};
const INITIAL_MEMBERS: Record<number, number> = {
  6323399: 2856,
  10804046: 97,
};
// Mutated by the live-update tests to simulate Roblox's numbers moving.
let VISITS = { ...INITIAL_VISITS };
let MEMBERS = { ...INITIAL_MEMBERS };

beforeEach(() => {
  VISITS = { ...INITIAL_VISITS };
  MEMBERS = { ...INITIAL_MEMBERS };
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
          skills: [{ name: "Scripting", kind: "other" }],
        }}
      />,
    );

    expect(screen.getByText("1+ year")).toBeInTheDocument();
    expect(screen.getByRole("listitem")).toHaveTextContent("Scripting");
  });
});

describe("AboutMe live updates", () => {
  const TOTAL_VISITS = 6120195;

  const settle = () =>
    act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
  const tick = (ms = REFRESH_MS) =>
    act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });

  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("refreshes every 30 seconds", () => {
    expect(REFRESH_MS).toBe(30_000);
  });

  it("re-fetches both stats after each interval, bypassing the cache for visits", async () => {
    render(<AboutMe />);
    await settle();
    const visitCalls = vi.mocked(gameStore.loadLive).mock.calls.length;
    const memberCalls = vi.mocked(groupInfo.fetchGroupMemberCount).mock.calls.length;

    await tick(REFRESH_MS - 1);
    expect(gameStore.loadLive).toHaveBeenCalledTimes(visitCalls);

    await tick(1);
    expect(gameStore.loadLive).toHaveBeenCalledTimes(visitCalls * 2);
    expect(gameStore.loadLive).toHaveBeenLastCalledWith(expect.any(Number), { fresh: true });
    expect(groupInfo.fetchGroupMemberCount).toHaveBeenCalledTimes(memberCalls * 2);

    await tick();
    expect(gameStore.loadLive).toHaveBeenCalledTimes(visitCalls * 3);
  });

  it("only uses the cache-friendly load for the first fetch", async () => {
    render(<AboutMe />);
    await settle();

    const firstCalls = vi.mocked(gameStore.loadLive).mock.calls;
    expect(firstCalls.every((args) => args.length === 1)).toBe(true);
  });

  it("shows no change indicator before the first refresh", async () => {
    render(<AboutMe />);
    await settle();

    expect(screen.getByTestId("total-visits")).toHaveTextContent(`${TOTAL_VISITS.toLocaleString("en-US")}+`);
    expect(screen.queryByTestId("total-visits-change")).not.toBeInTheDocument();
    expect(screen.queryByTestId("community-members-change")).not.toBeInTheDocument();
  });

  it("animates a green up arrow with the delta when totals grow", async () => {
    render(<AboutMe />);
    await settle();

    VISITS[85115018573521] += 25;
    MEMBERS[6323399] += 3;
    await tick();

    expect(screen.getByTestId("total-visits")).toHaveTextContent("6,120,220+");
    expect(screen.getByTestId("total-visits-change")).toHaveClass("live-stat__change--up");
    expect(screen.getByTestId("total-visits-change")).toHaveTextContent("+25");
    expect(screen.getByTestId("community-members")).toHaveTextContent("2,956+");
    expect(screen.getByTestId("community-members-change")).toHaveTextContent("+3");
  });

  it("only flags the stat that actually changed", async () => {
    render(<AboutMe />);
    await settle();

    MEMBERS[6323399] += 1;
    await tick();

    expect(screen.getByTestId("community-members-change")).toBeInTheDocument();
    expect(screen.queryByTestId("total-visits-change")).not.toBeInTheDocument();
  });

  it("shows a red down arrow when a total drops", async () => {
    render(<AboutMe />);
    await settle();

    MEMBERS[10804046] -= 2;
    await tick();

    expect(screen.getByTestId("community-members")).toHaveTextContent("2,951+");
    expect(screen.getByTestId("community-members-change")).toHaveClass("live-stat__change--down");
  });

  it("keeps showing the last good value when a refresh fails", async () => {
    render(<AboutMe />);
    await settle();

    vi.mocked(gameStore.loadLive).mockRejectedValue(new Error("429"));
    vi.mocked(groupInfo.fetchGroupMemberCount).mockRejectedValue(new Error("429"));
    await tick();

    expect(screen.getByTestId("total-visits")).toHaveTextContent("6,120,195+");
    expect(screen.getByTestId("community-members")).toHaveTextContent("2,953+");
  });

  it("recovers on a later refresh after the first load failed", async () => {
    vi.mocked(gameStore.loadLive).mockRejectedValueOnce(new Error("boom"));
    render(<AboutMe />);
    await settle();
    expect(screen.getByTestId("total-visits")).toHaveTextContent("—");

    await tick();

    expect(screen.getByTestId("total-visits")).toHaveTextContent("6,120,195+");
    expect(screen.queryByTestId("total-visits-change")).not.toBeInTheDocument();
  });

  it("does not refresh while the tab is hidden", async () => {
    render(<AboutMe />);
    await settle();
    const calls = vi.mocked(groupInfo.fetchGroupMemberCount).mock.calls.length;
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);

    await tick();
    expect(groupInfo.fetchGroupMemberCount).toHaveBeenCalledTimes(calls);

    hidden.mockReturnValue(false);
    await tick();
    expect(groupInfo.fetchGroupMemberCount).toHaveBeenCalledTimes(calls * 2);
  });

  it("stops refreshing once unmounted", async () => {
    const { unmount } = render(<AboutMe />);
    await settle();
    const calls = vi.mocked(groupInfo.fetchGroupMemberCount).mock.calls.length;

    unmount();
    await tick(REFRESH_MS * 3);

    expect(groupInfo.fetchGroupMemberCount).toHaveBeenCalledTimes(calls);
  });

  it("does not start another refresh while one is still in flight", async () => {
    render(<AboutMe />);
    await settle();
    const calls = vi.mocked(groupInfo.fetchGroupMemberCount).mock.calls.length;
    vi.mocked(groupInfo.fetchGroupMemberCount).mockImplementation(() => new Promise(() => {}));

    await tick();
    await tick();

    expect(groupInfo.fetchGroupMemberCount).toHaveBeenCalledTimes(calls + 2);
  });
});
