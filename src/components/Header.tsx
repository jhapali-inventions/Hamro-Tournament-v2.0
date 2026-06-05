/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { UserProfile } from "../types";
import { Sun, Moon, Wallet } from "lucide-react";
import NotificationsCenter from "./NotificationsCenter";

interface HeaderProps {
  userProfile: UserProfile | null;
  onOpenWalletTab: () => void;
  onNotifyToast: (msg: string, type: "success" | "error") => void;
}

export default function Header({ userProfile, onOpenWalletTab, onNotifyToast }: HeaderProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize and persist dark mode preferences
  useEffect(() => {
    const isCurrentlyDark = localStorage.getItem("darkMode") === "true";
    setIsDarkMode(isCurrentlyDark);
    if (isCurrentlyDark) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, []);

  function toggleDarkMode() {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    localStorage.setItem("darkMode", String(nextDark));
    if (nextDark) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }

  // Parse neat nickname from profile or raw email
  const displayNickname = userProfile?.username 
    ? userProfile.username 
    : userProfile?.email 
      ? userProfile.email.split("@")[0] 
      : "Player";

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md px-4 py-3 border-b border-slate-800/85 transition-colors">
      <div className="max-w-md mx-auto flex justify-between items-center">
        {/* Branding with Vibrant Palette Logo */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 transition-transform active:scale-95 duration-200">
            <span className="text-white text-lg" role="img" aria-label="trophy">🏆</span>
          </div>
          <div>
            <h1 className="font-black text-slate-50 text-base leading-tight tracking-tight uppercase">
              Hamro <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Tournament</span>
            </h1>
            <p className="text-[9px] text-purple-400 font-extrabold tracking-widest uppercase">
              Esports Arena
            </p>
          </div>
        </div>

        {/* Right side controls matching Vibrant theme */}
        <div className="flex items-center gap-2.5">
          {/* Quick wallet link - vibrant emerald gradient pill */}
          <button
            onClick={onOpenWalletTab}
            id="wallet-badge"
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 px-3.5 py-1.5 rounded-full text-xs font-black shadow-lg shadow-emerald-500/10 transition active:scale-95 cursor-pointer"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>₹{userProfile?.wallet ?? 0}</span>
          </button>

          {/* Quick email display and dark mode toggle */}
          <div className="flex items-center gap-1.5">
            <span className="hidden sm:inline-block text-xs font-bold text-slate-400 max-w-[80px] truncate">
              {displayNickname}
            </span>
            {userProfile && (
              <NotificationsCenter userProfile={userProfile} onNotifyToast={onNotifyToast} />
            )}
            <button
              onClick={toggleDarkMode}
              id="darkModeToggle"
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 shadow flex items-center justify-center text-slate-200 transition active:scale-90 cursor-pointer"
              title="Toggle Day/Night Mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-orange-400 animate-pulse" /> : <Moon className="w-4 h-4 text-purple-400" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
