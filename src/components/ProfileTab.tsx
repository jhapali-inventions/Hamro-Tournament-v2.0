/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { doc, updateDoc, collection, query, getDocs, orderBy, limit } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db, handleFirestoreError, OperationType } from "../lib/firebase";
import { UserProfile, Announcement } from "../types";
import { 
  User, 
  Settings, 
  Lock, 
  Smartphone, 
  Gamepad2, 
  LogOut, 
  UserCircle2, 
  Check, 
  PenTool, 
  Activity,
  Megaphone,
  Bell 
} from "lucide-react";

interface ProfileTabProps {
  userProfile: UserProfile;
  onRefreshWallet: () => void;
  onNotifyToast: (msg: string, type: "success" | "error") => void;
}

export default function ProfileTab({ userProfile, onRefreshWallet, onNotifyToast }: ProfileTabProps) {
  // Inputs states
  const [usernameInput, setUsernameInput] = useState(userProfile.username || "");
  const [esewaInput, setEsewaInput] = useState(userProfile.esewaId || "");
  const [ffUidInput, setFfUidInput] = useState(userProfile.ffUid || "");
  const [ffIgnInput, setFfIgnInput] = useState(userProfile.ffIgn || "");
  const [updating, setUpdating] = useState(false);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnn, setLoadingAnn] = useState(false);

  useEffect(() => {
    async function fetchAnnouncements() {
      setLoadingAnn(true);
      try {
        const q = query(
          collection(db, "announcements"),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        const snap = await getDocs(q);
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
        setAnnouncements(list);
      } catch (err) {
        console.error("Error setting profile announcements:", err);
      } finally {
        setLoadingAnn(false);
      }
    }
    fetchAnnouncements();
  }, []);

  async function handleUpdateNickname(e: React.FormEvent) {
    e.preventDefault();
    if (!usernameInput.trim()) {
      onNotifyToast("Username cannot be empty", "error");
      return;
    }
    setUpdating(true);
    try {
      const userRef = doc(db, "users", userProfile.uid);
      await updateDoc(userRef, {
        username: usernameInput.trim()
      });
      onNotifyToast("Gamer alias updated successfully!", "success");
      onRefreshWallet();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userProfile.uid}`);
    } finally {
      setUpdating(false);
    }
  }

  async function handleLockFfUid() {
    if (!ffUidInput.trim()) {
      onNotifyToast("Please write your Free Fire UID before locking", "error");
      return;
    }
    if (!/^\d{9,12}$/.test(ffUidInput.trim())) {
      onNotifyToast("Invalid Free Fire UID! It must be between 9 to 12 digits.", "error");
      return;
    }

    setUpdating(true);
    try {
      const userRef = doc(db, "users", userProfile.uid);
      await updateDoc(userRef, {
        ffUid: ffUidInput.trim(),
        ffUidLocked: true
      });
      onNotifyToast("Free Fire UID saved and locked safely under Fairplay policy!", "success");
      onRefreshWallet();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userProfile.uid}`);
    } finally {
      setUpdating(false);
    }
  }

  async function handleLockFfIgn() {
    if (!ffIgnInput.trim()) {
      onNotifyToast("Please write your Free Fire In-Game Name before locking", "error");
      return;
    }
    if (ffIgnInput.trim().length < 2 || ffIgnInput.trim().length > 24) {
      onNotifyToast("In-Game Name must be between 2 to 24 characters", "error");
      return;
    }

    setUpdating(true);
    try {
      const userRef = doc(db, "users", userProfile.uid);
      await updateDoc(userRef, {
        ffIgn: ffIgnInput.trim(),
        ffIgnLocked: true
      });
      onNotifyToast("Free Fire IGN saved and locked safely under Fairplay policy!", "success");
      onRefreshWallet();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userProfile.uid}`);
    } finally {
      setUpdating(false);
    }
  }

  async function handleSaveEsewa() {
    const cleanEsewa = esewaInput.trim().replace("@esewa", "");
    if (!cleanEsewa) {
      onNotifyToast("Please write down your eSewa phone ID", "error");
      return;
    }
    if (!/^\d{10}$/.test(cleanEsewa)) {
      onNotifyToast("Invalid eSewa mobile ID format! Must be 10 digits mobile number (98xxxxxxxx)", "error");
      return;
    }

    setUpdating(true);
    try {
      const userRef = doc(db, "users", userProfile.uid);
      await updateDoc(userRef, {
        esewaId: cleanEsewa
      });
      onNotifyToast("eSewa primary receiver ID saved successfully!", "success");
      onRefreshWallet();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userProfile.uid}`);
    } finally {
      setUpdating(false);
    }
  }

  async function handleLogOut() {
    try {
      await signOut(auth);
      onNotifyToast("Logged out successfully! See you soon.", "success");
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-5 py-2">
      <div className="px-1">
        <h2 className="text-xl font-black text-slate-50 tracking-tight uppercase">
          👤 Gamer Account <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">and Identity</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1.5 font-bold">
          Review your stats credentials, bind eSewa accounts, and secure game UIDs.
        </p>
      </div>

      {/* Account Bio header - Vibrant Theme */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center gap-4 shadow-xl">
        <div className="w-14 h-14 bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg">
          {userProfile.username ? userProfile.username.charAt(0).toUpperCase() : "G"}
        </div>
        <div className="min-w-0 flex-grow">
          <h3 className="font-extrabold text-slate-100 text-base truncate">
            {userProfile.username || "Gamer"}
          </h3>
          <p className="text-xs text-slate-400 truncate mt-0.5">{userProfile.email}</p>
          <span className="inline-block px-2.5 py-0.5 bg-slate-950 text-indigo-400 text-[9px] font-black uppercase rounded-full mt-2 tracking-widest border border-slate-850">
            Role: {userProfile.role ?? "user"}
          </span>
        </div>
      </div>

      {/* Identity Configuration blocks */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-850 pb-2">
          <Settings className="w-4 h-4" /> Identity Settings
        </h4>

        {/* Change Alias */}
        <form onSubmit={handleUpdateNickname} className="space-y-1.5">
          <label className="text-xs font-black uppercase tracking-wider text-slate-400 block">Gamer Alias / Nickname</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={usernameInput}
              onChange={e => setUsernameInput(e.target.value)}
              disabled={updating}
              className="bg-slate-950 border border-slate-800 text-slate-150 placeholder-slate-600 px-4 py-2.5 rounded-xl flex-grow focus:ring-1 focus:ring-indigo-500 outline-none text-xs sm:text-sm font-bold"
              placeholder="Gamer handle alias"
            />
            <button
              type="submit"
              disabled={updating}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 rounded-xl text-xs font-black uppercase tracking-widest shadow transition disabled:opacity-50 cursor-pointer"
            >
              <PenTool className="w-3.5 h-3.5" /> Save
            </button>
          </div>
        </form>

        {/* eSewa bound phone */}
        <div className="space-y-1.5 border-t border-slate-850 pt-4">
          <label className="text-xs font-black uppercase tracking-wider text-slate-400 block flex items-center gap-1">
            <Smartphone className="w-3.5 h-3.5 text-blue-400" /> Bind eSewa Mobile ID
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={esewaInput}
              onChange={e => setEsewaInput(e.target.value.replace(/\D/g, ""))}
              maxLength={10}
              disabled={updating}
              className="bg-slate-950 border border-slate-800 text-slate-150 placeholder-slate-600 px-4 py-2.5 rounded-xl flex-grow focus:ring-1 focus:ring-indigo-500 outline-none text-xs sm:text-sm font-mono font-bold"
              placeholder="eSewa 10-digit number"
            />
            <button
              type="button"
              onClick={handleSaveEsewa}
              disabled={updating}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 px-5 rounded-xl text-xs font-black uppercase tracking-widest shadow transition disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" /> Save
            </button>
          </div>
          <p className="text-[10px] text-slate-400 font-semibold">Default fallback mobile receiver account used during withdrawals.</p>
        </div>

        {/* Bound Free fire UID (One-way locking) */}
        <div className="space-y-1.5 border-t border-slate-850 pt-4">
          <div className="flex justify-between items-center">
            <label className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Gamepad2 className="w-3.5 h-3.5 text-pink-400" /> Free Fire Numerical UID
            </label>
            {userProfile.ffUidLocked && (
              <span className="text-[9px] font-black bg-orange-500/10 text-orange-400 px-2.5 py-1 rounded-full flex items-center gap-1 border border-orange-505/15 uppercase tracking-widest">
                <Lock className="w-2.5 h-2.5" /> Locked
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={ffUidInput}
              onChange={e => setFfUidInput(e.target.value.replace(/\D/g, ""))}
              disabled={userProfile.ffUidLocked || updating}
              className={`bg-slate-950 border border-slate-800 text-slate-150 placeholder-slate-600 px-4 py-2.5 rounded-xl flex-grow focus:ring-1 focus:ring-indigo-500 outline-none text-xs sm:text-sm font-mono font-bold ${userProfile.ffUidLocked ? "bg-slate-950 text-slate-500 cursor-not-allowed border border-dashed border-slate-800" : ""}`}
              placeholder="e.g. 543167890"
              maxLength={12}
            />
            {!userProfile.ffUidLocked && (
              <button
                type="button"
                onClick={handleLockFfUid}
                disabled={updating}
                className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white px-5 rounded-xl text-xs font-black uppercase tracking-widest shadow transition disabled:opacity-50 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" /> Lock UID
              </button>
            )}
          </div>
          <p className="text-[10px] text-red-400 font-bold leading-normal">
            ⚠️ One-Way Lock Policy: Numerical UIDs cannot be updated or revised after locking once under security rules. Ensure correctness.
          </p>
        </div>

        {/* Bound Free fire IGN (One-way locking) */}
        <div className="space-y-1.5 border-t border-slate-850 pt-4">
          <div className="flex justify-between items-center">
            <label className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <UserCircle2 className="w-3.5 h-3.5 text-pink-400" /> Free Fire In-Game Name (IGN)
            </label>
            {userProfile.ffIgnLocked && (
              <span className="text-[9px] font-black bg-orange-500/10 text-orange-400 px-2.5 py-1 rounded-full flex items-center gap-1 border border-orange-505/15 uppercase tracking-widest">
                <Lock className="w-2.5 h-2.5" /> Locked
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={ffIgnInput}
              onChange={e => setFfIgnInput(e.target.value)}
              disabled={userProfile.ffIgnLocked || updating}
              className={`bg-slate-950 border border-slate-800 text-slate-150 placeholder-slate-600 px-4 py-2.5 rounded-xl flex-grow focus:ring-1 focus:ring-indigo-500 outline-none text-xs sm:text-sm font-bold ${userProfile.ffIgnLocked ? "bg-slate-950 text-slate-500 cursor-not-allowed border border-dashed border-slate-800" : ""}`}
              placeholder="e.g. 亗 NEPAL 亗"
            />
            {!userProfile.ffIgnLocked && (
              <button
                type="button"
                onClick={handleLockFfIgn}
                disabled={updating}
                className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white px-5 rounded-xl text-xs font-black uppercase tracking-widest shadow transition disabled:opacity-50 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" /> Lock IGN
              </button>
            )}
          </div>
          <p className="text-[10px] text-red-400 font-bold leading-normal">
            ⚠️ One-Way Lock Policy: Character IGN aliases cannot be changed once saved. Ensure typing matches gamer tags exactly.
          </p>
        </div>
      </div>

      {/* Dynamic Announcement Panel in Profile Section */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-850 pb-2">
          <Megaphone className="w-4 h-4 text-pink-400" /> Platform Announcements & Bulletins
        </h4>

        {loadingAnn ? (
          <p className="text-xs text-slate-500 animate-pulse font-semibold">Checking official bulletins...</p>
        ) : announcements.length === 0 ? (
          <p className="text-xs text-slate-500 italic font-semibold">No recent broadcast bulletins available</p>
        ) : (
          <div className="space-y-3">
            {announcements.map(ann => {
              let tagColor = "from-blue-500 to-indigo-600";
              let textBadge = "update";
              if (ann.type === "danger") {
                tagColor = "from-rose-500 to-pink-600  text-white";
                textBadge = "danger";
              } else if (ann.type === "success") {
                tagColor = "from-emerald-500 to-teal-500 text-slate-950";
                textBadge = "success";
              } else if (ann.type === "info") {
                tagColor = "from-blue-500 to-sky-500 text-white";
                textBadge = "info";
              }

              return (
                <div key={ann.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 space-y-1.5 hover:border-indigo-500/10 transition">
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-0.5 bg-gradient-to-r ${tagColor} rounded text-[8px] font-black uppercase tracking-wider`}>
                      {textBadge}
                    </span>
                    {ann.createdAt && (
                      <span className="text-[8px] font-bold text-slate-600 font-mono">
                        {ann.createdAt.toDate ? ann.createdAt.toDate().toLocaleDateString() : new Date(ann.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <h5 className="font-extrabold text-xs text-slate-100 uppercase tracking-wide">{ann.title}</h5>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium leading-relaxed">{ann.content}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Logout triggers */}
      <button
        onClick={handleLogOut}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-900 border border-slate-800 hover:border-red-500/30 text-rose-400 hover:text-rose-350 hover:bg-slate-850 font-black rounded-2xl text-xs shadow-lg uppercase tracking-widest transition cursor-pointer"
      >
        <LogOut className="w-4.5 h-4.5" /> Log Out From My Profile
      </button>

      <div className="text-center text-[10px] text-slate-500 font-bold select-none py-1.5">
        Hamro Tournament App • V1.5.0 Stable Standard • Cloud Infrastructure
      </div>
    </div>
  );
}
