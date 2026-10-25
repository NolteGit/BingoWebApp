/** Canonical, immutable card data shared by future frontend and backend logic. */
import sourceCards from '../../data/cards.json'

export const GRID_SIZE = 5
export const CARD_COUNT = 10
export const FREE_SQUARE_INDEX = 12
export const FREE_SQUARE_LABEL = 'Bonusfeld'

export interface BingoCard {
  readonly id: number
  readonly name: string
  readonly rows: ReadonlyArray<ReadonlyArray<string>>
}

export interface CardCatalog {
  readonly schemaVersion: 1
  readonly cardVersion: string
  readonly locale: string
  readonly gridSize: 5
  readonly freeSquareIndex: 12
  readonly cards: ReadonlyArray<BingoCard>
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requireValue(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Invalid bingo cards: ${message}`)
  }
}

/**
 * Validate the entire JSON source before any card is shown to players.
 * This deliberately does not shuffle or rewrite any labels or positions.
 */
export function parseCardCatalog(input: unknown): CardCatalog {
  requireValue(isObject(input), 'catalog must be an object')
  if (!isObject(input)) throw new Error('Invalid bingo cards: catalog must be an object')

  requireValue(input.schemaVersion === 1, 'schemaVersion must be 1')
  requireValue(input.cardVersion === 'wvw-v1', 'unknown cardVersion')
  requireValue(input.locale === 'de-AT', 'locale must be de-AT')
  requireValue(input.gridSize === GRID_SIZE, 'grid must be 5×5')
  requireValue(input.freeSquareIndex === FREE_SQUARE_INDEX, 'free square must have index 12')
  requireValue(Array.isArray(input.cards) && input.cards.length === CARD_COUNT, 'expected exactly 10 cards')

  const rawCards = input.cards as unknown[]
  const seenIds = new Set<number>()
  const cards: BingoCard[] = rawCards.map((item, cardIndex) => {
    requireValue(isObject(item), `card ${cardIndex + 1} must be an object`)
    if (!isObject(item)) throw new Error('Invalid bingo cards: card must be an object')

    const { id, name, rows: rawRows } = item
    requireValue(Number.isInteger(id) && typeof id === 'number' && id >= 1 && id <= CARD_COUNT, `invalid card ID at position ${cardIndex + 1}`)
    const cardId = id as number
    requireValue(!seenIds.has(cardId), `duplicate card ID ${cardId}`)
    seenIds.add(cardId)
    requireValue(typeof name === 'string' && name.trim().length > 0, `missing name for card ${cardId}`)
    requireValue(Array.isArray(rawRows) && rawRows.length === GRID_SIZE, `card ${cardId} must have 5 rows`)

    const rows = (rawRows as unknown[]).map((rawRow, rowIndex) => {
      requireValue(Array.isArray(rawRow) && rawRow.length === GRID_SIZE, `card ${cardId} row ${rowIndex + 1} must contain 5 squares`)
      const entries = rawRow as unknown[]
      const labels = entries.map((label, columnIndex) => {
        requireValue(typeof label === 'string' && label.trim().length > 0,
          `empty square on card ${cardId} at row ${rowIndex + 1}, column ${columnIndex + 1}`)
        const squareIndex = rowIndex * GRID_SIZE + columnIndex
        requireValue((label === FREE_SQUARE_LABEL) === (squareIndex === FREE_SQUARE_INDEX),
          `card ${cardId} must have exactly one Bonusfeld at index 12`)
        return label as string
      })
      return Object.freeze(labels)
    })

    return Object.freeze({ id: cardId, name: name as string, rows: Object.freeze(rows) })
  })

  for (let id = 1; id <= CARD_COUNT; id += 1) {
    requireValue(seenIds.has(id), `card ${id} is missing`)
  }

  return Object.freeze({
    schemaVersion: 1,
    cardVersion: input.cardVersion as string,
    locale: input.locale as string,
    gridSize: GRID_SIZE,
    freeSquareIndex: FREE_SQUARE_INDEX,
    cards: Object.freeze(cards),
  })
}

export const cardCatalog = parseCardCatalog(sourceCards)
export const presetCards = cardCatalog.cards

export function getCardById(cardId: number): BingoCard {
  const card = presetCards.find((entry) => entry.id === cardId)
  if (!card) throw new RangeError(`Unknown bingo card ID: ${cardId}`)
  return card
}

export function getFlatSquares(card: BingoCard): ReadonlyArray<string> {
  return card.rows.flat()
}
