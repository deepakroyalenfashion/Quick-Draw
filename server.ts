import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import type { RoomState, Player, ClientMessage, ServerMessage } from './src/types/game';
import { BOT_NAMES } from './src/utils/avatars';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const SIGNAL_WORDS = ['DRAW! ⚡', 'FIRE! 🔥', 'BANG! 💥', 'SHOOT! 🎯', 'PULL! 🦅', 'QUICK! ⚡'];

// In-memory server-authoritative room storage
const rooms = new Map<string, RoomState>();
const socketMeta = new Map<WebSocket, { roomCode: string; playerId: string }>();
const roomTimers = new Map<string, NodeJS.Timeout[]>();

function addTimer(roomCode: string, timer: NodeJS.Timeout) {
  const list = roomTimers.get(roomCode) || [];
  list.push(timer);
  roomTimers.set(roomCode, list);
}

function clearRoomTimers(roomCode: string) {
  const list = roomTimers.get(roomCode);
  if (list) {
    list.forEach((t) => clearTimeout(t));
    roomTimers.set(roomCode, []);
  }
}

// Generate human-friendly 4-letter room code
const CODE_WORDS = ['DUEL', 'COLT', 'SPUR', 'FAST', 'HAWK', 'GRIT', 'RUSH', 'WILD', 'WEST', 'BANG', 'ACES', 'BULL', 'DART', 'BOLT', 'LEAP', 'NEON'];
function generateRoomCode(): string {
  // Try words first, fallback to random letters
  for (const word of CODE_WORDS) {
    if (!rooms.has(word)) return word;
  }
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Broadcast helper to all connected sockets in a room
function broadcastToRoom(roomCode: string, message: ServerMessage) {
  const json = JSON.stringify(message);
  for (const [ws, meta] of socketMeta.entries()) {
    if (meta.roomCode === roomCode && ws.readyState === WebSocket.OPEN) {
      // Custom playerId if sending personalized room_state
      if (message.type === 'room_state') {
        const customMsg: ServerMessage = {
          type: 'room_state',
          state: message.state,
          yourPlayerId: meta.playerId,
        };
        ws.send(JSON.stringify(customMsg));
      } else {
        ws.send(json);
      }
    }
  }
}

function sendToSocket(ws: WebSocket, message: ServerMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

// Start game / round logic
function startRound(roomCode: string) {
  const room = rooms.get(roomCode);
  if (!room) return;

  clearRoomTimers(roomCode);

  // Reset player reactions for this round
  Object.values(room.players).forEach((p) => {
    p.currentRoundReaction = undefined;
  });

  room.phase = 'countdown';
  room.countdownNumber = 3;
  room.signalTimestamp = null;
  room.signalWord = SIGNAL_WORDS[Math.floor(Math.random() * SIGNAL_WORDS.length)];

  broadcastToRoom(roomCode, { type: 'room_state', state: room, yourPlayerId: '' });
  broadcastToRoom(roomCode, { type: 'countdown_tick', count: 3 });

  // Countdown step 2
  const t1 = setTimeout(() => {
    const current = rooms.get(roomCode);
    if (!current || current.phase !== 'countdown') return;
    current.countdownNumber = 2;
    broadcastToRoom(roomCode, { type: 'countdown_tick', count: 2 });
  }, 1000);
  addTimer(roomCode, t1);

  // Countdown step 1
  const t2 = setTimeout(() => {
    const current = rooms.get(roomCode);
    if (!current || current.phase !== 'countdown') return;
    current.countdownNumber = 1;
    broadcastToRoom(roomCode, { type: 'countdown_tick', count: 1 });
  }, 2000);
  addTimer(roomCode, t2);

  // Transition to 'waiting_for_signal'
  const t3 = setTimeout(() => {
    const current = rooms.get(roomCode);
    if (!current || current.phase !== 'countdown') return;
    current.phase = 'waiting_for_signal';
    broadcastToRoom(roomCode, { type: 'room_state', state: current, yourPlayerId: '' });

    // Random trigger delay between 1.5s and 4.8s
    const randomDelay = Math.floor(1500 + Math.random() * 3300);

    // Occasional bot itchy trigger finger (false start)
    Object.values(current.players)
      .filter((p) => p.isBot)
      .forEach((bot) => {
        if (Math.random() < 0.08) {
          const falseStartTime = Math.floor(400 + Math.random() * (randomDelay - 400));
          const botFalseTimer = setTimeout(() => {
            handlePlayerDraw(roomCode, bot.id);
          }, falseStartTime);
          addTimer(roomCode, botFalseTimer);
        }
      });

    // Fire the signal!
    const signalTimer = setTimeout(() => {
      fireSignal(roomCode);
    }, randomDelay);
    addTimer(roomCode, signalTimer);
  }, 3000);
  addTimer(roomCode, t3);
}

function fireSignal(roomCode: string) {
  const room = rooms.get(roomCode);
  if (!room || room.phase !== 'waiting_for_signal') return;

  room.phase = 'signal_active';
  const now = Date.now();
  room.signalTimestamp = now;

  broadcastToRoom(roomCode, {
    type: 'signal_fired',
    signalTimestamp: now,
    signalWord: room.signalWord,
  });
  broadcastToRoom(roomCode, { type: 'room_state', state: room, yourPlayerId: '' });

  // Schedule bot reactions
  Object.values(room.players)
    .filter((p) => p.isBot && !p.currentRoundReaction?.falseStart)
    .forEach((bot) => {
      // Reaction time between 210ms and 500ms
      const baseDelay = bot.name.includes('Wyatt') ? 220 : bot.name.includes('Annie') ? 250 : 310;
      const botReactionTime = baseDelay + Math.floor(Math.random() * 180);
      const botTimer = setTimeout(() => {
        handlePlayerDraw(roomCode, bot.id);
      }, botReactionTime);
      addTimer(roomCode, botTimer);
    });

  // Round timeout (3.5 seconds to react)
  const roundTimeoutTimer = setTimeout(() => {
    endRound(roomCode);
  }, room.roundTimeLimitMs || 3500);
  addTimer(roomCode, roundTimeoutTimer);
}

function handlePlayerDraw(roomCode: string, playerId: string) {
  const room = rooms.get(roomCode);
  if (!room) return;
  const player = room.players[playerId];
  if (!player) return;

  // If already drew or false started this round, ignore
  if (player.currentRoundReaction) return;

  // CASE 1: False start during countdown or waiting
  if (room.phase === 'countdown' || room.phase === 'waiting_for_signal') {
    player.currentRoundReaction = {
      reactionTimeMs: null,
      falseStart: true,
      pointsEarned: 0,
      timestamp: Date.now(),
    };

    broadcastToRoom(roomCode, {
      type: 'player_reacted',
      playerId,
      reactionTimeMs: null,
      falseStart: true,
    });

    // Check if ALL active players have false started
    checkIfRoundComplete(roomCode);
    return;
  }

  // CASE 2: Legitimate draw during signal_active
  if (room.phase === 'signal_active' && room.signalTimestamp) {
    const reactionTime = Math.max(1, Date.now() - room.signalTimestamp);

    // Count how many players already had a successful draw
    const successfulDraws = Object.values(room.players).filter(
      (p) => p.currentRoundReaction && !p.currentRoundReaction.falseStart && p.currentRoundReaction.reactionTimeMs !== null
    );

    const rank = successfulDraws.length + 1;
    let points = 0;
    if (rank === 1) points = 3;
    else if (rank === 2) points = 2;
    else if (rank === 3) points = 1;

    player.currentRoundReaction = {
      reactionTimeMs: reactionTime,
      falseStart: false,
      rank,
      pointsEarned: points,
      timestamp: Date.now(),
    };

    broadcastToRoom(roomCode, {
      type: 'player_reacted',
      playerId,
      reactionTimeMs: reactionTime,
      falseStart: false,
      rank,
    });

    checkIfRoundComplete(roomCode);
  }
}

function checkIfRoundComplete(roomCode: string) {
  const room = rooms.get(roomCode);
  if (!room || room.phase !== 'signal_active') return;

  const activePlayers = Object.values(room.players).filter((p) => p.connected || p.isBot);
  const reactedCount = activePlayers.filter((p) => p.currentRoundReaction !== undefined).length;

  if (reactedCount >= activePlayers.length) {
    // Everyone has drawn or false started! End round immediately without waiting for timeout
    endRound(roomCode);
  }
}

function endRound(roomCode: string) {
  const room = rooms.get(roomCode);
  if (!room || (room.phase !== 'signal_active' && room.phase !== 'waiting_for_signal')) return;

  clearRoomTimers(roomCode);

  // Fill in missed reactions for players who didn't react
  Object.values(room.players).forEach((p) => {
    if (!p.currentRoundReaction) {
      p.currentRoundReaction = {
        reactionTimeMs: null,
        falseStart: false,
        pointsEarned: 0,
      };
    }

    // Add points to cumulative score
    p.score += p.currentRoundReaction.pointsEarned;

    // Record history
    p.roundHistory.push({
      round: room.currentRound,
      reactionTimeMs: p.currentRoundReaction.reactionTimeMs,
      falseStart: p.currentRoundReaction.falseStart,
      points: p.currentRoundReaction.pointsEarned,
      rank: p.currentRoundReaction.rank,
    });
  });

  // Find round winner
  const roundWinner = Object.values(room.players).find((p) => p.currentRoundReaction?.rank === 1);
  room.lastRoundWinnerId = roundWinner ? roundWinner.id : null;

  room.phase = 'round_results';
  room.resultsCountdownSec = 6;

  broadcastToRoom(roomCode, { type: 'round_ended', state: room });

  // Auto-advance ticker for round results (6 seconds)
  let count = 5;
  const interval = setInterval(() => {
    const current = rooms.get(roomCode);
    if (!current || current.phase !== 'round_results') {
      clearInterval(interval);
      return;
    }
    current.resultsCountdownSec = count;
    broadcastToRoom(roomCode, { type: 'room_state', state: current, yourPlayerId: '' });
    count--;

    if (count < 0) {
      clearInterval(interval);
      if (current.currentRound >= current.totalRounds) {
        // Game Over!
        endGame(roomCode);
      } else {
        // Advance to next round
        current.currentRound += 1;
        startRound(roomCode);
      }
    }
  }, 1000);
  addTimer(roomCode, interval as unknown as NodeJS.Timeout);
}

function endGame(roomCode: string) {
  const room = rooms.get(roomCode);
  if (!room) return;

  clearRoomTimers(roomCode);
  room.phase = 'game_over';

  // Determine overall winner (highest score; tiebreaker: fastest reaction)
  const sorted = Object.values(room.players).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aFastest = Math.min(...a.roundHistory.map((h) => h.reactionTimeMs || 9999));
    const bFastest = Math.min(...b.roundHistory.map((h) => h.reactionTimeMs || 9999));
    return aFastest - bFastest;
  });

  const winner = sorted[0];
  broadcastToRoom(roomCode, {
    type: 'game_ended',
    state: room,
    winnerId: winner ? winner.id : '',
  });
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  app.use(express.json());

  // Health endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      activeRooms: rooms.size,
      connectedClients: socketMeta.size,
      time: new Date().toISOString(),
    });
  });

  // Room lookup endpoint
  app.get('/api/rooms/:code', (req, res) => {
    const code = req.params.code.toUpperCase();
    const room = rooms.get(code);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json({
      roomCode: room.roomCode,
      phase: room.phase,
      playerCount: Object.keys(room.players).length,
      currentRound: room.currentRound,
    });
  });

  // WebSocket message handling
  wss.on('connection', (ws: WebSocket) => {
    ws.on('message', (data: string) => {
      try {
        const msg = JSON.parse(data.toString()) as ClientMessage;

        if (msg.type === 'create_room') {
          const roomCode = generateRoomCode();
          const playerId = msg.playerId || `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const hostPlayer: Player = {
            id: playerId,
            name: msg.playerName.trim() || 'Sheriff',
            avatar: msg.avatar || '🤠',
            color: msg.color || '#f59e0b',
            isHost: true,
            isBot: false,
            score: 0,
            connected: true,
            roundHistory: [],
          };

          const newRoom: RoomState = {
            roomCode,
            hostId: playerId,
            phase: 'lobby',
            currentRound: 1,
            totalRounds: 5,
            countdownNumber: 3,
            signalTimestamp: null,
            signalWord: 'DRAW! ⚡',
            roundTimeLimitMs: 3500,
            resultsCountdownSec: 5,
            players: { [playerId]: hostPlayer },
          };

          rooms.set(roomCode, newRoom);
          socketMeta.set(ws, { roomCode, playerId });

          sendToSocket(ws, {
            type: 'room_state',
            state: newRoom,
            yourPlayerId: playerId,
          });
          return;
        }

        if (msg.type === 'join_room') {
          const roomCode = msg.roomCode.trim().toUpperCase();
          const room = rooms.get(roomCode);
          if (!room) {
            sendToSocket(ws, { type: 'error', message: `Room "${roomCode}" not found.` });
            return;
          }

          const existingPlayerId = msg.playerId;
          let playerId = existingPlayerId || `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

          // Check if reconnecting existing player
          if (existingPlayerId && room.players[existingPlayerId]) {
            playerId = existingPlayerId;
            const existing = room.players[playerId];
            existing.connected = true;
            if (msg.playerName) existing.name = msg.playerName;
            if (msg.avatar) existing.avatar = msg.avatar;
            if (msg.color) existing.color = msg.color;
          } else {
            // Cannot join if game is actively running in rounds, unless back in lobby or reconnecting
            if (room.phase !== 'lobby' && room.phase !== 'game_over') {
              sendToSocket(ws, { type: 'error', message: 'Match already in progress. Please wait for the next duel.' });
              return;
            }

            const newPlayer: Player = {
              id: playerId,
              name: msg.playerName.trim() || `Player ${Object.keys(room.players).length + 1}`,
              avatar: msg.avatar || '🤠',
              color: msg.color || '#3b82f6',
              isHost: Object.keys(room.players).length === 0,
              isBot: false,
              score: 0,
              connected: true,
              roundHistory: [],
            };
            room.players[playerId] = newPlayer;
          }

          socketMeta.set(ws, { roomCode, playerId });
          broadcastToRoom(roomCode, { type: 'room_state', state: room, yourPlayerId: playerId });
          return;
        }

        const meta = socketMeta.get(ws);
        if (!meta) return;
        const { roomCode, playerId } = meta;
        const room = rooms.get(roomCode);
        if (!room) return;

        if (msg.type === 'start_game') {
          // Only host can start
          if (room.hostId !== playerId && !room.players[playerId]?.isHost) {
            sendToSocket(ws, { type: 'error', message: 'Only the host can start the game.' });
            return;
          }
          const activeCount = Object.keys(room.players).length;
          if (activeCount < 1) {
            sendToSocket(ws, { type: 'error', message: 'Need at least 1 player to start.' });
            return;
          }

          // Reset all scores & rounds
          room.currentRound = 1;
          Object.values(room.players).forEach((p) => {
            p.score = 0;
            p.roundHistory = [];
            p.currentRoundReaction = undefined;
          });

          startRound(roomCode);
          return;
        }

        if (msg.type === 'player_draw') {
          handlePlayerDraw(roomCode, playerId);
          return;
        }

        if (msg.type === 'next_round') {
          // Host can manually advance from round_results early
          if (room.phase === 'round_results') {
            if (room.currentRound >= room.totalRounds) {
              endGame(roomCode);
            } else {
              room.currentRound += 1;
              startRound(roomCode);
            }
          }
          return;
        }

        if (msg.type === 'restart_game') {
          // Host can restart the match
          if (room.hostId === playerId || room.players[playerId]?.isHost) {
            clearRoomTimers(roomCode);
            room.phase = 'lobby';
            room.currentRound = 1;
            Object.values(room.players).forEach((p) => {
              p.score = 0;
              p.roundHistory = [];
              p.currentRoundReaction = undefined;
            });
            broadcastToRoom(roomCode, { type: 'room_state', state: room, yourPlayerId: '' });
          }
          return;
        }

        if (msg.type === 'add_bot') {
          if (room.phase !== 'lobby') return;
          const currentBots = Object.values(room.players).filter((p) => p.isBot);
          if (currentBots.length >= BOT_NAMES.length) {
            sendToSocket(ws, { type: 'error', message: 'Maximum bots reached.' });
            return;
          }
          const botTemplate = BOT_NAMES[currentBots.length];
          const botId = `bot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const botPlayer: Player = {
            id: botId,
            name: botTemplate.name,
            avatar: botTemplate.avatar,
            color: botTemplate.color,
            isHost: false,
            isBot: true,
            score: 0,
            connected: true,
            roundHistory: [],
          };
          room.players[botId] = botPlayer;
          broadcastToRoom(roomCode, { type: 'room_state', state: room, yourPlayerId: '' });
          return;
        }

        if (msg.type === 'remove_bot') {
          if (room.phase !== 'lobby') return;
          if (room.players[msg.botId]?.isBot) {
            delete room.players[msg.botId];
            broadcastToRoom(roomCode, { type: 'room_state', state: room, yourPlayerId: '' });
          }
          return;
        }

        if (msg.type === 'leave_room') {
          handlePlayerLeave(ws);
          return;
        }
      } catch (err) {
        console.error('WebSocket message parsing error:', err);
      }
    });

    ws.on('close', () => {
      handlePlayerLeave(ws);
    });

    ws.on('error', (err) => {
      console.error('WebSocket connection error:', err);
    });
  });

  function handlePlayerLeave(ws: WebSocket) {
    const meta = socketMeta.get(ws);
    if (!meta) return;
    const { roomCode, playerId } = meta;
    socketMeta.delete(ws);

    const room = rooms.get(roomCode);
    if (!room) return;

    const player = room.players[playerId];
    if (player) {
      if (room.phase === 'lobby') {
        // Remove completely in lobby
        delete room.players[playerId];
      } else {
        // Mark disconnected during active game
        player.connected = false;
      }
    }

    // Check if room is empty
    const remainingHumans = Object.values(room.players).filter((p) => !p.isBot && p.connected);
    if (remainingHumans.length === 0) {
      clearRoomTimers(roomCode);
      rooms.delete(roomCode);
      return;
    }

    // If host left, transfer host
    if (room.hostId === playerId) {
      const nextHost = remainingHumans[0];
      if (nextHost) {
        room.hostId = nextHost.id;
        nextHost.isHost = true;
      }
    }

    broadcastToRoom(roomCode, { type: 'room_state', state: room, yourPlayerId: '' });
  }

  // Vite middleware in dev or static files in production
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🎯 Quick Draw Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Quick Draw server:', err);
});
