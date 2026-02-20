import { useState, useCallback, useMemo } from 'react';
import type { GameState, GameContext, Country, CountriesData } from './types';

/**
 * Fisher-Yates shuffle algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Create initial game state
 */
function createInitialState(countryIds: string[]): GameState {
  const shuffled = shuffleArray(countryIds);
  return {
    completed: new Set<string>(),
    skipped: new Set<string>(),
    wrongClicks: 0,
    currentTargetId: shuffled[0] || '',
    status: 'playing',
    lastWrongId: null,
    lastWrongTimestamp: 0,
    countryOrder: shuffled,
    currentIndex: 0,
  };
}

/**
 * Custom hook to manage game state
 */
export function useGameState(countriesData: CountriesData | null): GameContext {
  // Derive countries list from the GeoJSON data
  const countries = useMemo<Country[]>(() => {
    if (!countriesData) return [];
    return countriesData.features.map(feature => ({
      id: feature.id,
      name: feature.properties.name,
    }));
  }, [countriesData]);

  // Create a map for quick lookups
  const countryMap = useMemo(() => {
    const map = new Map<string, Country>();
    for (const country of countries) {
      map.set(country.id, country);
    }
    return map;
  }, [countries]);

  // Country IDs for game logic
  const countryIds = useMemo(() => countries.map(c => c.id), [countries]);

  // Main game state
  const [state, setState] = useState<GameState>(() => createInitialState(countryIds));

  // Reset game when countries change (e.g., data loads)
  useMemo(() => {
    if (countryIds.length > 0 && state.countryOrder.length === 0) {
      setState(createInitialState(countryIds));
    }
  }, [countryIds, state.countryOrder.length]);

  /**
   * Handle a country click
   */
  const handleCountryClick = useCallback((countryId: string) => {
    setState(prev => {
      // Ignore if game is finished
      if (prev.status === 'finished') return prev;
      
      // Ignore if country is already completed
      if (prev.completed.has(countryId)) return prev;

      // Check if correct
      if (countryId === prev.currentTargetId) {
        // Correct click!
        const newCompleted = new Set(prev.completed);
        newCompleted.add(countryId);
        
        const nextIndex = prev.currentIndex + 1;
        const isFinished = nextIndex >= prev.countryOrder.length;

        return {
          ...prev,
          completed: newCompleted,
          currentIndex: nextIndex,
          currentTargetId: isFinished ? '' : prev.countryOrder[nextIndex],
          status: isFinished ? 'finished' : 'playing',
          lastWrongId: null,
        };
      } else {
        // Wrong click
        return {
          ...prev,
          wrongClicks: prev.wrongClicks + 1,
          lastWrongId: countryId,
          lastWrongTimestamp: Date.now(),
        };
      }
    });
  }, []);

  /**
   * Skip the current country
   */
  const skipCountry = useCallback(() => {
    setState(prev => {
      if (prev.status === 'finished') return prev;
      
      const newSkipped = new Set(prev.skipped);
      newSkipped.add(prev.currentTargetId);
      
      const nextIndex = prev.currentIndex + 1;
      const isFinished = nextIndex >= prev.countryOrder.length;

      return {
        ...prev,
        skipped: newSkipped,
        currentIndex: nextIndex,
        currentTargetId: isFinished ? '' : prev.countryOrder[nextIndex],
        status: isFinished ? 'finished' : 'playing',
        lastWrongId: null,
      };
    });
  }, []);

  /**
   * Reset the game
   */
  const resetGame = useCallback(() => {
    setState(createInitialState(countryIds));
  }, [countryIds]);

  /**
   * Get country by ID
   */
  const getCountryById = useCallback((id: string) => {
    return countryMap.get(id);
  }, [countryMap]);

  /**
   * Current target country
   */
  const currentTarget = useMemo(() => {
    return countryMap.get(state.currentTargetId);
  }, [countryMap, state.currentTargetId]);

  return {
    ...state,
    countries,
    handleCountryClick,
    skipCountry,
    resetGame,
    getCountryById,
    currentTarget,
  };
}
