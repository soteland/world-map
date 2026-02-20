import { useState, useEffect, useMemo } from "react";
import type { CountriesData } from "./types";
import { useGameState } from "./useGameState";
import { WorldMap } from "./WorldMap";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import "./App.css";

/**
 * Main App component
 */
function App() {
  const [countriesData, setCountriesData] = useState<CountriesData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load countries data on mount
  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch("/countries.json");
        if (!response.ok) {
          throw new Error(`Failed to load map data: ${response.statusText}`);
        }
        const data = await response.json();
        setCountriesData(data);
        setLoading(false);
      } catch (err) {
        console.error("Error loading countries data:", err);
        setError(
          'Failed to load map data. Make sure you ran "npm run prepare" first to download the country data.',
        );
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Game state
  const game = useGameState(countriesData);

  // Get completed countries in order (including skipped)
  const completedCountries = useMemo(() => {
    const result: { id: string; name: string; wasSkipped: boolean }[] = [];
    // We want them in the order they were completed (based on countryOrder)
    for (let i = 0; i < game.currentIndex; i++) {
      const id = game.countryOrder[i];
      const country = game.getCountryById(id);
      if (country) {
        result.push({
          ...country,
          wasSkipped: game.skipped.has(id),
        });
      }
    }
    return result;
  }, [game.currentIndex, game.countryOrder, game.getCountryById, game.skipped]);

  // Loading state
  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading world map...</p>
      </div>
    );
  }

  // Error state
  if (error || !countriesData) {
    return (
      <div className="app-error">
        <h1>⚠️ Error</h1>
        <p>{error || "Failed to load data"}</p>
        <div className="error-help">
          <p>Please run the following commands:</p>
          <code>npm install</code>
          <code>npm run prepare</code>
          <code>npm run dev</code>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Header
        targetCountryName={game.currentTarget?.name}
        wrongClicks={game.wrongClicks}
        completedCount={game.completed.size + game.skipped.size}
        totalCount={game.countries.length}
        isFinished={game.status === "finished"}
        onReset={game.resetGame}
        onSkip={game.skipCountry}
      />
      <main className="app-main">
        <WorldMap
          countriesData={countriesData}
          completed={game.completed}
          skipped={game.skipped}
          lastWrongId={game.lastWrongId}
          lastWrongTimestamp={game.lastWrongTimestamp}
          onCountryClick={game.handleCountryClick}
          isPlaying={game.status === "playing"}
        />
        <Sidebar
          completedCountries={completedCountries}
          totalCount={game.countries.length}
          wrongClicks={game.wrongClicks}
          skippedCount={game.skipped.size}
          isFinished={game.status === "finished"}
        />
      </main>
    </div>
  );
}

export default App;
