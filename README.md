# Click the Country 🌍

A browser-based geography game where you learn country locations by clicking on them on a world map.

## How to Play

1. Look at the target country name shown in the header
2. Click on that country on the world map
3. **Correct click**: The country turns green and is added to your completed list
4. **Wrong click**: The clicked country flashes red, and your wrong-click counter increases
5. Complete all countries to finish the game!

Your score is the number of wrong clicks — lower is better!

## Quick Start

```bash
# Install dependencies (this also downloads the map data automatically)
npm install

# Start the development server
npm run dev
```

Then open http://localhost:5173 in your browser.

## Commands

| Command           | Description                                                 |
| ----------------- | ----------------------------------------------------------- |
| `npm install`     | Install dependencies                                        |
| `npm run prepare` | Download country map data (runs automatically with install) |
| `npm run dev`     | Start development server                                    |
| `npm run build`   | Build for production                                        |
| `npm run preview` | Preview production build                                    |

## Data Source & Attribution

This project uses map data from **Natural Earth** and the **world-atlas** npm package:

- **Natural Earth**: https://www.naturalearthdata.com/
- **world-atlas**: https://github.com/topojson/world-atlas

### License

The Natural Earth dataset is in the **public domain**. You are free to use it for any purpose without attribution, though attribution is appreciated.

> "Natural Earth is a public domain map dataset available at 1:10m, 1:50m, and 1:110 million scales."

### Data Processing

The download script (`scripts/download-map-data.js`) automatically:

1. Downloads the 110m resolution countries TopoJSON from a CDN
2. Converts TopoJSON to GeoJSON
3. Filters out features without valid ISO numeric codes
4. Filters out Antarctica (not a country)
5. Saves a clean, processed GeoJSON to `src/assets/countries.json`

## Filtered Territories & Microstates

The following are **excluded** from the game:

| Territory              | Reason                                                 |
| ---------------------- | ------------------------------------------------------ |
| Antarctica             | Not a country — continent with no permanent population |
| Features with ID `-99` | No valid ISO 3166-1 numeric code assigned              |

This ensures all playable countries have:

- A valid ISO numeric code for identification
- A proper country name
- Renderable geometry

The game includes approximately **170+ countries** depending on the dataset version.

## Project Structure

```
world-map/
├── scripts/
│   └── download-map-data.js    # Downloads and processes map data
├── src/
│   ├── assets/
│   │   └── countries.json      # Generated map data (after npm install)
│   ├── App.tsx                 # Main app component
│   ├── App.css                 # App styles
│   ├── Header.tsx              # Header with target country & stats
│   ├── Header.css
│   ├── Sidebar.tsx             # Completed countries list
│   ├── Sidebar.css
│   ├── WorldMap.tsx            # SVG map rendering with d3-geo
│   ├── WorldMap.css            # Map styling & animations
│   ├── useGameState.ts         # Game logic hook
│   ├── types.ts                # TypeScript type definitions
│   ├── main.tsx                # React entry point
│   └── vite-env.d.ts
├── public/
│   └── favicon.svg
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── README.md
```

## Technical Details

### Stack

- **React 18** with TypeScript
- **Vite** for development and building
- **d3-geo** for map projection and path rendering
- **Natural Earth** data (110m resolution) via world-atlas

### Map Rendering

Countries are rendered as SVG `<path>` elements using the **Natural Earth projection** (`geoNaturalEarth1`), which provides a nice balanced view of the world.

### Game Logic

- Countries are shuffled randomly at game start
- State is managed with React hooks
- Completed countries are tracked by their ISO numeric ID
- Wrong-click animation uses CSS keyframes

### Styling

- Neutral fill: `#d4d4d4` (light gray)
- Completed fill: `#4ade80` (green)
- Wrong click: `#ef4444` (red flash, 700ms animation)
- Hover effect: Darker gray with thicker border
- Country borders: Dark gray stroke

## Troubleshooting

### "Failed to load map data"

Make sure the data file exists:

```bash
# Re-run the data download script
npm run prepare

# Verify the file was created
ls -la src/assets/countries.json
```

### Map data is empty or corrupted

Delete and re-download:

```bash
rm -f src/assets/countries.json
npm run prepare
```

### Countries don't match / ID mismatch

The game derives the playable country list directly from the rendered GeoJSON features, so there should never be a mismatch. If you see issues, please report a bug.

## Browser Support

Modern browsers with ES2020 support:

- Chrome 80+
- Firefox 75+
- Safari 14+
- Edge 80+

## License

MIT License - feel free to use, modify, and distribute.

Map data: Public Domain (Natural Earth)
