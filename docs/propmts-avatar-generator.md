# Pixel Avatar Prompt Guide

## Style DNA — Pixel Avatar System
Create a minimalist 8-bit pixel art avatar character that follows these constraints:

- **Style rules:** very large chunky pixels, 8-bit retro style, extremely simple shapes, thick black outline, flat colors only (no gradients/shading/lighting/texture), minimal facial features, centered composition, single character per frame.
- **Proportions:** full-body avatar with a large head (~50% of height), small body, short legs, simple rectangular arms, square hands, tiny feet, perfectly symmetrical front view.
- **Face:** two square eyes, a small horizontal mouth, no nose, neutral expression.
- **Background:** flat single color (solid or very soft gradient), no objects or environment, avatar centered.
- **Pixel structure:** sprite-like, blocky pixel edges, consistent grid reminiscent of retro NPC sprites.
- **Inspiration:** minimalist pixel avatars, retro game characters, simple sprite characters.

Use this DNA as the authoritative @prompt whenever we need to regenerate or randomize avatars so every variant shares the same visual genetics.

## Randomization Guide
When generating a fresh avatar with this style, randomize the character by filling the following slots while keeping proportions and simplicity intact:

```
Create a pixel art avatar using the STYLE DNA rules.

Randomize the character with the following attributes:

hair: {random hair style}
hair color: {random color}

hat: {random hat or none}

accessory: {random accessory}

shirt: {random clothing type}
shirt color: {random color}

pants: {random pants type}
pants color: {random color}

shoes: {random shoes type}
shoes color: {random color}

background color: {random flat pastel color}

Keep the exact same pixel art style defined in the STYLE DNA.
Keep the avatar centered.
Keep the proportions identical to the system avatar style.
Do not add extra details.
Maintain the minimalist pixel look.
```

## Base Style Prompt
```
minimalist pixel art character, full body, very large pixels, 8-bit style, flat colors, no shading, simple geometric shapes, retro video game npc style, square pixel grid, simple eyes and mouth, limited color palette, clean outline, centered character, solid pastel background, similar to classic pixel people sprite sheets, highly simplified design, chunky pixels, minimal detail
```
> Use this as the foundation for all agent avatars to guarantee the same resolution, proportions, and pixel size.

## Per-Agent Variations
### Claudio
```
minimalist pixel art character, full body, very large pixels, 8-bit style, flat colors, no shading, chunky pixels, retro npc style.
character: project manager developer, wearing a brown hat and glasses, blue shirt, holding a small clipboard, calm expression, organized tech leader vibe.
simple geometric shapes, limited color palette, simple eyes and mouth, centered character, solid muted blue background, sprite sheet style pixel character
```

### Codi
```
minimalist pixel art character, full body, very large pixels, 8-bit style, flat colors, no shading, chunky pixels, retro npc style.
character: frontend developer designer, colorful hair, wearing headphones, casual shirt, creative tech vibe.
simple geometric shapes, limited color palette, simple eyes and mouth, centered character, solid soft pink background, sprite sheet style pixel character
```

### Ninja
```
minimalist pixel art character, full body, very large pixels, 8-bit style, flat colors, no shading, chunky pixels, retro npc style.
character: backend developer ninja, dark hoodie or ninja outfit, mysterious tech hacker vibe.
simple geometric shapes, limited color palette, simple eyes and mouth, centered character, solid dark blue background, sprite sheet style pixel character
```

### Lucy
```
minimalist pixel art character, full body, very large pixels, 8-bit style, flat colors, no shading, chunky pixels, retro npc style.
character: operations manager woman, yellow jacket, confident posture, professional but casual.
simple geometric shapes, limited color palette, simple eyes and mouth, centered character, solid warm background, sprite sheet style pixel character
```

## Usage Notes
- Always start with the base style prompt, then append the agent-specific block.
- Keep the camera framing identical (full body, centered) for sprite-sheet consistency.
- Maintain single solid background colors to simplify compositing inside Mission Control.
- When generating new agents, clone this template and swap only the second paragraph (character section).
