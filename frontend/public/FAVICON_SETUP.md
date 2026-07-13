# HealthBox Favicon Setup

The logo has been configured to appear as a favicon in the browser tab. To complete the setup:

## Add the Favicon Image

1. Save the **healthbox-logo.png** image as:
   ```
   frontend/public/healthbox-favicon.png
   ```

2. The favicon will automatically display in:
   - Browser tab icon
   - Browser bookmarks
   - Browser history

## Image Specifications

- **Format**: PNG, ICO, or SVG
- **Size**: 32x32px minimum (64x64px or 512x512px recommended for better quality)
- **Background**: Transparent recommended
- **File location**: `frontend/public/healthbox-favicon.png`

## How It Works

The favicon is configured in [src/routes/__root.tsx](src/routes/__root.tsx):

```tsx
{
  rel: "icon",
  href: "/healthbox-favicon.png",
  type: "image/png",
},
{
  rel: "shortcut icon",
  href: "/healthbox-favicon.png",
},
```

## Next Steps

1. Add `healthbox-favicon.png` to `frontend/public/`
2. Run `npm run dev` to start the development server
3. The favicon should appear in the browser tab

## Notes

- The favicon path is relative to the `public/` folder
- Changes may require a hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Different browsers may cache favicons, so clearing cache may be needed
- The favicon appears in all pages automatically
