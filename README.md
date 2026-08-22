# Create T3 App

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## Pages

- `/` — the landing page: a sketchbook of nine plates, one for each part of the
  board. Drag a page to turn it, drag the magnifying glass across it to read the
  small print, or pick a plate from the index.
- `/board` — the board itself.

### Sketchbook artwork

The plates and the botanical trim in `public/sketchbook/` are drawn by a script
rather than exported from a design tool:

```bash
node scripts/generate-sketchbook.mjs
```

The output is deterministic, so re-running it after an edit produces a clean
diff. The paper geometry lives in two places that have to agree: `PAD_X`/`PAD_Y`
in the script and `PAPER` in `src/views/landing/sketchbookEngine.ts` — if they
drift, the turning page tears away from the edge of the sheet.

## What's next? How do I make an app with this?

We try to keep this project as simple as possible, so you can start with just the scaffolding we set up for you, and add additional things later when they become necessary.

If you are not familiar with the different technologies used in this project, please refer to the respective docs. If you still are in the wind, please join our [Discord](https://t3.gg/discord) and ask for help.

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.
