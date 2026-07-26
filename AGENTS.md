<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---
name: lesson-design
description: Pedagogical guidelines for building civics lesson slide decks. Apply whenever creating or editing lesson seed files (app/api/seed/civics-lesson-*/route.ts).
---

# Lesson Design — Civics (אזרחות), כיתה י

## Who you're teaching

10th graders, beginners — no prior civics knowledge assumed. They need a reason to care before they can absorb content. Start with something that feels real, surprising, or slightly absurd.

## Core philosophy

**The slide is a backdrop, not a script.** The teacher talks; the slide gives the eye somewhere to land. Default to less text — one sharp sentence is worth four vague ones. The student should be able to glance at the slide, understand the theme, and look back at the teacher. The exception: definition slides, worked examples, and step-by-step instructions that students need to copy or memorize — those can be dense.

## What makes a slide excellent

A great slide does one or more of these:
- **Provokes a question** before it answers one — lead with the tension, not the conclusion
- **Visual first** — if there's an image, it should be the first thing the eye hits, and it should make the student think or feel something
- **One idea** — if you're tempted to put two things on a slide, make two slides
- **A small surprise** — something slightly funny, weird, or unexpected (a meme-adjacent image, an absurd statistic, an emoji used incorrectly on purpose). This is not decoration; it's the thing that prevents the class from falling asleep

## Engagement techniques

Sprinkle these through the lesson, especially in the second third (where attention sags):
- Sudden contrast: a slide that's visually very different from the ones around it
- A poll or quiz question with one obviously wrong answer that's secretly tempting
- A real headline, quote, or number that feels almost too extreme to be true (but is)
- A "what do you think?" beat before the explanation — ask before you tell
- A slide where the title is a question and the body is blank, so the teacher can cold-call before revealing

## Slide type guidelines

| Type | Default length | Use it for |
|---|---|---|
| `lesson-topic` | Title + image, occasionally 1–2 lines | **Slide 1 only.** The lesson's title screen — nothing more. |
| `media-only` | No text at all | Usually slide 2, right after `lesson-topic`. Just an image/video/audio — no eyebrow, no title, no body. Media is often added by hand after the seed runs; leave `image_url: null` unless a specific URL was requested. |
| `opinion` | Question + 4 short options, sometimes 2 questions | "מה דעתכם?" — opinion or prediction before the lesson teaches the answer. No `correct_index`. |
| `alertness-check` | 1–2 easy questions, 4 options each | Quick check that students followed the last slide or two — mark `correct_index`. Not a deep-understanding test, just "were you paying attention." |
| `definitions` | Can be long | Terms students must copy into their notebook. See below — the on-screen title is fixed, not yours to write. |
| `concept-grid` | One sentence per item, max | A set of parallel concepts (conditions, principles, branches, rights) — icon + short title + one sentence each. See below. |
| `study` | Structured, not prose — see below | The core teaching content: explaining a concept beyond its bare definition. No type label or title shown on screen — maximize space for content. One concept per slide. |
| `practice` | Full, verbatim exam text | Real bagrut questions, reproduced exactly, tagged by question type. See below. |
| `brain-break` | None — fixed | "מנוחמוח." One per lesson, roughly in the middle. Nothing to write; see below. |
| `enrichment` | 2–3 cards, punchy | Going deeper for curious students; optional |
| `homework` | Numbered list | Clear tasks; each item one sentence |
| `feedback` | One question, star rating | End of lesson only |

**Default to terse.** Every type above except `definitions`, `opinion`, `alertness-check`, and `practice` should read as a backdrop, not an essay. When a slide is *about* a list of parallel concepts (e.g. "the five conditions for statehood," "the three branches of government"), reach for `concept-grid` instead of a wall of bulleted body text — it forces one sentence per idea and gives the eye an icon to land on.

### `lesson-topic` and `media-only` — the opening two slides

`lesson-topic` is always slide 1: a title, an image (often `image_position: "background"`), and — rarely — one or two short sentences under the title. Nothing else; don't put the lesson's hook argument here, just the subject.

`media-only` typically comes right after: no `title`, no `eyebrow`, no `body` — just `image_url`/`youtube_url`/`audio_url`. The teacher usually fills this in by hand after seeding, or asks for a specific piece of media on a specific slide — don't invent `image_url` values for it speculatively.

### `study` — the teaching slide

