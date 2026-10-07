# Local interface typography

The two variable WOFF2 files are subsets of **Noto Sans SC**, distributed under
the SIL Open Font License in `OFL.txt`. `Huinong Sans` is only the CSS family alias.
The original font retains its names, copyright and license metadata.

- Source: https://github.com/google/fonts/tree/main/ofl/notosanssc
- Downloaded 2026-10-08: `NotoSansSC[wght].ttf`
- SHA-256: `a3041811a78c361b1de50f953c805e0244951c21c5bd412f7232ef0d899af0da`
- `interface`: characters used in TypeScript/TSX and Latin/punctuation, preloaded.
- `common`: remaining GB2312 characters, fetched only for matching user content.
- Uncovered uncommon characters use the native CJK fallback.
- Weight axis 100–900 is preserved; the interface uses actual medium/semibold
  outlines rather than synthesized system-font weights.

To regenerate after introducing new interface text, install `fonttools[woff]`
and run `python scripts/build-ui-font.py /path/to/NotoSansSC.ttf`.
Keep both the license and this attribution with redistributed fonts.
There are no requests to third-party font services at runtime.
