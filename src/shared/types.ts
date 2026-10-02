// 蜘蛛纸牌共享类型定义

/** 花色 */
export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs'

/** 难度：1/2/4 花色 */
export type Difficulty = 1 | 2 | 4

/** 点数：1 = A, 11 = J, 12 = Q, 13 = K */
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13

/** 一张牌 */
export interface Card {
  id: string
  suit: Suit
  rank: Rank
  /** 是否正面朝上 */
  faceUp: boolean
}

/** 一列牌（ tableau 中的某一列） */
export interface Column {
  cards: Card[]
}

/** 已完成序列（K→A 同花色 13 张） */
export interface CompletedSequence {
  suit: Suit
  cards: Card[]
}

/** 游戏状态快照（用于历史/撤销） */
export interface GameState {
  difficulty: Difficulty
  tableau: Column[]
  stock: Card[][]
  completed: CompletedSequence[]
  score: number
  moves: number
  elapsedMs: number
}

/** 一次移动请求 */
export interface MoveRequest {
  fromCol: number
  fromIndex: number // 起始卡在源列中的索引（含）
  toCol: number
}
