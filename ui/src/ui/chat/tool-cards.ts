import { html, nothing } from "lit";
import type { ToolCard } from "../types/chat-types.ts";
import { icons } from "../icons.ts";
import { formatToolDetail, resolveToolDisplay } from "../tool-display.ts";
import { TOOL_INLINE_THRESHOLD } from "./constants.ts";
import { extractTextCached } from "./message-extract.ts";
import { isToolResultMessage } from "./message-normalizer.ts";
import { formatToolOutputForSidebar, getTruncatedPreview } from "./tool-helpers.ts";

type ToolCardSummary = {
  count: number;
  preview: string | null;
  hasOutput: boolean;
};

export function extractToolCards(message: unknown): ToolCard[] {
  const m = message as Record<string, unknown>;
  const content = normalizeContent(m.content);
  const cards: ToolCard[] = [];

  for (const item of content) {
    const kind = (typeof item.type === "string" ? item.type : "").toLowerCase();
    const isToolCall =
      ["toolcall", "tool_call", "tooluse", "tool_use"].includes(kind) ||
      (typeof item.name === "string" && item.arguments != null);
    if (isToolCall) {
      cards.push({
        kind: "call",
        name: (item.name as string) ?? "tool",
        args: coerceArgs(item.arguments ?? item.args),
      });
    }
  }

  for (const item of content) {
    const kind = (typeof item.type === "string" ? item.type : "").toLowerCase();
    if (kind !== "toolresult" && kind !== "tool_result") {
      continue;
    }
    const text = extractToolText(item);
    const name = typeof item.name === "string" ? item.name : "tool";
    cards.push({ kind: "result", name, text });
  }

  if (isToolResultMessage(message) && !cards.some((card) => card.kind === "result")) {
    const name =
      (typeof m.toolName === "string" && m.toolName) ||
      (typeof m.tool_name === "string" && m.tool_name) ||
      "tool";
    const text = extractTextCached(message) ?? undefined;
    cards.push({ kind: "result", name, text });
  }

  return cards;
}

