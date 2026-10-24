# Andrew's personal website

A small static website: Home, About, Markdown blog, the existing Prayer Partners rotation, and Hetherau Crossing. Original SVG artwork and a silent overhead pit-stop intro; no video or animation downloads. Home is a standalone greeting with no blog-post previews. The close-up pit box uses a papaya-orange and charcoal McLaren car and matching crew, inspired by the supplied overhead references.

## Writing a post

1. Create `content/posts/YYYY-MM-DD-your-post-title.md`.
2. Add frontmatter using quoted JSON strings:

```markdown
---
title: "A new note"
date: "2026-10-22"
author: "androo"
---

Write Markdown here. Links, images, lists, tables, code blocks, and HTML embeds are supported.
```

3. Commit the Markdown file to `main` in `AndrooTheChen/androo-site-2`. GitHub Actions installs dependencies, builds and checks the site, and publishes `dist/` to GitHub Pages automatically. Directory `index.html` files give each post a stable URL. The GitHub Pages settings use GitHub Actions as the publishing source and `androochen.com` as the custom domain. Local preview: run `npm ci` and `npm ci --prefix lantern_lane`, then `npm run build`, and serve `dist/` with any static server.

Only trusted authors should edit Markdown: raw HTML is intentionally supported to preserve the original YouTube embed. No visitor-submitted Markdown is processed.

## Editing

- Layouts, navigation, About placeholder, social links: `scripts/build.mjs`.
- Home layout and pit-box colors: `src/pitbox.css`.
- Fonts and the About, Blog, and Prayer Partners layouts: `src/styles.css`.
- Hand-drawn circuit and car: `src/scene.mjs`.
- Intro timing, search, weekly rotation: `src/app.js`. The car and crew animate using requestAnimationFrame and SVG transforms, with no video dependency.
- Prayer roster: `content/prayer-partners.json`.

The intro automatically plays on every Home page load, including reloads and return visits. The greeting stays behind the SVG so the car drives over and covers it. It changes once to “I’m Andrew” while the car is parked over it, then is revealed as the car drives away. Every page uses the same navy, cream, and papaya theme. GitHub and LinkedIn are available on About only. Home, About, Blog, and Prayer Partners stay visible in the top navigation, including on mobile and while the intro plays. There is no footer. The landing page uses one persistent SVG, so the pit box stays in the same place before, during, and after the intro. Skip intro and Replay intro occupy the same control position at the bottom. The car carries number 24; an accessible label replaces the SVG title to avoid a hover tooltip. The front-jack mechanic steps below the exit path before the car accelerates out of the box. Visitors can Skip, press Escape, or Replay. Reduced-motion preferences bypass it. Content is present without JavaScript; the intro, blog filters, and prayer rotation need JavaScript. Font requests use Google Fonts, with system fallbacks.

## Migration notes

Eight original posts were imported from the deployed androochen.com bundle. Both posts sharing the original January 20, 2023 ID now have distinct slug URLs. Old `/#/post/:id` links redirect, preserving the old site's last-match behavior for the duplicated ID. `/#/about` and `/#/prayer-partners` also redirect.

Prayer pairings retain the deployed site's roster order, circle rotation algorithm, fixed first member, and rotating third person. Rotation boundaries now consistently use Wednesday at 7 PM in America/Los_Angeles, including daylight-saving transitions. The expanded schedule shows the upcoming 22 weeks (the old site showed a fixed historical 22-week schedule). The visible week number retains the March 19, 2025 anchor.

The production site is hosted from `AndrooTheChen/androo-site-2` on GitHub Pages. The original `androo-site` application source is preserved. Its custom-domain association moves to this repository; its old application files are not replaced. The private Sites preview remains separate and is rebuilt through ChatGPT when requested.

## Validation

`npm run check` checks generated internal links, Markdown post counts, content omissions, and timezone-sensitive rotation boundaries. Browser QA covers the intro, skip/replay, navigation, blog search/filter/empty state, articles, and Prayer Partners expansion.

## Hetherau Crossing

The navigation link opens the full browser game in a new tab at `/lantern_lane/`. Its own source, procedural assets, character asset folder, locked dependencies, tests and documentation are isolated in [`lantern_lane/`](lantern_lane/README.md). The site does not iframe or depend on the private ChatGPT demo.

- Game development: `npm run game:dev` (after installing both dependency sets above).
- Full production build: `npm run build` builds both projects and places the game in `dist/lantern_lane/`.
- Validation: `npm run check` checks the website and game rules/persistence/navigation.
- Character model handoff: [`lantern_lane/docs/character-integration.md`](lantern_lane/docs/character-integration.md).

Push to `main` to run the existing Pages workflow, which installs, builds, checks, and deploys both together. Progress is stored in each visitor’s browser. Export/import a save to transfer progress from the original demo origin.

## Raspberry Pi health

The **Pi Health** navigation link opens the private dashboard directly using your Tailscale identity, with no endpoint to paste. The public `/health/` page also provides a preconfigured link. This is a read-only dashboard for host CPU, RAM, temperature, uptime, disks, Nextcloud and Afterglow. Live data comes directly from a private, identity-protected Tailscale endpoint. The public static site contains no readings or credentials. See [setup, security and operating notes](monitoring/README.md).
