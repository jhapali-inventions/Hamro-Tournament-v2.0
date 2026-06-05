/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { collection, getDocs, limit, query, where, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Tournament, Announcement, UserProfile } from "../types";
import { 
  Trophy, 
  Tv, 
  MessageCircle, 
  Users, 
  ChevronRight, 
  Bell, 
  BookOpen, 
  Compass, 
  ShieldAlert, 
  Flame, 
  Skull 
} from "lucide-react";

interface HomeTabProps {
  userProfile: UserProfile;
  onNavigateTab: (tab: "home" | "tournaments" | "leaderboard" | "wallet" | "profile") => void;
  openModal: (type: "terms" | "about" | "announcements" | "tutorial") => void;
}

export default function HomeTab({ userProfile, onNavigateTab, openModal }: HomeTabProps) {
  const [featuredTourneys, setFeaturedTourneys] = useState<Tournament[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFeaturedData();
  }, []);

  async function fetchFeaturedData() {
    setLoading(true);
    try {
      // Fetch upcoming tournaments
      const q = query(
        collection(db, "tournaments"), 
        where("status", "==", "upcoming"), 
        limit(2)
      );
      const snap = await getDocs(q);
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tournament));
      setFeaturedTourneys(items);

      // Fetch latest announcements
      const qAnn = query(
        collection(db, "announcements"),
        orderBy("createdAt", "desc"),
        limit(3)
      );
      const snapAnn = await getDocs(qAnn);
      const annList = snapAnn.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
      setAnnouncements(annList);
    } catch (err) {
      console.error("Error setting featured items:", err);
    } finally {
      setLoading(false);
    }
  }

  // Best of fallback announcements if db is unseeded
  const fallbackAnnouncements: Announcement[] = [
    {
      id: "fallback-1",
      title: "💰 Official eSewa Wallet Support",
      content: "Ensure you make payments only to the registered number 9841234567. Provide details and screenshots directly to instant support chat.",
      type: "success",
      createdAt: null
    },
    {
      id: "fallback-2",
      title: "⚠️ UID Locking Mechanism",
      content: "Once you save your Free Fire UID and nickname inside the Profile settings, they are locked, and changes are disabled to enforce authentic ranking results.",
      type: "danger",
      createdAt: null
    }
  ];

  const activeAnnouncements = announcements.length > 0 ? announcements : fallbackAnnouncements;

  return (
    <div className="space-y-5 py-2">
      {/* Dynamic Welcome Hero Banner - Vibrant Gradient */}
      <div className="bg-gradient-to-tr from-blue-600 via-indigo-600 to-pink-500 text-white p-5 rounded-2xl shadow-xl shadow-blue-500/15 relative overflow-hidden select-none border border-white/10">
        {/* Subtle decorative circles */}
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse" />
        <div className="absolute -left-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />

        <div className="relative">
          <span className="bg-white/15 text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
            🏆 Nepal's Gaming Arena
          </span>
          <h2 className="text-xl font-black mt-4 tracking-tight uppercase">
            Hi, {userProfile.username || "Gamer"}!
          </h2>
          <p className="text-xs text-slate-100/90 mt-1.5 leading-relaxed font-medium">
            Ready to show your skills? Choose from upcoming Free Fire matches, kill opponents, and get instant payouts to your eSewa account!
          </p>

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => onNavigateTab("tournaments")}
              className="bg-white text-blue-600 hover:text-indigo-600 px-4 py-2 rounded-xl text-xs font-black shadow-lg hover:bg-slate-50 transition active:scale-95 cursor-pointer"
            >
              Explore Tournaments
            </button>
            <button
              onClick={() => openModal("tutorial")}
              className="flex items-center gap-1.5 bg-slate-900/40 text-white border border-white/15 px-3 py-2 rounded-xl text-xs font-black backdrop-blur-md hover:bg-slate-900/60 transition cursor-pointer"
            >
              <Tv className="w-3.5 h-3.5 text-pink-300" /> Tutorial Video
            </button>
          </div>
        </div>
      </div>

      {/* Grid of iOS style Gaming Statistics */}
      <div>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">
          📊 Gaming Analytics
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3 shadow-lg hover:border-slate-750 transition-all">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Matches</p>
              <p className="text-lg font-black text-slate-100">
                {userProfile.totalMatches ?? 0}
              </p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3 shadow-lg hover:border-slate-750 transition-all">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
              <Skull className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Kills</p>
              <p className="text-lg font-black text-slate-100">
                {userProfile.totalKills ?? 0}
              </p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3 shadow-lg hover:border-slate-750 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Wins</p>
              <p className="text-lg font-black text-slate-100">
                {userProfile.totalWins ?? 0}
              </p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3 shadow-lg hover:border-slate-750 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <span className="text-lg font-black text-amber-400">₹</span>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Winnings</p>
              <p className="text-lg font-black text-slate-100">
                ₹{userProfile.totalWinnings ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured / Quick Register Tournaments Preview */}
      <div>
        <div className="flex justify-between items-center mb-3 px-1">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            🏆 Register Now
          </h3>
          <button
            onClick={() => onNavigateTab("tournaments")}
            className="text-xs font-black text-indigo-400 flex items-center hover:text-indigo-300 transition"
          >
            See All <ChevronRight className="w-4 h-4 ml-0.5" />
          </button>
        </div>

        {loading ? (
          <div className="bg-slate-900/60 p-6 rounded-2xl text-center shadow-lg border border-slate-800/65">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-400 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Fetching Arena Tournaments...</p>
          </div>
        ) : featuredTourneys.length === 0 ? (
          <div className="bg-slate-900/60 p-6 rounded-2xl text-center border border-dashed border-slate-800 shadow-lg">
            <Compass className="w-8 h-8 text-indigo-400 mx-auto mb-2 opacity-75" />
            <p className="text-xs font-extrabold text-slate-300">No active tourneys right now</p>
            <p className="text-[10px] text-slate-500 mt-1">Visit settings profile to seed tournaments instantly</p>
          </div>
        ) : (
          <div className="space-y-3">
            {featuredTourneys.map(t => (
              <div 
                key={t.id} 
                onClick={() => onNavigateTab("tournaments")}
                className="bg-slate-900/70 dark:bg-slate-900/70 rounded-2xl border border-slate-800/80 hover:border-indigo-500/40 hover:shadow-lg transition duration-200 relative overflow-hidden flex items-center pr-3 cursor-pointer group"
              >
                {t.bannerUrl && (
                  <div className="w-20 h-20 bg-slate-950 overflow-hidden flex-shrink-0">
                    <img 
                      src={t.bannerUrl} 
                      alt="" 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <div className="p-3 flex-grow overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-black uppercase">
                      {t.gameType}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-100 truncate mt-1">
                    {t.title}
                  </h4>
                  <div className="flex gap-2.5 text-[10px] text-slate-400 mt-1 font-bold">
                    <span>Fee: ₹{t.entryFee}</span>
                    <span className="text-emerald-400">Prize: ₹{t.prizePool}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 transition" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
