"use client";

import { Chip, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { ORDER_STATUSES } from "@/types/domain";

const COLOUR_TOKENS = [
  { token: "--color-canvas", label: "canvas", usage: "App background" },
  { token: "--color-surface", label: "surface", usage: "Cards, panels" },
  { token: "--color-surface-muted", label: "surface-muted", usage: "Table headers, hover" },
  { token: "--color-ink", label: "ink", usage: "Primary text" },
  { token: "--color-muted", label: "muted", usage: "Secondary text" },
  { token: "--color-subtle", label: "subtle", usage: "Tertiary text, hints" },
  { token: "--color-line", label: "line", usage: "Borders, dividers" },
];

const CHIP_TOKENS = [
  { token: "--color-chip-good-bg", label: "chip-good", usage: "Paid / positive delta" },
  { token: "--color-chip-info-bg", label: "chip-info", usage: "Shipped / informational" },
  { token: "--color-chip-warn-bg", label: "chip-warn", usage: "Pending / warnings" },
  { token: "--color-chip-bad-bg", label: "chip-bad", usage: "Refunded / errors" },
  { token: "--color-chip-neutral-bg", label: "chip-neutral", usage: "Cancelled / no change" },
];

const VIZ_TOKENS = [
  { token: "--color-viz-1", label: "viz-1", usage: "Primary data series / magnitude bars" },
  { token: "--color-viz-2", label: "viz-2", usage: "Second categorical series" },
  { token: "--color-viz-3", label: "viz-3", usage: "Third categorical series" },
  { token: "--color-viz-comparison", label: "viz-comparison", usage: "Comparison period (reference, not a series)" },
];

function Swatch({ token, label, usage }: { token: string; label: string; usage: string }) {
  return (
    <li className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="size-8 shrink-0 rounded-md border border-line"
        style={{ background: `var(${token})` }}
      />
      <span className="min-w-0">
        <code className="block text-xs text-ink">{label}</code>
        <span className="block text-xs text-subtle">{usage}</span>
      </span>
    </li>
  );
}

/**
 * A living reference for the design system.
 *
 * It exists for two practical reasons: it makes every token and component
 * variant reviewable in both themes without hunting through the app, and it
 * is where a regression in a shared primitive shows up first.
 */
export function SystemShowcase() {
  return (
    <div className="mx-auto flex max-w-[72rem] flex-col gap-5">
      <header>
        <h1 className="text-lg font-semibold text-ink">Design system</h1>
        <p className="mt-1 text-xs text-muted">
          Every colour in the product comes from these tokens. Switch the theme
          in the header to see both schemes — the dark values are a separately
          chosen set of steps, not an inversion.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Surface & text tokens" as="h2" />
          <CardBody>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {COLOUR_TOKENS.map((item) => (
                <Swatch key={item.token} {...item} />
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Chart tokens"
            description="Validated for colour-vision deficiency and surface contrast in both themes."
            as="h2"
          />
          <CardBody>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {VIZ_TOKENS.map((item) => (
                <Swatch key={item.token} {...item} />
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Buttons" as="h2" description="Four variants, two sizes, loading state." />
        <CardBody className="flex flex-wrap items-center gap-2">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" loading>Loading</Button>
          <Button variant="primary" disabled>Disabled</Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Status badges"
          as="h2"
          description="Each chip is an explicit background/foreground/border triplet, so the label clears 4.5:1 in both themes."
        />
        <CardBody className="flex flex-wrap items-center gap-2">
          {ORDER_STATUSES.map((status) => (
            <StatusBadge key={status} status={status} />
          ))}
          <Chip>Chip</Chip>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Status chip tokens" as="h2" />
        <CardBody>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CHIP_TOKENS.map((item) => (
              <Swatch key={item.token} {...item} />
            ))}
          </ul>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Loading" as="h3" />
          <CardBody className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Empty" as="h3" />
          <EmptyState title="Nothing here yet" description="Empty states explain the next action." />
        </Card>
        <Card>
          <CardHeader title="Error" as="h3" />
          <ErrorState message="Errors state what failed and offer a retry." onRetry={() => {}} />
        </Card>
      </div>
    </div>
  );
}
