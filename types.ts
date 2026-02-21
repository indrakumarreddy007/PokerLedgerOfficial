
export type Role = 'admin' | 'player';
export type BuyInStatus = 'pending' | 'approved' | 'rejected';
export type SessionStatus = 'active' | 'closed';

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  mobile?: string;
}

export interface Session {
  id: string;
  name: string;
  sessionCode: string;
  createdBy: string; // userId
  groupId?: string; // Optional link to a tenant Group
  status: SessionStatus;
  createdAt: number;
  closedAt?: number;
  blindValue?: string;
}

export type GroupRole = 'owner' | 'admin' | 'member';

export interface Group {
  id: string;
  name: string;
  joinCode: string;
  createdBy: string;
  createdAt: number;
}

export interface GroupMember {
  groupId: string;
  userId: string;
  role: GroupRole;
  joinedAt: number;
}

export interface SessionPlayer {
  sessionId: string;
  userId: string;
  name: string;
  role: Role;
  finalWinnings?: number;
}

export interface BuyIn {
  id: string;
  sessionId: string;
  userId: string;
  amount: number;
  status: BuyInStatus;
  timestamp: number;
}

export interface Settlement {
  from: string; // Name
  to: string; // Name
  amount: number;
}

export interface PlayerStats {
  weeklyPL: number;
  monthlyPL: number;
  yearlyPL: number;
  totalPL: number;
}
