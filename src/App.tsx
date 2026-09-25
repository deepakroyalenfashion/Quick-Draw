import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { RoomState, ServerMessage, ClientMessage } from './types/game';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { LobbyView } from './components/LobbyView';
import { GameView } from './components/GameView';
import { RoundResultsView } from './components/RoundResultsView';
import { GameOverView } from './components/GameOverView';
import { RulesModal } from './components/RulesModal';
import { sounds } from './utils/audio';

const STORAGE_KEYS = {
  NAME: 'quickdraw_player_name',
  AVATAR: 'quickdraw_player_avatar',
  COLOR: 'quickdraw_player_color',
  PLAYER_ID: 'quickdraw_player_id',
};

export default function App() {
  // Player identity
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.NAME) || 'Quick Draw';
  });
  const [avatar, setAvatar] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.AVATAR) || '🤠';
  });
  const [color, setColor] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.COLOR) || '#f59e0b';
  });
  const [playerId] = useState<string>(() => {
    let id = localStorage.getItem(STORAGE_KEYS.PLAYER_ID);
    if (!id) {
      id = `p_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      localStorage.setItem(STORAGE_KEYS.PLAYER_ID, id);
    }
    return id;
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NAME, playerName);
  }, [playerName]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AVATAR, avatar);
  }, [avatar]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COLOR, color);
  }, [color]);

  // Game & Networking state
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const pendingBotAddRef = useRef(false);

  // Send message safely
  const sendMessage = useCallback((msg: ClientMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    } else {
      console.warn('Socket not open, cannot send message:', msg);
    }
  }, []);

  // Initialize WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setErrorMessage(null);
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Auto-reconnect after 2 seconds
      setTimeout(() => {
        if (!socketRef.current || socketRef.current.readyState === WebSocket.CLOSED) {
          connectWebSocket();
        }
      }, 2000);
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as ServerMessage;

        if (msg.type === 'room_state') {
          setRoomState(msg.state);

          // If solo practice triggered, automatically add a bot once room is ready
          if (pendingBotAddRef.current && msg.state.phase === 'lobby') {
            pendingBotAddRef.current = false;
            sendMessage({ type: 'add_bot' });
          }
          return;
        }

        if (msg.type === 'countdown_tick') {
          setRoomState((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              phase: 'countdown',
              countdownNumber: msg.count,
            };
          });
          return;
        }

        if (msg.type === 'signal_fired') {
          setRoomState((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              phase: 'signal_active',
              signalTimestamp: msg.signalTimestamp,
              signalWord: msg.signalWord,
            };
          });
          return;
        }

        if (msg.type === 'player_reacted') {
          setRoomState((prev) => {
            if (!prev) return null;
            const updatedPlayers = { ...prev.players };
            const player = updatedPlayers[msg.playerId];
            if (player) {
              player.currentRoundReaction = {
                reactionTimeMs: msg.reactionTimeMs,
                falseStart: msg.falseStart,
                rank: msg.rank,
                pointsEarned: msg.rank === 1 ? 3 : msg.rank === 2 ? 2 : msg.rank === 3 ? 1 : 0,
              };
            }
            return {
              ...prev,
              players: updatedPlayers,
            };
          });
          return;
        }

        if (msg.type === 'round_ended') {
          setRoomState(msg.state);
          return;
        }

        if (msg.type === 'game_ended') {
          setRoomState(msg.state);
          return;
        }

        if (msg.type === 'error') {
          setErrorMessage(msg.message);
          setTimeout(() => setErrorMessage(null), 4000);
          return;
        }
      } catch (err) {
        console.error('Failed to parse server message:', err);
      }
    };
  }, [sendMessage]);

  useEffect(() => {
    connectWebSocket();

    // Check if URL has ?room=CODE
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      // Auto join if socket opens
      const timer = setTimeout(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          sendMessage({
            type: 'join_room',
            roomCode: roomParam.toUpperCase(),
            playerName,
            avatar,
            color,
            playerId,
          });
        }
      }, 500);
      return () => clearTimeout(timer);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connectWebSocket, playerId, playerName, avatar, color, sendMessage]);

  // Actions
  const handleCreateRoom = () => {
    sendMessage({
      type: 'create_room',
      playerName,
      avatar,
      color,
      playerId,
    });
  };

  const handleJoinRoom = (code: string) => {
    sendMessage({
      type: 'join_room',
      roomCode: code.toUpperCase(),
      playerName,
      avatar,
      color,
      playerId,
    });
  };

  const handleSoloPractice = () => {
    pendingBotAddRef.current = true;
    sendMessage({
      type: 'create_room',
      playerName,
      avatar,
      color,
      playerId,
    });
  };

  const handleStartGame = () => {
    sendMessage({ type: 'start_game' });
  };

  const handlePlayerDraw = () => {
    sendMessage({
      type: 'player_draw',
      clientTime: Date.now(),
    });
  };

  const handleNextRound = () => {
    sendMessage({ type: 'next_round' });
  };

  const handleRestartGame = () => {
    sendMessage({ type: 'restart_game' });
  };

  const handleAddBot = () => {
    sendMessage({ type: 'add_bot' });
  };

  const handleRemoveBot = (botId: string) => {
    sendMessage({ type: 'remove_bot', botId });
  };

  const handleLeaveRoom = () => {
    sendMessage({ type: 'leave_room' });
    setRoomState(null);
    // Remove query param from URL
    window.history.replaceState({}, '', window.location.pathname);
  };

  const handleToggleMute = () => {
    const nextMuted = sounds.toggleMute();
    setIsMuted(nextMuted);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <Navbar
        roomCode={roomState?.roomCode}
        isConnected={isConnected}
        onOpenRules={() => setIsRulesOpen(true)}
        onLeaveRoom={roomState ? handleLeaveRoom : undefined}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* Floating Error Alert */}
      {errorMessage && (
        <div className="fixed top-16 inset-x-0 mx-auto max-w-sm z-50 px-4">
          <div className="bg-red-950 border border-red-700 text-red-200 text-xs py-2 px-4 rounded-xl shadow-2xl text-center">
            {errorMessage}
          </div>
        </div>
      )}

      {/* Main View Router */}
      <main className="flex-1 flex flex-col">
        {!roomState ? (
          <HomeView
            playerName={playerName}
            setPlayerName={setPlayerName}
            avatar={avatar}
            setAvatar={setAvatar}
            color={color}
            setColor={setColor}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onSoloPractice={handleSoloPractice}
            isConnecting={!isConnected}
          />
        ) : roomState.phase === 'lobby' ? (
          <LobbyView
            roomState={roomState}
            myPlayerId={playerId}
            onStartGame={handleStartGame}
            onAddBot={handleAddBot}
            onRemoveBot={handleRemoveBot}
          />
        ) : roomState.phase === 'countdown' ||
          roomState.phase === 'waiting_for_signal' ||
          roomState.phase === 'signal_active' ? (
          <GameView
            roomState={roomState}
            myPlayerId={playerId}
            onPlayerDraw={handlePlayerDraw}
          />
        ) : roomState.phase === 'round_results' ? (
          <RoundResultsView
            roomState={roomState}
            myPlayerId={playerId}
            onNextRound={handleNextRound}
          />
        ) : roomState.phase === 'game_over' ? (
          <GameOverView
            roomState={roomState}
            myPlayerId={playerId}
            onRestartGame={handleRestartGame}
            onLeaveRoom={handleLeaveRoom}
          />
        ) : null}
      </main>

      {/* Rules Modal */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
    </div>
  );
}
