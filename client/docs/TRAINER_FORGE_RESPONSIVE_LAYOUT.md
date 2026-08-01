# Trainer Forge Responsive Layout

## Scrolling ownership

Trainer Forge is a fixed `100dvh` overlay and applies scroll lock to the document body while mounted.

- The page and application root do not scroll.
- The left Build Navigator scrolls internally when its preset/body-map content exceeds available height.
- The right inspector scrolls internally.
- Preview mode strips and category strips may scroll horizontally inside their own bounded rails.
- Saved Looks, Randomize, and Help scroll inside their drawer or bottom sheet.
- The live preview and bottom confirmation bar remain outside inspector scrolling.

## Desktop

The studio uses three fixed rows:

- 58px compact header
- flexible workspace
- 62px action footer

The workspace uses three bounded columns:

- Build Navigator: minimum 210px
- live preview: flexible central column
- contextual inspector: minimum 350px

At widths below 1100px, the columns tighten and slider labels stack over their control rows. This prevents range alternatives from clipping while retaining the single-viewport layout. Text that cannot fit in a compact tool or preset card ellipsizes; accessible names remain complete.

Automated layout coverage checks 1024×768, 1280×720, 1440×900, and 1920×1080. It verifies zero document overflow, visible preview, visible footer, and in-bounds studio geometry at every size.

## Mobile portrait

At 760px and below, the shell becomes one continuous screen with these fixed regions:

1. 94px name/tool header
2. compact persistent preview
3. Build navigator when Build is active
4. category strip and internally scrolling inspector
5. 78px action footer

For non-Build categories, the Build Navigator is removed from the grid so the inspector gains that space. This is a responsive reflow, not a route or state reset.

Advanced preview tools become a compact overlay trigger above the direction row. The authored sprite remains fully visible when the tools are closed. Saved Looks, Randomize, and Help become bottom sheets no taller than 76dvh.

The 390×844 browser test verifies:

- document scroll position remains zero;
- document and studio widths do not exceed 390px;
- the inspector has independent scroll range and can scroll without moving the preview;
- the preview and confirmation remain inside the viewport;
- visible interactive targets are at least 44px tall;
- no more than six body ranges are visible in a Detail Forge subgroup;
- state survives portrait-to-landscape-to-portrait resizing.

## Mobile landscape and rotation

Device rotation changes only CSS grid proportions. React components remain mounted, so appearance, mode, category, body region, subgroup, pose, direction, history, and drawer state are not reconstructed. The inspector remains the overflow owner.

Extremely short landscape viewports prioritize the preview, inspector, and confirmation. Secondary content remains reachable through its internal rails rather than expanding the document.

## Safe areas and touch

The fixed shell padding uses `env(safe-area-inset-top/right/bottom/left)`. Buttons, inputs, selects, and interactive summaries have a mobile minimum height of 44px. Sliders retain adjacent decrease, per-control reset, and increase buttons.

## Accessibility-responsive behavior

- Focus outlines remain three pixels wide and are not clipped by panels.
- Drawers restore focus after dismissal.
- High-contrast and reduced-motion data attributes remain owned by the existing application settings and continue through edit mode.
- Automatic rotation is disabled when reduced motion is active; a local preview-motion toggle cannot override the user's global reduced-motion preference.
- Pixel canvases use the existing crisp renderer and scale down with bounded height rather than being cropped.
