export type GamePhase =
  | 'lobby'
  | 'countdown'
  | 'waiting_for_signal'
  | 'signal_active'
  | 'round_results'
  | 'game_over';

export interface PlayerRoundReaction {
  reactionTimeMs: number | null;
  falseStart: boolean;
  rank?: number;
  pointsEarned: number;
  timestamp?: number;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  color: string;
  isHost: boolean;
  isBot?: boolean;
  score: number;
  connected: boolean;
  currentRoundReaction?: PlayerRoundReaction;
  roundHistory: {
    round: number;
    reactionTimeMs: number | null;
    falseStart: boolean;
    points: number;
    rank?: number;
  }[];
}

export interface RoomState {
  roomCode: string;
  hostId: string;
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;
  countdownNumber: number; // 3, 2, 1
  signalTimestamp: number | null;
  signalWord: string;
  roundTimeLimitMs: number;
  resultsCountdownSec: number;
  players: Record<string, Player>;
  lastRoundWinnerId?: string | null;
}

// Client -> Server messages
export type ClientMessage =
  | { type: 'create_room'; playerName: string; avatar: string; color: string; playerId?: string }
  | { type: 'join_room'; roomCode: string; playerName: string; avatar: string; color: string; playerId?: string }
  | { type: 'start_game' }
  | { type: 'player_draw'; clientTime: number }
  | { type: 'next_round' }
  | { type: 'restart_game' }
  | { type: 'add_bot' }
  | { type: 'remove_bot'; botId: string }
  | { type: 'leave_room' };

// Server -> Client messages
export type ServerMessage =
  | { type: 'room_state'; state: RoomState; yourPlayerId: string }
  | { type: 'countdown_tick'; count: number }
  | { type: 'signal_fired'; signalTimestamp: number; signalWord: string }
  | { type: 'player_reacted'; playerId: string; reactionTimeMs: number | null; falseStart: boolean; rank?: number }
  | { type: 'round_ended'; state: RoomState }
  | { type: 'game_ended'; state: RoomState; winnerId: string }
  | { type: 'error'; message: string };
