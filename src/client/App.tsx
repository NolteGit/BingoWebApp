import { useState } from 'preact/hooks'
import {
  FREE_SQUARE_INDEX,
  getCardById,
  getFlatSquares,
  presetCards,
} from '../shared/cards'

export function App() {
  const [selectedCardId, setSelectedCardId] = useState(1)
  const selectedCard = getCardById(selectedCardId)

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
            Alle zehn WvW-Bingokarten sind geladen. Wähle eine Karte aus,
            um ihre Originalfelder anzusehen.
          </p>

          <div class="preview-toolbar">
            <label for="card-choice">Bingokarte auswählen</label>
            <select
              id="card-choice"
              value={selectedCardId}
              onChange={(event) => setSelectedCardId(Number(event.currentTarget.value))}
            >
              {presetCards.map((card) => (
                <option key={card.id} value={card.id}>{card.name}</option>
              ))}
            </select>
          </div>

          <section class="preview-area" aria-labelledby="preview-title">
            <div class="preview-caption">
              <h2 id="preview-title">{selectedCard.name}</h2>
              <span>5 × 5 · Bonusfeld in der Mitte</span>
            </div>
            <div class="board-preview" role="grid" aria-label={`Vorschau: ${selectedCard.name}`}>
              {getFlatSquares(selectedCard).map((objective, index) => (
                <div
                  key={`${selectedCard.id}-${index}`}
                  class={`preview-square${index === FREE_SQUARE_INDEX ? ' preview-square--free' : ''}`}
                  role="gridcell"
                  aria-label={index === FREE_SQUARE_INDEX ? `${objective}, Freifeld` : objective}
                >
                  <span>{objective}</span>
                  {index === FREE_SQUARE_INDEX && <small>FREIFELD</small>}
                </div>
              ))}
            </div>
          </section>

          <div class="info-panel" aria-label="Aktueller Entwicklungsstand">
            <div class="info-heading">
              <span class="status-dot" aria-hidden="true" />
              <strong>Nur Kartenvorschau</strong>
            </div>
            <p>
              Die Felder können noch nicht abgehakt werden. Diese Seite läuft
              derzeit nur lokal. Es gibt noch keine Spieler-Lobby, keine
              gespeicherten Spielstände und keine Live-Synchronisierung.
            </p>
          </div>
        </section>

        <footer class="footer">
          <span>Kartendaten · Schritt 2 von 5</span>
          <span>Oberfläche: Deutsch</span>
        </footer>
      </div>
    </main>
  )
}
