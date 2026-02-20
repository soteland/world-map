import type { Country } from "./types";
import "./Sidebar.css";

interface CompletedCountry extends Country {
  wasSkipped: boolean;
}

interface SidebarProps {
  completedCountries: CompletedCountry[];
  totalCount: number;
  wrongClicks: number;
  skippedCount: number;
  isFinished: boolean;
}

/**
 * Sidebar showing completed countries list and final score
 */
export function Sidebar({
  completedCountries,
  totalCount,
  wrongClicks,
  skippedCount,
  isFinished,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">Completed</h2>
        <span className="sidebar-count">
          {completedCountries.length} / {totalCount}
        </span>
      </div>

      {isFinished && (
        <div className="final-score">
          <div className="final-score-title">Final Score</div>
          <div className="final-score-value">
            {wrongClicks === 0 && skippedCount === 0 ? (
              <span className="perfect-score">🏆 Perfect!</span>
            ) : (
              <span>
                {wrongClicks} wrong click{wrongClicks !== 1 ? "s" : ""}
                {skippedCount > 0 && <>, {skippedCount} skipped</>}
              </span>
            )}
          </div>
          <div className="final-score-note">(Lower is better)</div>
        </div>
      )}

      <div className="completed-list">
        {completedCountries.length === 0 ? (
          <div className="completed-empty">
            Click on countries to get started!
          </div>
        ) : (
          <ul className="completed-items">
            {completedCountries.map((country, index) => (
              <li
                key={country.id}
                className={`completed-item ${country.wasSkipped ? "completed-item--skipped" : ""}`}
              >
                <span
                  className={`completed-number ${country.wasSkipped ? "completed-number--skipped" : ""}`}
                >
                  {index + 1}.
                </span>
                <span className="completed-name">
                  {country.name}
                  {country.wasSkipped && (
                    <span className="skipped-label"> (skipped)</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
