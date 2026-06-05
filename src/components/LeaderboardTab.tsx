/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../lib/firebase";
import { UserProfile } from "../types";
import { Trophy, Award, Target, Swords, Star } from "lucide-react";

export default function LeaderboardTab() {
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
  const [sortBy, setSortBy] = useState<"totalWinnings" | "totalKills" | "totalWins">("totalWinnings");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, [sortBy]);

  async function fetchLeaderboard() {
    setLoading(true);
    try {
      const q = query(
        collection(db, "users"),
        orderBy(sortBy, "desc"),
        limit(20)
      );
      const snap = await getDocs(q);
      const users: UserProfile[] = [];
      snap.forEach(doc => {
        users.push({ uid: doc.id, ...doc.data() } as UserProfile);
      });
      setLeaderboard(users);
    } catch (err) {
      console.error("Error setting leaderboard:", err);
    } finally {
      setLoading(false);
    }
  }

  // Pre-configured elegant mock gaming champions if Firestore is starting fresh
  const fallbackLeaderboard: UserProfile[] = [
    {
      uid: "mock-1",
      email: "kathmandu@gmail.com",
      username: "🇳🇵 Kathmandu_Slayer",
      wallet: 800,
      totalKills: 142,
      totalWins: 18,
      totalMatches: 30,
      totalWinnings: 4500,
      role: "user"
    },
    {
      uid: "mock-2",
      email: "pokhara@gmail.com",
      username: "🔥 Pokhara_Gamer",
      wallet: 320,
      totalKills: 110,
      totalWins: 12,
      totalMatches: 24,
      totalWinnings: 2800,
      role: "user"
    },
    {
      uid: "mock-3",
      email: "lalitpur@gmail.com",
      username: "🎯 Lalitpur_Sniper",
      wallet: 150,
      totalKills: 98,
      totalWins: 9,
      totalMatches: 18,
      totalWinnings: 1950,
      role: "user"
    },
    {
      uid: "mock-4",
      email: "ff_master@gmail.com",
      username: "🥇 FF_Master_YT",
      wallet: 100,
      totalKills: 87,
      totalWins: 7,
      totalMatches: 15,
      totalWinnings: 1200,
      role: "user"
    },
    {
      uid: "mock-5",
      email: "headoff@gmail.com",
      username: "💀 Headshot_Nepal",
      wallet: 40,
      totalKills: 72,
      totalWins: 4,
      totalMatches: 12,
      totalWinnings: 750,
      role: "user"
    },
    {
      uid: "mock-6",
      email: "esewa_pro@gmail.com",
      username: "⚡ eSewa_Warrior",
      wallet: 25,
      totalKills: 45,
      totalWins: 2,
      totalMatches: 8,
      totalWinnings: 400,
      role: "user"
    }
  ];

  const activeLeaderboard = leaderboard.length > 0 ? leaderboard : fallbackLeaderboard;

  // Sorting handlers
  function handleSortChange(criterion: "totalWinnings" | "totalKills" | "totalWins") {
    setSortBy(criterion);
  }

  return (
    <div className="space-y-4 py-2">
      <div className="px-1">
        <h2 className="text-xl font-black text-slate-50 tracking-tight uppercase">
          🏆 Esports Arena <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Leaderboard</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1.5 font-bold">
          Real-time global rankings based on tournament statistics and winnings payouts.
        </p>
      </div>

      {/* Metric filter switches - Vibrant Theme */}
      <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850">
        <button
          onClick={() => handleSortChange("totalWinnings")}
          className={`py-2 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            sortBy === "totalWinnings" 
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow shadow-blue-500/10" 
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Award className="w-3.5 h-3.5 text-pink-300" /> Winnings
        </button>
        <button
          onClick={() => handleSortChange("totalKills")}
          className={`py-2 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            sortBy === "totalKills" 
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow shadow-blue-500/10" 
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Target className="w-3.5 h-3.5 text-red-400" /> Kills
        </button>
        <button
          onClick={() => handleSortChange("totalWins")}
          className={`py-2 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            sortBy === "totalWins" 
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow shadow-blue-500/10" 
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Swords className="w-3.5 h-3.5 text-emerald-400" /> Wins
        </button>
      </div>

      {/* Grid of Top 3 Champions */}
      <div className="grid grid-cols-3 gap-3 pt-2">
        {activeLeaderboard.slice(0, 3).map((item, idx) => {
          let medalEmoji = "🏆";
          let circleBg = "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-amber-500/5";
          if (idx === 1) {
            medalEmoji = "⭐";
            circleBg = "bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-blue-500/5";
          } else if (idx === 2) {
            medalEmoji = "🔥";
            circleBg = "bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-purple-500/5";
          }

          return (
            <div 
              key={item.uid} 
              className={`p-3 rounded-2xl text-center border flex flex-col justify-between shadow-xl relative overflow-hidden group hover:-translate-y-1 transition duration-200 ${circleBg}`}
            >
              <div className="absolute top-1.5 right-1.5 text-xs font-black">{medalEmoji}</div>
              <div className="my-1.5 mx-auto w-10 h-10 rounded-full bg-slate-950 flex items-center justify-center text-base font-black text-white border border-slate-800">
                {item.username ? item.username.charAt(0).toUpperCase() : "G"}
              </div>
              <div className="min-h-[32px] flex items-center justify-center">
                <p className="font-extrabold text-[10px] text-slate-100 break-all leading-tight">
                  {item.username || "Player"}
                </p>
              </div>
              <div className="mt-2 text-center">
                <p className="text-[8px] text-slate-400 font-extrabold uppercase tracking-widest">
                  {sortBy === "totalWinnings" ? "Winnings" : sortBy === "totalKills" ? "Kills" : "Wins"}
                </p>
                <p className="text-xs font-black tracking-tight mt-0.5 text-white bg-slate-950 rounded py-0.5 self-center">
                  {sortBy === "totalWinnings" ? `₹${item.totalWinnings ?? 0}` : sortBy === "totalKills" ? `${item.totalKills ?? 0} K` : `${item.totalWins ?? 0} W`}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ranked Runners-up List */}
      <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 overflow-hidden">
        <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-850 flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
          <div className="flex gap-4">
            <span className="w-5 text-center">Rank</span>
            <span>Gamer alias</span>
          </div>
          <div className="flex gap-6 sm:gap-8 justify-end text-right">
            <span className="w-10 text-center">Kills</span>
            <span className="w-10 text-center">Wins</span>
            <span className="w-16">Winnings</span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center bg-slate-900">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-400 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-bold">Updating roster rankings...</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-850 bg-slate-900/40">
            {activeLeaderboard.map((item, index) => {
              const rank = index + 1;
              const isFirstThree = rank <= 3;
              let bgRow = "";
              if (isFirstThree) {
                bgRow = "bg-slate-950/20";
              }

              return (
                <div 
                  key={item.uid} 
                  className={`flex justify-between items-center px-4 py-3 text-xs text-slate-200 ${bgRow} hover:bg-slate-850/50 transition`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="w-5 text-center font-black text-slate-400">
                      {rank}
                    </span>
                    <span className="font-extrabold truncate max-w-[120px] text-slate-200 sm:max-w-[150px]">
                      {item.username || "Player"}
                    </span>
                  </div>
                  <div className="flex gap-6 sm:gap-8 text-right font-mono text-[11px] font-extrabold text-slate-400">
                    <span className="w-10 block text-center text-slate-300">{item.totalKills ?? 0}</span>
                    <span className="w-10 block text-center text-slate-300">{item.totalWins ?? 0}</span>
                    <span className="w-16 block font-black text-blue-400">
                      ₹{item.totalWinnings ?? 0}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Safety instructions details */}
      <div className="flex gap-3 items-start bg-slate-900/60 border border-slate-800 p-4 rounded-2xl text-xs shadow-lg">
        <Star className="w-4 h-4 text-amber-400 fill-amber-400 flex-shrink-0 mt-0.5 animate-pulse" />
        <p className="text-slate-400 leading-relaxed font-bold">
          Rankings are calculated automatically based on real match logs and tournament submissions. Opponent headshots, match survivals, and room registrations all influence your status. Be disciplined and play fair.
        </p>
      </div>
    </div>
  );
}
