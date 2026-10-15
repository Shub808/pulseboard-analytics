import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { OrdersTable } from "@/components/dashboard/orders-table";
import type { Order } from "@/types/domain";

const rows: Order[] = [
  {
    id: "ORD-000001",
    createdAt: "2026-06-01T09:30:00.000Z",
    customerName: "Ada Lovelace",
    customerEmail: "ada.lovelace@example.com",
    channel: "web",
    region: "emea",
    status: "paid",
    amountMinor: 125_00,
    itemCount: 2,
    currency: "USD",
  },
  {
    id: "ORD-000002",
    createdAt: "2026-06-02T11:00:00.000Z",
    customerName: "Bruno Bauer",
    customerEmail: "bruno.bauer@example.com",
    channel: "retail",
    region: "namer",
    status: "refunded",
    amountMinor: 40_50,
    itemCount: 1,
    currency: "USD",
  },
];

function setup(overrides: Partial<Parameters<typeof OrdersTable>[0]> = {}) {
  const onSort = vi.fn();
  const onSelect = vi.fn();
  render(
    <OrdersTable
      orders={rows}
      sort="createdAt"
      dir="desc"
      onSort={onSort}
      onSelect={onSelect}
      {...overrides}
    />,
  );
  return { onSort, onSelect };
}

describe("OrdersTable", () => {
  it("renders a row per order with formatted money", () => {
    setup();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("Bruno Bauer")).toBeInTheDocument();
    expect(screen.getByText("$125.00")).toBeInTheDocument();
    expect(screen.getByText("$40.50")).toBeInTheDocument();
  });

  it("maps internal enum values to human labels", () => {
    setup();
    expect(screen.getByText("Web storefront")).toBeInTheDocument();
    expect(screen.getByText("Retail POS")).toBeInTheDocument();
    expect(screen.getByText("Refunded")).toBeInTheDocument();
  });

  it("announces the active sort column via aria-sort", () => {
    setup({ sort: "amountMinor", dir: "asc" });
    expect(
      screen.getByRole("columnheader", { name: /amount/i }),
    ).toHaveAttribute("aria-sort", "ascending");
    expect(
      screen.getByRole("columnheader", { name: /customer/i }),
    ).toHaveAttribute("aria-sort", "none");
  });

  it("requests a sort change when a header button is activated", async () => {
    const user = userEvent.setup();
    const { onSort } = setup();
    await user.click(screen.getByRole("button", { name: /amount/i }));
    expect(onSort).toHaveBeenCalledWith("amountMinor");
  });

  it("is operable by keyboard: headers are focusable buttons", async () => {
    const user = userEvent.setup();
    const { onSort } = setup();
    screen.getByRole("button", { name: /status/i }).focus();
    await user.keyboard("{Enter}");
    expect(onSort).toHaveBeenCalledWith("status");
  });

  it("selects an order when its ID is activated", async () => {
    const user = userEvent.setup();
    const { onSelect } = setup();
    await user.click(screen.getByRole("button", { name: /ORD-000002/ }));
    expect(onSelect).toHaveBeenCalledWith(rows[1]);
  });

  it("marks the table busy during a background refetch", () => {
    setup({ busy: true });
    expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true");
  });
});
