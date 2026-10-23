# Andrew's personal website

A small static website: Home, About, Markdown blog, and the existing Prayer Partners rotation. Original SVG artwork and a silent overhead pit-stop intro; no video or animation downloads. Home is a standalone greeting with no blog-post previews. The close-up pit box uses a papaya-orange and charcoal McLaren car and matching crew, inspired by the supplied overhead references.

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

3. Run `npm install` once, then `npm run build`. Publish the contents of `dist/` on a static host. Directory `index.html` files give each post a stable URL. Custom hosting should serve `404.html` for missing pages.

Only trusted authors should edit Markdown: raw HTML is intentionally supported to preserve the original YouTube embed. No visitor-submitted Markdown is processed.

## Editing

- Layouts, navigation, About placeholder, social links: `scripts/build.mjs`.
- Home layout and pit-box colors: `src/pitbox.css`.
- Fonts and the About, Blog, and Prayer Partners layouts: `src/styles.css`.
- Hand-drawn circuit and car: `src/scene.mjs`.
- Intro timing, search, weekly rotation: `src/app.js`. The car and crew animate using requestAnimationFrame and SVG transforms, with no video dependency.
- Prayer roster: `content/prayer-partners.json`.

The intro plays once per browser session, only on Home. The front-jack mechanic steps below the exit path before the car accelerates out of the box. Visitors can Skip, press Escape, or Replay. Reduced-motion preferences bypass it. Content is present without JavaScript; the intro, blog filters, and prayer rotation need JavaScript. Font requests use Google Fonts, with system fallbacks.

## Migration notes

Eight original posts were imported from the deployed androochen.com bundle. Both posts sharing the original January 20, 2023 ID now have distinct slug URLs. Old `/#/post/:id` links redirect, preserving the old site's last-match behavior for the duplicated ID. `/#/about` and `/#/prayer-partners` also redirect.

The anime link is omitted. GitHub, LinkedIn, Goodreads, and IMDb links are retained. About uses clearly labeled placeholder text.

Prayer pairings retain the deployed site's roster order, circle rotation algorithm, fixed first member, and rotating third person. Rotation boundaries now consistently use Wednesday at 7 PM in America/Los_Angeles, including daylight-saving transitions. The expanded schedule shows the upcoming 22 weeks (the old site showed a fixed historical 22-week schedule). The visible week number retains the March 19, 2025 anchor.

This is a separate private deployment. The current androochen.com domain and hosting have not been changed. To replace the live site, deploy `dist/` to its existing hosting, or connect the domain to the new site and update DNS after making the site public.

## Validation

`npm run check` checks generated internal links, Markdown post counts, content omissions, and timezone-sensitive rotation boundaries. Browser QA covers the intro, skip/replay, navigation, blog search/filter/empty state, articles, and Prayer Partners expansion.
