/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React from "react";
import { X, BookOpen, Compass, Bell, Play, ShieldAlert, Target } from "lucide-react";

interface ModalsContainerProps {
  activeModal: "terms" | "about" | "announcements" | "tutorial" | null;
  onCloseModal: () => void;
}

export default function ModalsContainer({ activeModal, onCloseModal }: ModalsContainerProps) {
  if (!activeModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-slate-800 flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-155">
        
        {/* Header section of Modal */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-850 flex-shrink-0">
          <h3 className="text-sm sm:text-base font-black text-slate-100 flex items-center gap-1.5 uppercase tracking-tight">
            {activeModal === "terms" && <><BookOpen className="w-5 h-5 text-blue-400" /> Platform Rules</>}
            {activeModal === "about" && <><Compass className="w-5 h-5 text-pink-400" /> About Hamro Arena</>}
            {activeModal === "announcements" && <><Bell className="w-5 h-5 text-indigo-400" /> System Alerts</>}
            {activeModal === "tutorial" && <><Play className="w-5 h-5 text-emerald-400" /> Guide Tutorial Video</>}
          </h3>
          <button 
            onClick={onCloseModal}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-750 font-bold flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content scrolling section */}
        <div className="overflow-y-auto py-4 text-xs sm:text-sm text-slate-300 space-y-4 pr-1 leading-relaxed flex-grow">
          
          {/* 1. Terms & Conditions content */}
          {activeModal === "terms" && (
            <div className="space-y-4">
              <div className="bg-blue-505/5 text-blue-400 p-3.5 rounded-xl border border-blue-500/15 flex items-start gap-2 text-[11px] font-bold leading-normal shadow-sm">
                <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-400" />
                <span>Fair-Play Mandate: Any usage of hacks, third-party modded apps, or system emulator play leads to instant bans of both profile and balance.</span>
              </div>
              <div className="space-y-3">
                <p>
                  <strong className="text-slate-150 block mb-1">1. Age Requirement</strong>
                  All competing players must represent 18 years of age or older to participate in wagered tournaments.
                </p>
                <p>
                  <strong className="text-slate-150 block mb-1">2. Safe Registration</strong>
                  You are solely responsible for ensuring your bound Free Fire numerical UIDs match your primary lobby characters exactly.
                </p>
                <p>
                  <strong className="text-slate-150 block mb-1">3. Withdrawals Processing</strong>
                  Withdrawal of won prizes is processed in 5-7 business hours after review by our manual inspection Desk.
                </p>
                <p>
                  <strong className="text-slate-150 block mb-1">4. Refund Polices</strong>
                  Tournament registration charges points are strictly non-refundable once registered except if tournament gets canceled.
                </p>
                <p>
                  <strong className="text-slate-150 block mb-1">5. Multiple Accounts</strong>
                  Creating duplicate accounts to cheat, bypass limits, or farm referral bonuses is strictly banned.
                </p>
              </div>
            </div>
          )}

          {/* 2. About Us content */}
          {activeModal === "about" && (
            <div className="space-y-3.5 text-center">
              <div className="w-14 h-14 bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center text-white text-3xl font-extrabold mx-auto shadow-lg mb-2">
                🏆
              </div>
              <h4 className="font-black text-slate-100 text-base uppercase tracking-tight">Hamro Tournament Esports</h4>
              <p className="text-xs text-slate-405 font-medium leading-relaxed">
                Nepal's premier hub designed for competitive mobile gaming action. We build professional matchmaking rooms and distribute transparent wager-pools safely.
              </p>
              <div className="border-t border-slate-850 pt-3 text-left space-y-2 text-xs font-semibold">
                <p className="flex items-center justify-between text-slate-400 border-b border-slate-850 pb-1.5"><span>📍 HQ Arena Location:</span> <span className="text-slate-205 font-bold">Pokhara Lakeside / KTM</span></p>
                <p className="flex items-center justify-between text-slate-400 border-b border-slate-850 pb-1.5"><span>📧 Official Support:</span> <span className="text-blue-400 font-mono">care@hamrotournament.com</span></p>
                <p className="flex items-center justify-between text-slate-400 border-b border-slate-850 pb-1.5"><span>⏰ Working Hours:</span> <span className="text-amber-400">10 AM - 10 PM NST</span></p>
                <p className="flex items-center justify-between text-slate-400"><span>👥 Active Gamers:</span> <span className="text-indigo-400 font-extrabold">15,000+ Verified Users</span></p>
              </div>
            </div>
          )}

          {/* 3. Announcements List content */}
          {activeModal === "announcements" && (
            <div className="space-y-3">
              <div className="border-l-3 border-blue-500 pl-3 py-1.5 bg-blue-500/5 p-3 rounded-r-xl border border-slate-850">
                <p className="font-extrabold text-slate-150 text-xs sm:text-sm">💰 eSewa Fast Payout Guarantee</p>
                <p className="text-xs text-slate-405 mt-1 font-semibold leading-normal">
                  Our financial Desk processes withdrawals daily between 10:00 AM to 10:00 PM NST within 30 minutes! Minimum withdrawal is ₹50.
                </p>
              </div>
              <div className="border-l-3 border-purple-500 pl-3 py-1.5 bg-purple-500/5 p-3 rounded-r-xl border border-slate-850">
                <p className="font-extrabold text-slate-150 text-xs sm:text-sm">⚔️ Weekly Free Fire Elite Cups</p>
                <p className="text-xs text-slate-405 mt-1 font-semibold leading-normal">
                  Elite Solo and Duos matches are held every Wednesday and Friday evening. Registrations open Mondays. Keep checking live tabs!
                </p>
              </div>
              <div className="border-l-3 border-pink-500 pl-3 py-1.5 bg-pink-500/5 p-3 rounded-r-xl border border-slate-850">
                <p className="font-extrabold text-slate-150 text-xs sm:text-sm">🔴 Emulator Bans Policy</p>
                <p className="text-xs text-slate-405 mt-1 font-semibold leading-normal">
                  Computers or PC Emulators are completely restricted from mobile matchmaking. All lobbies contain native smartphone check configurations only.
                </p>
              </div>
            </div>
          )}

          {/* 4. Tutorial stream content */}
          {activeModal === "tutorial" && (
            <div className="space-y-4">
              <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl relative border border-slate-800">
                <iframe 
                  width="100%" 
                  height="105%" 
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
                  title="Hamro Guide Video Tutorial"
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  allowFullScreen
                  className="absolute inset-0"
                />
              </div>
              <div className="bg-emerald-500/5 text-emerald-400 border border-emerald-500/15 rounded-xl p-3.5 flex items-start gap-2 text-[11px] font-bold leading-normal shadow-sm">
                <Target className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-0.5" />
                <span>Tutorial: Watch the complete clip to configure your wallet deposits, bind mobile eSewa keys, and register lobby coordinates flawlessly.</span>
              </div>
            </div>
          )}

        </div>

        {/* Closing Action */}
        <div className="pt-3 border-t border-slate-850 flex-shrink-0">
          <button 
            onClick={onCloseModal}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/10 cursor-pointer transition active:scale-98"
          >
            Acknowledge & Close
          </button>
        </div>

      </div>
    </div>
  );
}
