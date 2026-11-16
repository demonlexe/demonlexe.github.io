import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import StackList from "./StackList.tsx";
import { siteConfig, type StackGroup } from "../config.ts";

const GROUPS: readonly StackGroup[] = [
  {
    category: "Networking",
    tools: [
      { name: "Knit", url: "https://example.com/knit", description: "Services and controllers" },
      { name: "Proton", url: "https://example.com/proton", description: "Another framework" },
    ],
  },
  {
    category: "Design",
    tools: [{ name: "Figma", url: "https://example.com/figma", description: "UI design" }],
  },
];

describe("StackList", () => {
  it("renders a labelled list of tools for each category, in order", () => {
    render(<StackList groups={GROUPS} />);

    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings.map((h) => h.textContent)).toEqual(["Networking", "Design"]);

    const networking = screen.getByRole("list", { name: "Networking" });
    expect(within(networking).getAllByRole("listitem")).toHaveLength(2);
    expect(
      within(networking)
        .getAllByRole("link")
        .map((l) => l.textContent),
    ).toEqual(["Knit", "Proton"]);
  });

  it("shows each tool's description next to its name", () => {
    render(<StackList groups={GROUPS} />);

    const item = screen.getByRole("link", { name: "Knit" }).closest("li") as HTMLElement;
    expect(item).toHaveTextContent("Services and controllers");
  });

  it("links each tool to its site in a new tab", () => {
    render(<StackList groups={GROUPS} />);

    const link = screen.getByRole("link", { name: "Figma" });
    expect(link).toHaveAttribute("href", "https://example.com/figma");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("keeps the blocks compact: tight padding and descriptions inline with the tool name", () => {
    render(<StackList groups={GROUPS} />);

    const card = screen.getByRole("list", { name: "Networking" }).closest(".card") as HTMLElement;
    expect(card).toHaveClass("stack-card");
    expect(card.querySelector(".card-body")).toHaveClass("py-2", "px-3");

    const item = screen.getByRole("link", { name: "Knit" }).closest("li") as HTMLElement;
    const description = within(item).getByText("Services and controllers");
    expect(description).not.toHaveClass("d-block");
    expect(item.compareDocumentPosition(description) & Node.DOCUMENT_POSITION_CONTAINED_BY).toBeTruthy();
  });

  it("fits more blocks per row on wide screens", () => {
    const { container } = render(<StackList groups={GROUPS} />);

    expect(container.firstElementChild).toHaveClass("row-cols-xl-4");
  });

  it("reads defaults from site config", () => {
    render(<StackList />);

    const names = siteConfig.stack.flatMap((g) => g.tools.map((t) => t.name));
    expect(screen.getAllByRole("link").map((l) => l.textContent)).toEqual(names);
  });
});
