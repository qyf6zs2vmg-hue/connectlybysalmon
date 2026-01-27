
export interface User {
  id: string; // 4-digit ID
  name: string;
  avatar: string;
  joinedAt: string;
}

export interface Contact {
  id: string;
  name: string;
  connectId: string;
}

export type CallStatus = 'idle' | 'calling' | 'receiving' | 'connected';

export type Language = 'en' | 'ru' | 'uz';

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'candidate';
  senderId: string;
  targetId: string;
  payload: any;
}
