import type { Card, Column, GameState, MoveRequest } from '@shared/types'

/** 判断一组牌是否构成同花色降序连续序列（如 ♠9-♠8-♠7） */
function isSameSuitRun(cards: Card[]): boolean {
  if (cards.length === 0) return false
  const suit = cards[0].suit
  for (let i = 0; i < cards.length; i++) {
    if (cards[i].suit !== suit) return false
    if (!cards[i].faceUp) return false
    if (i > 0 && cards[i - 1].rank !== (cards[i].rank as number) + 1) return false
  }
  return true
}

/**
 * 判断从某列从 fromIndex 开始的牌是否可作为整体被拿起。
 * 条件：从 fromIndex 到列底所有牌均正面朝上，且构成同花色降序连续序列。
 */
export function canPickUp(column: Column, fromIndex: number): boolean {
  if (fromIndex < 0 || fromIndex >= column.cards.length) return false
  const slice = column.cards.slice(fromIndex)
  return isSameSuitRun(slice)
}

/**
 * 判断一组牌（已确认为同花色连续序列或单张）能否放到目标列上。
 * - 目标列为空：任意牌都可放
 * - 目标列非空：被移动序列的顶牌 rank 必须比目标列底牌 rank 小 1（花色不限）
 */
export function canDropOn(movingCards: Card[], targetColumn: Column): boolean {
  if (movingCards.length === 0) return false
  if (targetColumn.cards.length === 0) return true
  const target = targetColumn.cards[targetColumn.cards.length - 1]
  if (!target.faceUp) return false
  return movingCards[0].rank === (target.rank as number) - 1
}

/** 判断是否允许从 stock 发牌：所有列均非空 */
export function canDealStock(tableau: Column[]): boolean {
  return tableau.every((col) => col.cards.length > 0)
}

/**
 * 检查某列底部是否出现同花色 K→A 完整 13 张序列。
 * 返回该序列的起始索引（含），若不存在返回 -1。
 */
export function findCompletedRun(column: Column): number {
  const cards = column.cards
  if (cards.length < 13) return -1
  // 从底部往前找 13 张
  const start = cards.length - 13
  const tail = cards.slice(start)
  if (tail[0].rank !== 13) return -1
  if (isSameSuitRun(tail) && tail[12].rank === 1) {
    return start
  }
  return -1
}

/** 检查是否胜利：8 条 K→A 同花色序列全部完成 */
export function checkWin(state: GameState): boolean {
  return state.completed.length === 8
}

/**
 * 校验一次移动请求是否合法。返回 { ok, movingCards }。
 * 不修改状态。
 */
export function validateMove(state: GameState, req: MoveRequest): { ok: boolean; movingCards: Card[] } {
  if (req.fromCol < 0 || req.fromCol >= state.tableau.length) return { ok: false, movingCards: [] }
  if (req.toCol < 0 || req.toCol >= state.tableau.length) return { ok: false, movingCards: [] }
  if (req.fromCol === req.toCol) return { ok: false, movingCards: [] }
  const fromCol = state.tableau[req.fromCol]
  if (req.fromIndex < 0 || req.fromIndex >= fromCol.cards.length) return { ok: false, movingCards: [] }
  if (!canPickUp(fromCol, req.fromIndex)) return { ok: false, movingCards: [] }
  const movingCards = fromCol.cards.slice(req.fromIndex)
  const toCol = state.tableau[req.toCol]
  if (!canDropOn(movingCards, toCol)) return { ok: false, movingCards: [] }
  return { ok: true, movingCards }
}