export function renderToolCardSidebar(card: ToolCard, onOpenSidebar?: (content: string) => void) {
  const display = resolveToolDisplay({ name: card.name, args: card.args });
  const detail = formatToolDetail(display);
  const hasText = Boolean(card.text?.trim());

  const canClick = Boolean(onOpenSidebar);
  const handleClick = canClick
    ? () => {
        if (hasText) {
          onOpenSidebar!(formatToolOutputForSidebar(card.text!));
          return;
        }
        const info = `## ${display.label}\n\n${
          detail ? `**Command:** \`${detail}\`\n\n` : ""
        }*No output — tool completed successfully.*`;
        onOpenSidebar!(info);
      }
    : undefined;

  const isShort = hasText && (card.text?.length ?? 0) <= TOOL_INLINE_THRESHOLD;
  const showCollapsed = hasText && !isShort;
  const showInline = hasText && isShort;
  const isEmpty = !hasText;

  return html`
    <div
      class="chat-tool-card ${canClick ? "chat-tool-card--clickable" : ""}"
      @click=${handleClick}
      role=${canClick ? "button" : nothing}
      tabindex=${canClick ? "0" : nothing}
      @keydown=${
        canClick
          ? (e: KeyboardEvent) => {
              if (e.key !== "Enter" && e.key !== " ") {
                return;
              }
              e.preventDefault();
              handleClick?.();
            }
          : nothing
      }
    >
      <div class="chat-tool-card__header">
        <div class="chat-tool-card__title">
          <span class="chat-tool-card__icon">${icons[display.icon]}</span>
          <span>${display.label}</span>
        </div>
        ${
          canClick
            ? html`<span class="chat-tool-card__action">${hasText ? "View" : ""} ${icons.check}</span>`
            : nothing
        }
        ${isEmpty && !canClick ? html`<span class="chat-tool-card__status">${icons.check}</span>` : nothing}
      </div>
      ${detail ? html`<div class="chat-tool-card__detail">${detail}</div>` : nothing}
      ${
        isEmpty
          ? html`
              <div class="chat-tool-card__status-text muted">Completed</div>
            `
          : nothing
      }
      ${
        showCollapsed
          ? html`<div class="chat-tool-card__preview mono">${getTruncatedPreview(card.text!)}</div>`
          : nothing
      }
      ${showInline ? html`<div class="chat-tool-card__inline mono">${card.text}</div>` : nothing}
    </div>
  `;
}

export function renderToolCardStack(cards: ToolCard[], onOpenSidebar?: (content: string) => void) {
  if (cards.length === 0) {
    return nothing;
  }

  const summary = summarizeToolCards(cards);
  const title = summary.count === 1 ? "Tool call" : `Tool calls (${summary.count})`;

  return html`
    <details class="chat-tool-stack">
      <summary class="chat-tool-stack__summary">
        <span class="chat-tool-stack__title">
          <span class="chat-tool-stack__icon">${icons.wrench}</span>
          <span>${title}</span>
        </span>
        ${summary.preview ? html`<span class="chat-tool-stack__preview">${summary.preview}</span>` : nothing}
        <span class="chat-tool-stack__meta">
          ${summary.hasOutput ? "Output ready" : "No output"}
        </span>
        <span class="chat-tool-stack__chevron">${icons.arrowDown}</span>
      </summary>
      <div class="chat-tool-stack__body">
        ${cards.map((card) => renderToolRow(card, onOpenSidebar))}
      </div>
    </details>
  `;
}

function renderToolRow(card: ToolCard, onOpenSidebar?: (content: string) => void) {
  const display = resolveToolDisplay({ name: card.name, args: card.args });
  const detail = formatToolDetail(display);
  const hasText = Boolean(card.text?.trim());
  const canClick = Boolean(onOpenSidebar);

  const handleClick = canClick
    ? () => {
        if (hasText) {
          onOpenSidebar!(formatToolOutputForSidebar(card.text!));
          return;
        }
        const info = `## ${display.label}\n\n${
          detail ? `**Command:** \`${detail}\`\n\n` : ""
        }*No output - tool completed successfully.*`;
        onOpenSidebar!(info);
      }
    : undefined;

  const preview = hasText ? getTruncatedPreview(card.text!) : null;
  const statusLabel = card.kind === "call" ? "Called" : "Completed";

  return html`
    <div
      class="chat-tool-row ${canClick ? "chat-tool-row--clickable" : ""}"
      @click=${handleClick}
      role=${canClick ? "button" : nothing}
      tabindex=${canClick ? "0" : nothing}
      @keydown=${
        canClick
          ? (e: KeyboardEvent) => {
              if (e.key !== "Enter" && e.key !== " ") {
                return;
              }
              e.preventDefault();
              handleClick?.();
            }
          : nothing
      }
    >
      <div class="chat-tool-row__header">
        <span class="chat-tool-row__title">
          <span class="chat-tool-row__icon">${icons[display.icon]}</span>
          <span class="chat-tool-row__label">${display.label}</span>
        </span>
        ${detail ? html`<span class="chat-tool-row__detail">${detail}</span>` : nothing}
        <span class="chat-tool-row__status">${statusLabel}</span>
      </div>
      ${preview ? html`<div class="chat-tool-row__preview mono">${preview}</div>` : nothing}
    </div>
  `;
}

function summarizeToolCards(cards: ToolCard[]): ToolCardSummary {
  const callCount = cards.filter((card) => card.kind === "call").length;
  const resultCount = cards.filter((card) => card.kind === "result").length;
  const count = callCount > 0 ? callCount : resultCount > 0 ? resultCount : cards.length;
  const hasOutput = cards.some((card) => Boolean(card.text?.trim()));

  const seen = new Set<string>();
  const labels: string[] = [];
  for (const card of cards) {
    const label = resolveToolDisplay({ name: card.name, args: card.args }).label;
    if (seen.has(label)) {
      continue;
    }
    seen.add(label);
    labels.push(label);
  }
  const preview = formatToolPreview(labels);

  return { count, preview, hasOutput };
}

function formatToolPreview(labels: string[]): string | null {
  if (labels.length === 0) {
    return null;
  }
  if (labels.length <= 2) {
    return labels.join(", ");
  }
  return `${labels[0]}, ${labels[1]} +${labels.length - 2}`;
}

function normalizeContent(content: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(content)) {
    return [];
  }
  return content.filter(Boolean) as Array<Record<string, unknown>>;
}

function coerceArgs(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return value;
  }
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return value;
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function extractToolText(item: Record<string, unknown>): string | undefined {
  if (typeof item.text === "string") {
    return item.text;
  }
  if (typeof item.content === "string") {
    return item.content;
  }
  return undefined;
}
