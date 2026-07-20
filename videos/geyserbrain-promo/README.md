# GeyserBrain promo (HyperFrames)

15s WhatsApp-style promo rendered with [HyperFrames](https://github.com/heygen-com/hyperframes).

## Outputs (site)

Copied into the Vite `public/` tree:

| File | Size | Use |
| ---- | ---- | --- |
| `/videos/geyserbrain-promo-portrait.mp4` | 1080×1920 | TikTok / Reels / Stories |
| `/videos/geyserbrain-promo-landscape.mp4` | 1920×1080 | Website hero |

## Commands

```bash
cd videos/geyserbrain-promo
npm run check
npx hyperframes render --quality high --output ../../public/videos/geyserbrain-promo-portrait.mp4
npx hyperframes render --composition compositions/landscape.html --quality high --output ../../public/videos/geyserbrain-promo-landscape.mp4
```

Requires Node.js 22+ and FFmpeg. Agent skills live in `/.agents/skills/` (HyperFrames core set + `general-video`).
