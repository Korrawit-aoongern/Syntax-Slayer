import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GamePage from "./page";

const STORAGE_KEY = "syntax-slayer-session-v1";

const createSession = (overrides: Record<string, unknown> = {}) => ({
  view: "victory",
  level: 1,
  player: {
    hp: 10,
    attack: 2,
    focus: 0,
    consumables: [null, null, null],
    shield: 0,
    attackBoost: 0,
    attackBoostUntil: 0,
  },
  enemy: {
    hp: 0,
    attack: 2,
    ap: 0,
    apThreshold: 5,
  },
  cards: [],
  unlockedTerms: [],
  selectedUpgrade: null,
  ...overrides,
});

describe("GamePage victory loot flow", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("does not grant loot when choosing +2 ATK", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(createSession()));
    render(<GamePage />);

    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /resume/i }));

    await user.click(await screen.findByText("+2 ATK"));
    await user.click(screen.getByRole("button", { name: /next level/i }));

    await screen.findByText("Battle");
    await waitFor(() => {
      expect(screen.getAllByText("Empty")).toHaveLength(3);
    });
  });

  it("does not prompt discard when inventory has empty slots", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(createSession()));
    render(<GamePage />);

    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /resume/i }));

    await user.click(await screen.findByText("Minor Reveal"));

    expect(
      screen.queryByText(/Inventory Full - Discard One/i),
    ).not.toBeInTheDocument();
  });
});
