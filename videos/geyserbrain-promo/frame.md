# GeyserBrain promo — frame design

## Concept

A WhatsApp phone UI on a deep teal stage. Conversation is the product demo;
the brand only takes the frame at the end.

## Palette

| Token        | Hex       | Use                                      |
| ------------ | --------- | ---------------------------------------- |
| `bg`         | `#0e3a43` | Full-bleed stage                         |
| `amber`      | `#e8a13a` | Accents, header status, CTA glow         |
| `hot`        | `#c8451f` | Highlight underline / end-card accent    |
| `phone`      | `#111b21` | Phone chrome / chat shell                |
| `chat-bg`    | `#0b141a` | Message list background                  |
| `in-bubble`  | `#202c33` | Customer (incoming) bubble               |
| `out-bubble` | `#005c4b` | GeyserBrain (outgoing) bubble            |
| `text`       | `#e9edef` | Primary chat text                        |
| `muted`      | `#8696a0` | Timestamps / secondary                   |

## Typography

- Chat UI: system UI stack (`-apple-system`, `Segoe UI`, sans-serif) — WhatsApp-clean.
- Brand wordmark + tagline: `Georgia, "Times New Roman", serif`.

## Composition

1. **Chat (0–13s)** — phone frame centered; bubbles enter on timing beats; first customer line types character-by-character.
2. **End card (13–15s)** — phone fades; GeyserBrain wordmark + tagline centered on teal with amber/hot accents.

## Motion

- Bubble pop: `autoAlpha` + slight `y` / `scale` (power3.out, ~0.35s).
- First message: TextPlugin typewriter ~10 cps.
- End card: fade + rise of wordmark, then tagline; short amber underline draw.
- No music / narration.
