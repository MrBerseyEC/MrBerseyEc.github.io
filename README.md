# HTB's Resources

Interactive Computer Science demos for GCSE and A-Level, published at <https://mrberseyec.github.io/>.

The site is built with [Jekyll](https://jekyllrb.com/), which GitHub Pages runs automatically on every push.

## Adding a demo

1. Create the page, for example `gcse/6/functions.html`. Start it with front matter, then write only the page's own content:

   ```html
   ---
   layout: demo
   title: "Functions"
   spec: "EDEXCEL GCSE · TOPIC 6"
   python: true
   ---
   <p class="lede">…</p>
   ```

   `python: true` loads the runnable Python editors, `logic: true` loads the Boolean expression helpers and `algo: true` loads the step-through player and Big O charts used by the 2.3 algorithm demos (see the comment at the top of `assets/algo.js`), `blocks: true` loads the MakeCode Arcade-style block editor and games console (see the comment at the top of `assets/blocks.js`). Add `heading:` if the main heading should differ from the title.

2. Add one line for it to `_data/courses.yml`. The home page and the links at the top of every demo in that topic update themselves.

The shared page shell is `_layouts/demo.html`. Shared styles and scripts are in `assets/`.

## Hiding a demo

Add `published: false` to the page's front matter. The page is not built, and it disappears from the home page and from the links at the top of the other demos in its topic. Leave its line in `_data/courses.yml`. Remove `published: false` to publish it.

## Previewing locally

Opening the `.html` files directly no longer shows the finished pages, because Jekyll assembles them.

```sh
bundle install            # first time only
bundle exec jekyll serve  # then open http://localhost:4000
```

To preview the hidden demos as well, run `bundle exec jekyll serve --unpublished`.

## Linking to a demo on a page

Every demo block on a page has an `id`, so a page can be opened at a particular block, for example `/a-level/2.3/bubble-sort.html#big-o`. Hover over a block's heading and click the `#` to get its link. If the block is inside a hidden tab, that tab opens. The ids are the heading text in lower case with hyphens. Give a block its own `id="…"` where you want a shorter one. The Python-style ids already used by a page's script are left alone.

## The glossary

`glossary.html` is built from `_data/glossary.yml`, one line per term:

```yaml
- { t: "Bubble sort", d: "Sorts by comparing neighbours…", u: "/a-level/2.3/bubble-sort.html#how-it-works" }
```

- The level (F, GCSE or A-Level) is taken from the course in `_data/courses.yml` that holds the page, so there is nothing to set. The same term may appear once for each level and is grouped on the page.
- A term whose page has `published: false` is still listed, shown as "demo not published yet" with no link. It links up automatically when the page is published.
- Add the new demo's terms to `_data/glossary.yml` when you add the demo.

## Algorithm player extras

- **Keys:** Space plays or pauses, ← and → step back and forward, R resets. They are ignored while typing in a field.
- **Scrubber:** the Step slider jumps to any step.
- **Remembered:** speed, list type, number of items and the code language (per page for the list settings) are kept in `localStorage` under `htb-settings`. Quiz answers are kept per page and quiz, and cleared by "Reset questions".
- **Share links:** "Copy link" gives `page.html#try-it?d=8,3,5,1&t=7&s=12` (the list, the search target and the step). Opening it restores that exact state. Invalid values are ignored.
