// Backend configuration
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8081';

// API endpoints
export const API = {
  WAR_BATTLE: {
    INITIALIZE: `${BACKEND_URL}/api/war-battle/initialize`,
    FIND: `${BACKEND_URL}/api/war-battle/find`,
  },
  INVITATIONS: (address: string) => `${BACKEND_URL}/api/invitations/${address}`,
  ROOMS: {
    CLEAR: `${BACKEND_URL}/api/rooms/clear`,
  },
};
