/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  wallet: number;
  esewaId?: string;
  ffUid?: string;
  ffIgn?: string;
  ffUidLocked?: boolean;
  ffIgnLocked?: boolean;
  totalKills?: number;
  totalDeposited?: number;
  totalWinnings?: number;
  totalMatches?: number;
  totalWins?: number;
  role?: "user" | "admin";
  createdAt?: any;
}

export interface Tournament {
  id: string;
  title: string;
  gameType: string;
  startTime?: any;
  entryFee: number;
  prizePool: number;
  currentPlayers: number;
  maxPlayers: number;
  bannerUrl?: string;
  status: "upcoming" | "playing" | "ended";
  rules?: string;
  winnerName?: string;
}

export interface TournamentRegistration {
  id: string;
  tournamentId: string;
  tournamentTitle: string;
  userId: string;
  userName: string;
  registeredAt: any;
  status: "registered" | "played" | "disqualified";
  entryFee: number;
}

export interface Transaction {
  id?: string;
  userId: string;
  amount: number;
  type: "credit" | "debit";
  description: string;
  status: "pending" | "completed" | "failed";
  createdAt: any;
}

export interface DepositRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  transactionId: string;
  status: "pending" | "approved" | "rejected";
  createdAt: any;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  esewaId: string;
  status: "pending" | "approved" | "rejected";
  createdAt: any;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "update" | "danger" | "success" | "info";
  createdAt: any;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: "start" | "results" | "announcement" | "general";
  isRead: boolean;
  createdAt: any;
  referenceId?: string;
}

export type ActiveTab = "home" | "tournaments" | "leaderboard" | "wallet" | "profile";
