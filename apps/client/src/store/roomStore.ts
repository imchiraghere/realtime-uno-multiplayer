import { create } from 'zustand';
import { GameRoom } from '../types/room';

interface RoomStore {
  currentRoom: GameRoom | null;
  publicRooms: GameRoom[];
  
  setCurrentRoom: (room: GameRoom | null) => void;
  setPublicRooms: (rooms: GameRoom[]) => void;
  updateRoom: (room: GameRoom) => void;
}

export const useRoomStore = create<RoomStore>((set) => ({
  currentRoom: null,
  publicRooms: [],
  
  setCurrentRoom: (room) => set({ currentRoom: room }),
  setPublicRooms: (rooms) => set({ publicRooms: rooms }),
  updateRoom: (room) => set({ currentRoom: room }),
}));
