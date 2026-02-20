/**
 * Script to download Natural Earth countries data and process it for the game.
 *
 * Data source: Natural Earth (https://www.naturalearthdata.com/)
 * License: Public Domain
 *
 * This script downloads the 110m resolution countries TopoJSON from a CDN mirror
 * and processes it to create a clean GeoJSON file with only the features that
 * have valid ISO codes.
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import https from "https";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Natural Earth 110m countries TopoJSON from official CDN mirrors
// Using the simplified 110m version for faster loading and better performance
const DATA_URLS = [
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json",
  "https://unpkg.com/world-atlas@2/countries-110m.json",
];

const OUTPUT_DIR = join(__dirname, "..", "src", "assets");
const OUTPUT_FILE = join(OUTPUT_DIR, "countries.json");

/**
 * Download JSON from a URL with redirect handling
 */
function downloadJson(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      reject(new Error("Too many redirects"));
      return;
    }

    console.log(`Fetching: ${url}`);

    https
      .get(url, (res) => {
        // Handle redirects
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          console.log(`Redirecting to: ${res.headers.location}`);
          resolve(downloadJson(res.headers.location, maxRedirects - 1));
          return;
        }

        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          return;
        }

        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse JSON: ${e.message}`));
          }
        });
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

/**
 * Convert TopoJSON to GeoJSON
 * Simplified inline implementation to avoid requiring topojson-client at build time
 */
function topoJsonToGeoJson(topology, objectName) {
  const obj = topology.objects[objectName];
  if (!obj) {
    throw new Error(`Object "${objectName}" not found in TopoJSON`);
  }

  const transform = topology.transform;
  const arcs = topology.arcs;

  // Decode delta-encoded coordinates
  function decodeArc(arcIndex) {
    const arc = arcs[arcIndex < 0 ? ~arcIndex : arcIndex];
    const decoded = [];
    let x = 0,
      y = 0;

    for (const point of arc) {
      x += point[0];
      y += point[1];
      decoded.push([
        x * transform.scale[0] + transform.translate[0],
        y * transform.scale[1] + transform.translate[1],
      ]);
    }

    return arcIndex < 0 ? decoded.reverse() : decoded;
  }

  // Decode a ring (array of arc indices)
  function decodeRing(arcIndices) {
    const coords = [];
    for (const arcIndex of arcIndices) {
      const arc = decodeArc(arcIndex);
      // Skip first point of subsequent arcs (it's the same as last point of previous)
      const startIndex = coords.length > 0 ? 1 : 0;
      for (let i = startIndex; i < arc.length; i++) {
        coords.push(arc[i]);
      }
    }
    return coords;
  }

  // Convert a TopoJSON geometry to GeoJSON
  function convertGeometry(topoGeom) {
    switch (topoGeom.type) {
      case "Polygon":
        return {
          type: "Polygon",
          coordinates: topoGeom.arcs.map(decodeRing),
        };
      case "MultiPolygon":
        return {
          type: "MultiPolygon",
          coordinates: topoGeom.arcs.map((polygon) => polygon.map(decodeRing)),
        };
      default:
        return topoGeom;
    }
  }

  // Convert geometries to features
  const features = obj.geometries.map((geom, index) => ({
    type: "Feature",
    id: geom.id ?? index,
    properties: geom.properties || {},
    geometry: convertGeometry(geom),
  }));

  return {
    type: "FeatureCollection",
    features,
  };
}

/**
 * Process the downloaded data and filter/clean countries
 */
function processCountryData(topoJson) {
  console.log("Processing TopoJSON data...");

  // Find the countries object (could be named 'countries' or 'ne_110m_admin_0_countries')
  const objectName =
    Object.keys(topoJson.objects).find(
      (key) => key.includes("countries") || key.includes("admin"),
    ) || Object.keys(topoJson.objects)[0];

  console.log(`Using object: ${objectName}`);

  // Convert to GeoJSON
  const geoJson = topoJsonToGeoJson(topoJson, objectName);
  console.log(`Total features before filtering: ${geoJson.features.length}`);

  // Filter and process features
  const processedFeatures = [];
  const skipped = [];

  for (const feature of geoJson.features) {
    const props = feature.properties;
    const name = props.name || props.NAME || props.ADMIN || props.NAME_LONG;

    // The world-atlas dataset uses numeric IDs based on ISO 3166-1 numeric codes
    // We'll use the feature ID directly, but filter out -99 (no code) entries
    const numericId = feature.id;

    // Skip features without a proper ID or name
    if (numericId === -99 || numericId === "-99" || !name) {
      skipped.push({ name: name || "Unknown", reason: "No valid ISO code" });
      continue;
    }

    // Skip Antarctica (010) - it's not a country and takes up lots of space
    if (numericId === "010" || numericId === 10) {
      skipped.push({ name, reason: "Antarctica excluded" });
      continue;
    }

    processedFeatures.push({
      type: "Feature",
      id: String(numericId),
      properties: {
        name: name,
        id: String(numericId),
      },
      geometry: feature.geometry,
    });
  }

  console.log(`Features after filtering: ${processedFeatures.length}`);
  console.log("\nSkipped features:");
  for (const { name, reason } of skipped) {
    console.log(`  - ${name}: ${reason}`);
  }

  return {
    type: "FeatureCollection",
    features: processedFeatures,
  };
}

/**
 * Main function
 */
async function main() {
  console.log("=".repeat(60));
  console.log("Downloading Natural Earth Countries Data");
  console.log("=".repeat(60));
  console.log("");

  // Try each URL until one works
  let topoJson = null;
  let lastError = null;

  for (const url of DATA_URLS) {
    try {
      topoJson = await downloadJson(url);
      console.log("Download successful!\n");
      break;
    } catch (error) {
      console.log(`Failed to download from ${url}: ${error.message}`);
      lastError = error;
    }
  }

  if (!topoJson) {
    console.error("\nFailed to download data from any source.");
    console.error("Please check your internet connection and try again.");
    process.exit(1);
  }

  // Process the data
  const processedData = processCountryData(topoJson);

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`\nCreated directory: ${OUTPUT_DIR}`);
  }

  // Write the processed data
  writeFileSync(OUTPUT_FILE, JSON.stringify(processedData));
  console.log(`\nWrote processed data to: ${OUTPUT_FILE}`);

  // Calculate file size
  const sizeKb = (JSON.stringify(processedData).length / 1024).toFixed(1);
  console.log(`File size: ${sizeKb} KB`);

  console.log("\n" + "=".repeat(60));
  console.log("Data download complete!");
  console.log(`Total playable countries: ${processedData.features.length}`);
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
