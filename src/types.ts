/**
 * Type definitions for the Click the Country game
 */

/**
 * GeoJSON geometry type (simplified for our use case)
 */
export interface GeoJsonGeometry {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][] | number[][][][];
}

/**
 * A processed country feature from the GeoJSON data
 */
export interface CountryFeature {
  type: 'Feature';
  id: string;
  properties: {
    name: string;
    id: string;
  };
  geometry: GeoJsonGeometry;
}

/**
 * The processed GeoJSON FeatureCollection
 */
export interface CountriesData {
  type: 'FeatureCollection';
  features: CountryFeature[];
}

/**
 * A country entry for the game (derived from features)
 */
export interface Country {
  id: string;
  name: string;
}

/**
 * Game status
 */
export type GameStatus = 'playing' | 'finished';

/**
 * Game state
 */
export interface GameState {
  /** IDs of completed countries */
  completed: Set<string>;
  /** IDs of skipped countries */
  skipped: Set<string>;
  /** Number of wrong clicks */
  wrongClicks: number;
  /** Current target country ID */
  currentTargetId: string;
  /** Game status */
  status: GameStatus;
  /** ID of last wrong click (for animation) */
  lastWrongId: string | null;
  /** Timestamp of last wrong click (to re-trigger animation) */
  lastWrongTimestamp: number;
  /** Shuffled list of country IDs to play through */
  countryOrder: string[];
  /** Current index in countryOrder */
  currentIndex: number;
}

/**
 * Game actions
 */
export interface GameActions {
  /** Handle a country click */
  handleCountryClick: (countryId: string) => void;
  /** Skip the current country */
  skipCountry: () => void;
  /** Reset the game */
  resetGame: () => void;
}

/**
 * Combined game state and actions
 */
export interface GameContext extends GameState, GameActions {
  /** All countries in the game */
  countries: Country[];
  /** Get country by ID */
  getCountryById: (id: string) => Country | undefined;
  /** Get current target country */
  currentTarget: Country | undefined;
}
