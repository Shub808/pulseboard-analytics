import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Pagination } from "@/components/dashboard/pagination";

function page(overrides: Partial<{ page: number; pageSize: number; total: number; pageCount: number }> = {}) {
  const base = { rows: [], total: 57, page: 1, pageSize: 25, pageCount: 3 };
  return { ...base, ...overrides };
}

describe("Pagination", () => {
  it("reports the visible row range", () => {
    render(
      <Pagination page={page()} onPageChange={vi.fn()} onPageSizeChange={vi.fn()} />,
    );
    expect(screen.getByText("1–25 of 57")).toBeInTheDocument();
  });

  it("clamps the upper bound on the final page", () => {
    render(
      <Pagination page={page({ page: 3 })} onPageChange={vi.fn()} onPageSizeChange={vi.fn()} />,
    );
    expect(screen.getByText("51–57 of 57")).toBeInTheDocument();
  });

  it("disables Prev on the first page and Next on the last", () => {
    const { unmount } = render(
      <Pagination page={page()} onPageChange={vi.fn()} onPageSizeChange={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: "Prev page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeEnabled();
    unmount();

    render(
      <Pagination page={page({ page: 3 })} onPageChange={vi.fn()} onPageSizeChange={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  it("shows an explicit message when nothing matches", () => {
    render(
      <Pagination
        page={page({ total: 0, pageCount: 1 })}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );
    expect(screen.getByText("No matching orders")).toBeInTheDocument();
  });

  it("emits page and page-size changes", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();
    render(
      <Pagination
        page={page({ page: 2 })}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
    await user.click(screen.getByRole("button", { name: "Prev page" }));
    expect(onPageChange).toHaveBeenCalledWith(1);

    await user.selectOptions(screen.getByRole("combobox", { name: /rows/i }), "50");
    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });
});
