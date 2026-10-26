/** Canonical task library and ten fixed presets; random cards are player-specific snapshots. */
import sourceCards from '../../data/cards.json'
import sourceTasks from '../../data/tasks.json'

export const GRID_SIZE = 5
export const CARD_COUNT = 10
export const RANDOM_CARD_ID = 11
export const FREE_SQUARE_INDEX = 12
export const FREE_SQUARE_LABEL = 'Bonusfeld'

export interface BingoCard {
  readonly id: number
  readonly name: string
  readonly rows: ReadonlyArray<ReadonlyArray<string>>
}
export interface CardCatalog {
  readonly schemaVersion: 2
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
  if (!condition) throw new Error(`Invalid bingo cards: ${message}`)
}

/** One editable source per task, referenced by immutable task ID from preset cards. */
export function parseTaskPool(input: unknown): ReadonlyMap<string, string> {
  requireValue(isObject(input), 'task library must be an object')
  if (!isObject(input)) throw new Error('Invalid bingo cards: task library must be an object')
  requireValue(input.schemaVersion === 1 && isObject(input.tasks), 'invalid task library schema')
  const tasks = input.tasks as Record<string, unknown>
  const pool = new Map<string, string>()
  const labels = new Set<string>()
  for (const [id, value] of Object.entries(tasks)) {
    requireValue(/^t\d{3,}$/.test(id), `invalid task ID ${id}`)
    requireValue(typeof value === 'string' && value.trim().length > 0 && value.trim() !== FREE_SQUARE_LABEL,
      `invalid text for task ${id}`)
    const text = (value as string).trim()
    requireValue(!labels.has(text.toLocaleLowerCase('de-AT')), `duplicate task text for ${id}`)
    pool.set(id, text)
    labels.add(text.toLocaleLowerCase('de-AT'))
  }
  requireValue(pool.size >= 24, 'at least 24 distinct tasks are required')
  return pool
}

/** Validate preset IDs and resolve task text from the central task library. */
export function parseCardCatalog(input: unknown, taskInput: unknown = sourceTasks): CardCatalog {
  const tasks = parseTaskPool(taskInput)
  requireValue(isObject(input), 'catalog must be an object')
  if (!isObject(input)) throw new Error('Invalid bingo cards: catalog must be an object')
  requireValue(input.schemaVersion === 2, 'schemaVersion must be 2')
  requireValue(input.cardVersion === 'wvw-v2', 'unknown cardVersion')
  requireValue(input.locale === 'de-AT', 'locale must be de-AT')
  requireValue(input.gridSize === GRID_SIZE, 'grid must be 5×5')
  requireValue(input.freeSquareIndex === FREE_SQUARE_INDEX, 'free square must have index 12')
  requireValue(Array.isArray(input.cards) && input.cards.length === CARD_COUNT, 'expected exactly 10 cards')

  const seenIds = new Set<number>()
  const cards: BingoCard[] = (input.cards as unknown[]).map((item, cardIndex) => {
    requireValue(isObject(item), `card ${cardIndex + 1} must be an object`)
    if (!isObject(item)) throw new Error('Invalid bingo cards: card must be an object')
    const { id, name, rows: rawRows } = item
    requireValue(Number.isInteger(id) && typeof id === 'number' && id >= 1 && id <= CARD_COUNT,
      `invalid card ID at position ${cardIndex + 1}`)
    const cardId = id as number
    requireValue(!seenIds.has(cardId), `duplicate card ID ${cardId}`)
    seenIds.add(cardId)
    requireValue(typeof name === 'string' && name.trim().length > 0, `missing name for card ${cardId}`)
    requireValue(Array.isArray(rawRows) && rawRows.length === GRID_SIZE, `card ${cardId} must have 5 rows`)
    const usedTasks = new Set<string>()
    const rows = (rawRows as unknown[]).map((rawRow, rowIndex) => {
      requireValue(Array.isArray(rawRow) && rawRow.length === GRID_SIZE, `card ${cardId} row ${rowIndex + 1} must contain 5 squares`)
      return Object.freeze((rawRow as unknown[]).map((taskId, columnIndex) => {
        const index = rowIndex * GRID_SIZE + columnIndex
        if (index === FREE_SQUARE_INDEX) {
          requireValue(taskId === FREE_SQUARE_LABEL, `card ${cardId} must have Bonusfeld at index 12`)
          return FREE_SQUARE_LABEL
        }
        requireValue(typeof taskId === 'string' && tasks.has(taskId),
          `card ${cardId} references unknown task ID ${String(taskId)}`)
        requireValue(!usedTasks.has(taskId as string), `card ${cardId} repeats task ${String(taskId)}`)
        usedTasks.add(taskId as string)
        return tasks.get(taskId as string)!
      }))
    })
    return Object.freeze({ id: cardId, name: name as string, rows: Object.freeze(rows) })
  })
  for (let id = 1; id <= CARD_COUNT; id++) requireValue(seenIds.has(id), `card ${id} is missing`)
  return Object.freeze({ schemaVersion: 2, cardVersion: input.cardVersion as string,
    locale: input.locale as string, gridSize: GRID_SIZE, freeSquareIndex: FREE_SQUARE_INDEX,
    cards: Object.freeze(cards) })
}

