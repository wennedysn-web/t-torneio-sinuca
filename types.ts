
export interface Participant {
  id: string;
  name: string;
  entryNumbers: number[]; // Max 3, between 1-200
}

export interface Entry {
  number: number;
  participantId: string;
  participantName: string;
  status: 'active' | 'eliminated' | 'winner';
  currentRound: number;
}

export interface Match {
  id: string;
  round: number;
  entry1: number | null;
  entry2: number | null;
  winner: number | null;
  isBye: boolean;
  timestamp: number;
}

export type AppView = 'visitor' | 'admin-login' | 'admin-participants' | 'admin-matches';

export interface TournamentState {
  participants: Participant[];
  entries: Entry[];
  matches: Match[];
  currentRound: number;
  isAdmin: boolean;
}
