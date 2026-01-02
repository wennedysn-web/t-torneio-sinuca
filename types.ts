
export interface Participant {
  id: string;
  name: string;
  entryNumbers: number[]; 
}

export interface Entry {
  number: number;
  participantId: string;
  participantName: string;
  status: 'active' | 'eliminated' | 'winner';
  currentRound: number;
}

export type MatchStatus = 'pending' | 'in-progress' | 'finished';

export interface Match {
  id: string;
  round: number;
  entry1: number | null;
  entry2: number | null;
  winner: number | null;
  isBye: boolean;
  timestamp: number;
  status: MatchStatus;
  isVisible: boolean;
}

export interface TournamentEvent {
  id: string;
  type: 'registration' | 'match-pending' | 'match-progress' | 'match-finished';
  message: string;
  timestamp: number;
  details?: any;
}

export type AppView = 'visitor' | 'admin-login' | 'admin-participants' | 'admin-matches' | 'admin-logs';

export interface TournamentState {
  participants: Participant[];
  entries: Entry[];
  matches: Match[];
  currentRound: number;
  isAdmin: boolean;
  events: TournamentEvent[];
}
