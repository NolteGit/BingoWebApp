export function App() {
  return (
    <main class="page-shell">
      <div class="app-frame">
        <header class="topbar">
          <span class="brand-mark" aria-hidden="true">B</span>
          <span class="brand-name">GW2 WvW Bingo</span>
          <span class="status-pill">Lokale Vorschau</span>
        </header>

        <section class="hero" aria-labelledby="page-title">
          <p class="eyebrow">Guild Wars 2 · World vs. World</p>
          <h1 id="page-title">WvW Bingo</h1>
          <p class="lead">
            Das Grundgerüst steht. Als Nächstes kommen die zehn Bingokarten,
            die klickbaren Felder und der gemeinsame Spielraum.
          </p>

          <div class="info-panel" aria-label="Aktueller Entwicklungsstand">
            <div class="info-heading">
              <span class="status-dot" aria-hidden="true" />
              <strong>Frontend-Vorschau</strong>
            </div>
            <p>
              Diese Seite läuft derzeit nur lokal. Es gibt noch keine
              Spieler-Lobby, keine gespeicherten Spielstände und keine
              Live-Synchronisierung.
            </p>
          </div>
        </section>

        <footer class="footer">
          <span>Projektstart · Schritt 1 von 5</span>
          <span>Interface: Deutsch</span>
        </footer>
      </div>
    </main>
  )
}
