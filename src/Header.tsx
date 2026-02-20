import "./Header.css";

interface HeaderProps {
  targetCountryName: string | undefined;
  wrongClicks: number;
  completedCount: number;
  totalCount: number;
  isFinished: boolean;
  onReset: () => void;
  onSkip: () => void;
}

/**
 * Header component showing current target, score, and reset button
 */
export function Header({
  targetCountryName,
  wrongClicks,
  completedCount,
  totalCount,
  isFinished,
  onReset,
  onSkip,
}: HeaderProps) {
  return (
    <header className="header">
      <div className="header-content">
        <div className="target-section">
          {isFinished ? (
            <div className="finished-message">
              <span className="finished-title">🎉 Congratulations!</span>
              <span className="finished-subtitle">
                You found all {totalCount} countries!
              </span>
            </div>
          ) : (
            <>
              <span className="target-label">Find:</span>
              <span className="target-name">{targetCountryName || "..."}</span>
            </>
          )}
        </div>

        <div className="stats-section">
          <div className="stat">
            <span className="stat-label">Progress</span>
            <span className="stat-value">
              {completedCount} / {totalCount}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Wrong Clicks</span>
            <span className="stat-value stat-value--wrong">{wrongClicks}</span>
          </div>
        </div>

        <div className="button-section">
          {!isFinished && (
            <button className="skip-button" onClick={onSkip}>
              ⏭ Skip
            </button>
          )}
          <button className="reset-button" onClick={onReset}>
            {isFinished ? "🔄 Play Again" : "↺ Reset"}
          </button>
        </div>
      </div>
    </header>
  );
}