This is where you actually explain the material beyond what's in the notebook definitions: elaboration, mechanism, examples, nuance. No slide-type label and no title render on screen, so every pixel is content. Prefer structure over paragraphs:
- Use `questions` (icon + short title + one sentence, same shape as `concept-grid`) whenever the explanation breaks into parallel parts — reuses the same `layout: "grid" | "list"` mechanism.
- Use `body` only for a short paragraph that doesn't decompose into parts; keep it a few lines, not a wall of text.
- The two can combine: a one-line `body` framing sentence, then an icon breakdown via `questions`.
- One concept per `study` slide. If you're covering two concepts, that's two slides.

### `practice` — real bagrut questions

Full exam questions, reproduced **exactly** — including the entire event/scenario passage where the original has one. Never paraphrase, shorten, or drop a sentence from the source text. Each item in `questions` needs `q.tag` set to one of: `"שאלת אירוע"`, `"שאלת אירוע כפול"`, `"שאלת ידע"`, `"שאלת עמדה"` — matching the real question type. `q.text` carries the full question (scenario + prompt, with `\n` between paragraphs); leave `q.options` empty for open-ended bagrut questions, or fill it in only if the original question is genuinely multiple-choice.

### `brain-break` — מנוחמוח

Always renders as a fixed, empty "מנוחמוח" slide with a big animation — there's no title or body to write. Just add one per lesson (roughly the middle third; the teacher will move it if needed) with:
```
animation: { name: "giraffe", delay: 0, position: "big-center", loop: true }
```
`giraffe` (ג'ירפה מתמתחת — stretching) is the closest match in the animation registry; there's no meditating-giraffe asset. Check `lib/lessons/animations.ts` before using any other animation name.

### `concept-grid` — icon cards for parallel concepts

Use `questions` to carry the items (not `body`): `q.text` = short title, `q.options[0]` = one sentence (no more), `q.icon` = an icon key (see vocabulary below). Two layouts, set via the slide's `layout` field:
- `layout: "grid"` (default) — for an overview of 3–5 parallel items side by side, e.g. the five conditions of statehood.
- `layout: "list"` — for a vertical breakdown of one concept's sub-parts, e.g. the four dimensions of "territory" (land / sea / air / subsoil).

**Icon vocabulary** (`lib/lessons/icons.tsx`, backed by lucide-react — pick the closest match, don't invent new keys without adding them there first):

| Key | Use for |
|---|---|
| `crown` | sovereignty, supreme authority |
| `scale` | courts, law, equality |
| `landmark` | government institutions |
| `users` | population, the public, a people |
| `map` | territory |
| `handshake` | international recognition, agreements |
| `globe` | international, the UN, the world |
| `shield` | security, defense |
| `vote` | elections |
| `gavel` | legislation, rulings |
| `book` | education |
| `document` | law, official document |
| `flag` | state, nation |
| `mountain` / `waves` / `plane` / `layers` | land / sea / air / subsoil domains |
| `building` | a public institution |
| `newspaper` | media, press |
| `megaphone` | free speech |
| `calendar` | calendar, dates |
| `language` | language |
| `scroll` | a declaration or founding document |
| `quote` | a testimony or quotation |
| `identity` | identity, citizenship |
| `lock` | a restriction or prohibition |
| `alert` | emergency, crisis |
| `food` | kashrut, dietary law |
| `family` | marriage, divorce, personal status |

### `definitions` — notebook page

On the projected/live view this always renders as a fixed instruction — **"להעתיק למחברת!"** with a notebook/pen icon — never the slide's `title`. Still write a real, descriptive `title` (it's what shows in the editor sidebar and the printed handout); just don't expect students to see it on screen. `eyebrow` is the small tab label — leave it blank to get the default ("מושגים למבחן"), or set a topic-specific tag (e.g. "תחום א׳: חקיקה") if the lesson has multiple definition slides that need telling apart.

## Lesson flow

- **Slide 1**: `lesson-topic` — title + image. Nothing more.
- **Slide 2** (usually): `media-only` — a hook image/video, often filled in by hand later.
- **Early on**: `opinion` — get every student to commit to a position before they know the answer.
- **Middle third**: The peak. This is where the hardest concept goes, with the most support: `definitions`, `study`, `alertness-check`. Put the `brain-break` slide somewhere in here.
- **Practice**: `practice` slides with real bagrut questions, once the underlying concept has been taught.
- **Last slides**: Summary, then `homework` or `feedback`. End with something that makes the lesson feel finished, not truncated.

## Body text rules

- No bullet points by default — use `\n` line breaks to separate ideas within a paragraph instead
- Bold (`**term**`) only on the first introduction of a key term, or to highlight the single most important phrase on the slide
- `> blockquote` for bagrut tips, exam notes, or teacher asides
- `---` horizontal rule to separate distinct sections within a long slide
- Tables only for genuine comparisons (not lists that happen to have two columns)

## Image guidance

When writing a slide that would benefit from an image, add an `image_url` field with a descriptive comment about what kind of image would work. Even if no URL is available yet, write: `image_url: null, // suggested: [description of ideal image]` in a comment so it's easy to fill in later.

---
name: frontend-design
description: Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one. Helps with aesthetic direction, typography, and making choices that don't read as templated defaults.
---

# Frontend Design

Approach this as the design lead at a small studio known for giving every client a visual identity that could not be mistaken for anyone else's. This client has already rejected proposals that felt templated, and is paying for a distinctive point of view: make deliberate, opinionated choices about palette, typography, and layout that are specific to this brief, and take one real aesthetic risk you can justify.

## Ground it in the subject

If the brief does not pin down what the product or subject is, pin it yourself before designing: name one concrete subject, its audience, and the page's single job, and state your choice. If there's any information in your memory about the human's preferences, context about what they're building, or designs you've made before – use that as a hint. The subject's own world, its materials, instruments, artifacts, and vernacular, is where distinctive choices come from. Build with the brief's real content and subject matter throughout.

## Design principles

For web designs, the hero is a thesis. Open with the most characteristic thing in the subject's world, in whatever form makes sense for it: a headline, an image, an animation, a live demo, an interactive moment. Be deliberate with your choice: a big number with a small label, supporting stats, and a gradient accent is the template answer, only use if that's truly the best option.

Typography carries the personality of the page. Pair the display and body faces deliberately, not the same families you would reach for on any other project, and set a clear type scale with intentional weights, widths, and spacing. Make the type treatment itself a memorable part of the design, not a neutral delivery vehicle for the content.

Structure is information. Structural devices, numbering, eyebrows, dividers, labels, should encode something true about the content, not decorate it. Many generic designs use numbered markers (01 / 02 / 03), but that's only appropriate if the content actually is a sequence - like a real process or a typed timeline where order carries information the reader needs. Question if choices like numbered markers actually make sense before incorporating them.

Leverage motion deliberately. Think about where and if animation can serve the subject: a page-load sequence, a scroll-triggered reveal, hover micro-interactions, ambient atmosphere. An orchestrated moment usually lands harder than scattered effects; choose what the direction calls for. However, sometimes less is more, and extra animation contributes to the feeling that the design is AI-generated.

Match complexity to the vision. Maximalist directions need elaborate execution; minimal directions need precision in spacing, type, and detail. Elegance is executing the chosen vision well.

Consider written content carefully. Often a design brief may not contain real content, and it's up to you to come up with copy. Copy can make a design feel as templated as the design itself. See the below section on writing for more guidance.

## Process: brainstorm, explore, plan, critique, build, critique again

For calibration: AI-generated design right now clusters around three looks: (1) a warm cream background (near #F4F1EA) with a high-contrast serif display and a terracotta or warm-clay accent (often near #D97757 — Anthropic's own Claude-interaction accent, so on a user's brief it reads as a tell); (2) a near-black background with a single bright acid-green or vermilion accent; (3) a broadsheet-style layout with hairline rules, zero border-radius, and dense newspaper-like columns. All three are legitimate for some briefs, but they are defaults rather than choices, and they appear regardless of subject. Where the brief pins down a visual direction, follow it exactly — the brief's own words always win, including when it asks for one of these looks. Where it leaves an axis free, don't spend that freedom on one of these defaults.

Work in two passes. First, brainstorm a short design plan based on the human's design brief: create a compact token system with color, type, layout, and signature. Color: describe the palette as 4–6 named hex values. Type: the typefaces for 2+ roles (a characterful display face that's used with restraint, a complementary body face, and a utility face for captions or data if needed). Layout: a layout concept, using one-sentence prose descriptions and ASCII wireframes to ideate and compare. Signature: the single unique element this page will be remembered by that embodies the brief in an appropriate way.

Then review that plan against the brief before building: if any part of it reads like the generic default you would produce for any similar page rather than a choice made for this specific brief — revise that part, say what you changed and why. Only after you've confirmed the relative uniqueness of your design plan should you start to write the code, following the revised plan exactly and deriving every color and type decision from it.

## Restraint and self-critique

Spend your boldness in one place. Let the signature element be the one memorable thing, keep everything around it quiet and disciplined, and cut any decoration that does not serve the brief. Build to a quality floor without announcing it: responsive down to mobile, visible keyboard focus, reduced motion respected.

## More on writing in design

Words appear in a design for one reason: to make it easier to understand, and therefore easier to use. Write from the end user's side of the screen. Name things by what people control and recognize, never by how the system is built. Use active voice as default. A control should say exactly what happens when it's used. Treat failure and emptiness as moments for direction, not mood.