export const taskPool = parseTaskPool(sourceTasks)
export const cardCatalog = parseCardCatalog(sourceCards)
export const presetCards = cardCatalog.cards

function makeCard(id: number, name: string, squares: readonly string[]): BingoCard {
  requireValue(squares.length === 25 && squares.every(text => typeof text === 'string' && text.trim()),
    'snapshot must contain 25 nonempty squares')
  requireValue(squares[FREE_SQUARE_INDEX] === FREE_SQUARE_LABEL &&
    squares.filter(text => text === FREE_SQUARE_LABEL).length === 1,
    'snapshot must have only one center Bonusfeld')
  const rows = Array.from({ length: 5 }, (_, index) => Object.freeze(squares.slice(index * 5, index * 5 + 5)))
  return Object.freeze({ id, name, rows: Object.freeze(rows) })
}

/** Fisher-Yates sample without replacement. Pass an integer chooser for repeatable unit tests. */
export function generateRandomCard(chooseIndex: (maxExclusive: number) => number = secureIndex): BingoCard {
  const tasks = [...taskPool.values()]
  for (let i = 0; i < 24; i++) {
    const count = tasks.length - i
    const offset = chooseIndex(count)
    if (!Number.isInteger(offset) || offset < 0 || offset >= count) throw new RangeError('Invalid random index')
    const j = i + offset
    ;[tasks[i], tasks[j]] = [tasks[j], tasks[i]]
  }
  const squares = tasks.slice(0, 24)
  squares.splice(FREE_SQUARE_INDEX, 0, FREE_SQUARE_LABEL)
  return makeCard(RANDOM_CARD_ID, 'Random card', squares)
}

/** Cryptographically sourced, unbiased bounded integer for server-side shuffling. */
function secureIndex(max: number): number {
  const bound = Math.floor(0x100000000 / max) * max
  const value = new Uint32Array(1)
  do { crypto.getRandomValues(value) } while (value[0] >= bound)
  return value[0] % max
}

/** Stable sample for selection previews only; real random cards are generated on join. */
const sampleRandomCard = generateRandomCard(max => Math.floor(max / 2))
export const selectableCards = Object.freeze([...presetCards, sampleRandomCard])
export function getCardById(cardId: number): BingoCard {
  const card = selectableCards.find(entry => entry.id === cardId)
  if (!card) throw new RangeError(`Unknown bingo card ID: ${cardId}`)
  return card
}
export function cardFromSnapshot(cardId: number, squares: readonly string[]): BingoCard {
  getCardById(cardId) // Reject unknown card IDs, including untrusted network snapshots.
  return makeCard(cardId, getCardById(cardId).name, squares)
}
export function getFlatSquares(card: BingoCard): ReadonlyArray<string> { return card.rows.flat() }
