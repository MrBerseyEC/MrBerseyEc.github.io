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

   `python: true` loads the runnable Python editors, `logic: true` loads the Boolean expression helpers and `blocks: true` loads the MakeCode Arcade-style block editor and games console (see the comment at the top of `assets/blocks.js`). Add `heading:` if the main heading should differ from the title.

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
