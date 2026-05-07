export function LeaderboardLoading({ titleWidth = "w-72" }: { titleWidth?: string }) {
  return (
    <main className="bl-lb-shell">
      <div className="bl-lb-subnav-slot">
        <div className="bl-lb-subnav-wrap">
          <div className="bl-lb-subnav">
            {[0, 1, 2, 3].map(index => (
              <div key={index} className={`bl-lb-skeleton-tab ${index === 0 ? "bl-lb-skeleton-tab-active" : ""}`} />
            ))}
          </div>
        </div>
      </div>
      <div className="bl-lb-frame">
        <div className="bl-lb-team-rail">
          {[0, 1, 2, 3].map(index => (
            <div key={index} className="bl-lb-skeleton-card bl-lb-skeleton-team" />
          ))}
        </div>
        <div className="bl-lb-hero">
          <div className="bl-lb-skeleton-copy">
            <div className={`bl-lb-skeleton-line bl-lb-skeleton-title ${titleWidth}`} />
            <div className="bl-lb-skeleton-line bl-lb-skeleton-text" />
          </div>
        </div>
        <section className="bl-lb-board">
          <div className="bl-lb-toolbar">
            <div className="bl-lb-skeleton-input" />
            <div className="bl-lb-toolbar-actions">
              <div className="bl-lb-skeleton-pill" />
            </div>
          </div>
          <div className="bl-lb-podium-grid">
            {[0, 1, 2].map(index => (
              <div key={index} className="bl-lb-skeleton-card bl-lb-skeleton-podium" />
            ))}
          </div>
          <div className="bl-lb-panel">
            <div className="bl-lb-table-list">
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="bl-lb-skeleton-row" />
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
