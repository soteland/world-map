import { useMemo, useCallback, useState, useEffect } from "react";
import { geoPath, geoNaturalEarth1, GeoPermissibleObjects } from "d3-geo";
import type { CountriesData } from "./types";
import "./WorldMap.css";

interface WorldMapProps {
  countriesData: CountriesData;
  completed: Set<string>;
  skipped: Set<string>;
  lastWrongId: string | null;
  lastWrongTimestamp: number;
  onCountryClick: (countryId: string) => void;
  isPlaying: boolean;
}

/**
 * World Map component that renders countries as SVG paths
 */
export function WorldMap({
  countriesData,
  completed,
  skipped,
  lastWrongId,
  lastWrongTimestamp,
  onCountryClick,
  isPlaying,
}: WorldMapProps) {
  // Track which country is currently animating wrong
  const [animatingWrongId, setAnimatingWrongId] = useState<string | null>(null);

  // Trigger wrong animation when lastWrongId changes
  useEffect(() => {
    if (lastWrongId && lastWrongTimestamp) {
      setAnimatingWrongId(lastWrongId);
      const timer = setTimeout(() => {
        setAnimatingWrongId(null);
      }, 700); // Animation duration
      return () => clearTimeout(timer);
    }
  }, [lastWrongId, lastWrongTimestamp]);

  // Create projection - Natural Earth projection looks good for world maps
  // Shifted left to show more of the Pacific (including Vanuatu, Fiji, etc.)
  const projection = useMemo(() => {
    return geoNaturalEarth1().scale(170).translate([420, 260]).precision(0.1);
  }, []);

  // Create path generator
  const pathGenerator = useMemo(() => {
    return geoPath().projection(projection);
  }, [projection]);

  // Handle click on a country
  const handleClick = useCallback(
    (countryId: string) => {
      if (isPlaying) {
        onCountryClick(countryId);
      }
    },
    [isPlaying, onCountryClick],
  );

  // Render countries
  const countryPaths = useMemo(() => {
    return countriesData.features.map((feature) => {
      const path = pathGenerator(feature.geometry as GeoPermissibleObjects);
      if (!path) return null;

      const isCompleted = completed.has(feature.id);
      const isSkipped = skipped.has(feature.id);
      const isWrongAnimating = animatingWrongId === feature.id;

      let className = "country";
      if (isCompleted) {
        className += " country--completed";
      } else if (isSkipped) {
        className += " country--skipped";
      } else if (isWrongAnimating) {
        className += " country--wrong";
      }

      return (
        <path
          key={feature.id}
          d={path}
          className={className}
          onClick={() => handleClick(feature.id)}
          data-country-id={feature.id}
          data-country-name={feature.properties.name}
        >
          <title>{feature.properties.name}</title>
        </path>
      );
    });
  }, [
    countriesData.features,
    pathGenerator,
    completed,
    skipped,
    animatingWrongId,
    handleClick,
  ]);

  return (
    <div className="world-map-container">
      <svg
        viewBox="0 0 900 500"
        className="world-map"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background */}
        <rect x="0" y="0" width="900" height="500" className="map-background" />

        {/* Countries */}
        <g className="countries-group">{countryPaths}</g>
      </svg>
    </div>
  );
}
