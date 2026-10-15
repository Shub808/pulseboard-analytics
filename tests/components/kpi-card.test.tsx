import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { toKpi } from "@/lib/query/metrics";

describe("KpiCard", () => {
  it("shows the value, the delta and the previous-period figure", () => {
    render(
      <KpiCard
        label="Revenue"
        value="$120,000"
        kpi={toKpi(120_000_00, 100_000_00)}
        previousFormatted="$100,000"
      />,
    );
    expect(screen.getByText("Revenue")).toBeInTheDocument();
    expect(screen.getByText("$120,000")).toBeInTheDocument();
    expect(screen.getByText("+20.0%")).toBeInTheDocument();
    expect(screen.getByText("$100,000")).toBeInTheDocument();
  });

  it("renders n/a rather than Infinity when there is no prior period", () => {
    render(
      <KpiCard
        label="Revenue"
        value="$500"
        kpi={toKpi(50_000, 0)}
        previousFormatted="$0"
      />,
    );
    expect(screen.getByText("n/a")).toBeInTheDocument();
  });

  it("treats a falling refund rate as good news", () => {
    render(
      <KpiCard
        label="Refund rate"
        value="4.0%"
        kpi={toKpi(0.04, 0.08, { lowerIsBetter: true })}
        previousFormatted="8.0%"
      />,
    );
    const chip = screen.getByText("-50.0%").parentElement;
    // The value fell, but for refund rate that is an improvement, so the chip
    // must read as positive rather than as a regression.
    expect(chip).toHaveAttribute("data-direction", "up");
  });

  it("does not rely on colour alone to convey direction", () => {
    render(
      <KpiCard
        label="Orders"
        value="90"
        kpi={toKpi(90, 100)}
        previousFormatted="100"
      />,
    );
    // An arrow glyph plus screen-reader text accompany the colour.
    expect(screen.getByText("↓")).toBeInTheDocument();
    expect(
      screen.getByText(/compared with the previous period/i),
    ).toBeInTheDocument();
  });
});
