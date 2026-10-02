import type { Card, Column, Difficulty, Rank, Suit } from '@shared/types'

/** 根据 difficulty 选择要参与的花色集合（仅内部使用） */
function suitsFor(difficulty: Difficulty): Suit[] {
  switch (difficulty) {
    case 1:
      return ['spades']
    case 2:
      return ['spades', 'hearts']
    case 4:
      return ['spades', 'hearts', 'diamonds', 'clubs']
  }
}

const RANKS: Rank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]

/** 创建 104 张牌（按难度生成对应花色集合，每花色 2 副 A-K） */
export function createDeck(difficulty: Difficulty): Card[] {
  const suits = suitsFor(difficulty)
  const cardsPerSuit = 104 / (suits.length * 13) // 1 花色 8 副 / 2 花色 4 副 / 4 花色 2 副
  const deck: Card[] = []
  let counter = 0
  for (let copy = 0; copy < cardsPerSuit; copy++) {
    for (const suit of suits) {
      for (const rank of RANKS) {
        deck.push({
          id: `c${counter++}`,
          suit,
          rank,
          faceUp: false
        })
      }
    }
  }
  return deck
}

/** Fisher–Yates 洗牌（原地修改并返回） */
export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** 初始发牌：返回 tableau(10 列) 与 stock(5 轮 × 10 张) */
export function dealInitial(deck: Card[]): { tableau: Column[]; stock: Card[][] } {
  const tableau: Column[] = Array.from({ length: 10 }, () => ({ cards: [] }))
  let idx = 0
  // 第 1-4 列各 6 张，第 5-10 列各 5 张 = 4*6 + 6*5 = 54 张
  const layout = [6, 6, 6, 6, 5, 5, 5, 5, 5, 5]
  for (let col = 0; col < 10; col++) {
    for (let k = 0; k < layout[col]; k++) {
      const card = deck[idx++]
      // 仅顶牌正面朝上
      card.faceUp = k === layout[col] - 1
      tableau[col].cards.push(card)
    }
  }
  // 剩余 50 张分 5 轮，每轮 10 张
  const stock: Card[][] = []
  for (let round = 0; round < 5; round++) {
    const roundCards: Card[] = []
    for (let i = 0; i < 10; i++) {
      roundCards.push(deck[idx++])
    }
    stock.push(roundCards)
  }
  return { tableau, stock }
}
