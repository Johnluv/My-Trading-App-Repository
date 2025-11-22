
// Data Models
export enum TradeType {
  BUY = 'BUY',
  SELL = 'SELL',
}

export interface Trade {
  id: string;
  symbol: string; // e.g., XAUUSD, BTCUSD
  type: TradeType;
  entryPrice: number;
  exitPrice: number;
  sl?: number; // Stop Loss
  tp?: number; // Take Profit
  pips?: number; // Pips gained/lost
  lotSize: number;
  pnl: number; // Profit and Loss
  date: string; // ISO String
  notes?: string;
  status: 'WIN' | 'LOSS' | 'BREAKEVEN';
}

export interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  amount: number;
  date: string;
  note?: string;
}

export interface ParsedData {
    trades: Partial<Trade>[];
    transactions: Partial<Transaction>[];
}

export interface UserSettings {
  dailyLossLimit: number;
  dailyTradeLimit: number;
  maxDrawdownLimit: number; // %
  savingsGoal: number;
  currency: string;
}

export interface TradeMetrics {
  totalTrades: number;
  winRate: number;
  totalPnL: number;
  totalPips: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  maxDrawdown: number;
  bestTrade: number;
  worstTrade: number;
  roi: number; // Return on Investment %
  currentBalance: number;
}

export interface MarketAlert {
  id: string;
  symbol: string;
  price: number;
  condition: 'ABOVE' | 'BELOW';
  active: boolean;
  createdAt: number;
}

// Service Response Types
export interface SearchResult {
  title: string;
  uri: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
