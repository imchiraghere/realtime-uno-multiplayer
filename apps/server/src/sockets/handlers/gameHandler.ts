import { Socket, Server } from 'socket.io';
import { gameService } from '../../modules/game/game.service';
import { CardColor } from '../../modules/game/engine/card';

export function registerGameHandlers(io: Server, socket: Socket, userId: string): void {
  socket.on('play_card', async (data: { roomId: string; cardId: string; chosenColor?: CardColor }) => {
    try {
      const newState = await gameService.processPlayCard(data.roomId, userId, data.cardId, data.chosenColor);
      
      io.to(data.roomId).emit('card_played', {
        playerId: userId,
        cardId: data.cardId,
        chosenColor: data.chosenColor,
      });
      
      // Broadcast personalized state (including private hand) to each player
      await gameService.broadcastState(data.roomId, newState);
      
      if (newState.phase === 'finished') {
        io.to(data.roomId).emit('game_over', {
          winner: newState.winner,
          players: newState.players.map(p => ({ id: p.id, username: p.username, score: p.score })),
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error playing card';
      socket.emit('error_message', { message });
    }
  });
  
  socket.on('draw_card', async (data: { roomId: string }) => {
    try {
      const newState = await gameService.processDrawCard(data.roomId, userId);
      
      io.to(data.roomId).emit('card_drawn', { playerId: userId });
      
      // Broadcast personalized state (including private hand) to each player
      await gameService.broadcastState(data.roomId, newState);
      
      if (newState.phase === 'finished') {
        io.to(data.roomId).emit('game_over', {
          winner: newState.winner,
          players: newState.players.map(p => ({ id: p.id, username: p.username, score: p.score })),
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error drawing card';
      socket.emit('error_message', { message });
    }
  });
  
  socket.on('declare_uno', async (data: { roomId: string }) => {
    try {
      const newState = await gameService.processDeclareUno(data.roomId, userId);
      io.to(data.roomId).emit('uno_declared', { playerId: userId });
      await gameService.broadcastState(data.roomId, newState);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error declaring UNO';
      socket.emit('error_message', { message });
    }
  });
  
  socket.on('challenge_wild_draw_four', async (data: { roomId: string }) => {
    try {
      const newState = await gameService.processChallenge(data.roomId, userId);
      io.to(data.roomId).emit('challenge_result', {
        challengerId: userId,
        success: !newState.challengeWindow?.active,
      });
      await gameService.broadcastState(data.roomId, newState);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error challenging';
      socket.emit('error_message', { message });
    }
  });
  
  socket.on('choose_wild_color', async (data: { roomId: string; color: CardColor }) => {
    try {
      const newState = await gameService.processChooseColor(data.roomId, userId, data.color);
      io.to(data.roomId).emit('color_changed', { color: data.color, playerId: userId });
      await gameService.broadcastState(data.roomId, newState);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error choosing color';
      socket.emit('error_message', { message });
    }
  });
  
  socket.on('request_game_state', async (data: { roomId: string }) => {
    try {
      const state = await gameService.getGameState(data.roomId);
      if (!state) { socket.emit('error_message', { message: 'Game not found' }); return; }
      await socket.join(data.roomId);
      const publicState = gameService.getPublicState(state, userId);
      socket.emit('game_state_updated', { state: publicState });
      socket.emit('private_state_updated', { state: publicState });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error';
      socket.emit('error_message', { message });
    }
  });
  
  socket.on('reconnect_player', async (data: { roomId: string }) => {
    try {
      const state = await gameService.handlePlayerReconnect(data.roomId, userId);
      if (!state) { socket.emit('error_message', { message: 'Game not found' }); return; }
      await socket.join(data.roomId);
      const publicState = gameService.getPublicState(state, userId);
      socket.emit('game_state_updated', { state: publicState });
      socket.emit('private_state_updated', { state: publicState });
      io.to(data.roomId).emit('player_reconnected', { playerId: userId });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error reconnecting';
      socket.emit('error_message', { message });
    }
  });

  socket.on('rematch', async (data: { roomId: string }) => {
    try {
      io.to(data.roomId).emit('rematch_requested', { playerId: userId });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error requesting rematch';
      socket.emit('error_message', { message });
    }
  });
}
