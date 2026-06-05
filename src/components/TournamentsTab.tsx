/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  updateDoc, 
  addDoc, 
  increment, 
  serverTimestamp,
  query,
  where 
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Tournament, UserProfile } from "../types";
import { Trophy, Calendar, Users, AlertTriangle, Check, Compass } from "lucide-react";

interface TournamentsTabProps {
  userProfile: UserProfile;
  onRefreshWallet: () => void;
  onNotifyToast: (msg: string, type: "success" | "error") => void;
}

export default function TournamentsTab({ userProfile, onRefreshWallet, onNotifyToast }: TournamentsTabProps) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [processingJoin, setProcessingJoin] = useState(false);

  useEffect(() => {
    fetchTournaments();
  }, [userProfile.uid]);

  async function fetchTournaments() {
    setLoading(true);
    try {
      // 1. Fetch upcoming tournaments
      const q = query(collection(db, "tournaments"), where("status", "==", "upcoming"));
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tournament));
      setTournaments(list);

      // 2. Fetch user's registered tournaments
      const regQuery = query(
        collection(db, "tournamentRegistrations"),
        where("userId", "==", userProfile.uid)
      );
      const regSnap = await getDocs(regQuery);
      const registeredIds = new Set<string>();
      regSnap.forEach(doc => {
        registeredIds.add(doc.data().tournamentId);
      });
      setJoinedIds(registeredIds);
    } catch (err) {
      console.error("Error loading tournaments list:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenJoinModal(t: Tournament) {
    if (userProfile.wallet < t.entryFee) {
      onNotifyToast(`Insufficient balance! Needs ₹${t.entryFee}. Please deposit money into your wallet.`, "error");
      return;
    }
    setSelectedTournament(t);
  }

  async function handleConfirmJoin() {
    if (!selectedTournament) return;
    setProcessingJoin(true);
    try {
      const tId = selectedTournament.id;

      // Double-check user wallet balance against entry fee inside transaction
      const userRef = doc(db, "users", userProfile.uid);
      const userSnap = await getDoc(userRef);
      const currentBalance = userSnap.data()?.wallet ?? 0;

      if (currentBalance < selectedTournament.entryFee) {
        onNotifyToast("Insufficient balance to join tournament!", "error");
        setSelectedTournament(null);
        return;
      }

      // Check tournament seats
      const tRef = doc(db, "tournaments", tId);
      const tSnap = await getDoc(tRef);
      const currentSeats = tSnap.data()?.currentPlayers ?? 0;
      const maxSeats = tSnap.data()?.maxPlayers ?? 48;

      if (currentSeats >= maxSeats) {
        onNotifyToast("Sorry! This tournament seats are completely filled.", "error");
        setSelectedTournament(null);
        return;
      }

      // 1. Perform balance deduction
      await updateDoc(userRef, {
        wallet: increment(-selectedTournament.entryFee),
        totalMatches: increment(1)
      });

      // 2. Increment tournament seat count
      await updateDoc(tRef, {
        currentPlayers: increment(1)
      });

      // 3. Insert Registration record
      await addDoc(collection(db, "tournamentRegistrations"), {
        tournamentId: tId,
        tournamentTitle: selectedTournament.title,
        userId: userProfile.uid,
        userName: userProfile.username,
        registeredAt: serverTimestamp(),
        entryFee: selectedTournament.entryFee,
        status: "registered"
      });

      // 4. Log debit translation ledger
      await addDoc(collection(db, "transactions"), {
        userId: userProfile.uid,
        amount: selectedTournament.entryFee,
        type: "debit",
        description: `Joined ${selectedTournament.title} Entry Charge`,
        status: "completed",
        createdAt: serverTimestamp()
      });

      onNotifyToast(`Successfully joined "${selectedTournament.title}"! Room info will be sent shortly.`, "success");
      
      // Update local sets and fetch newest records
      setJoinedIds(prev => new Set(prev).add(tId));
      onRefreshWallet();
      setSelectedTournament(null);
      fetchTournaments();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "tournamentRegistrations");
    } finally {
      setProcessingJoin(false);
    }
  }

  return (
    <div className="space-y-4 py-2">
      <div className="px-1">
        <h2 className="text-xl font-black text-slate-50 tracking-tight uppercase">
          🏆 Esports Arena <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Tournaments</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1 font-bold">
          Join dynamic Free Fire duos, trios, and squad match cups.
        </p>
      </div>

      {loading ? (
        <div className="bg-slate-900/60 p-12 text-center rounded-2xl shadow-lg border border-slate-800">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400 mx-auto mb-3" />
          <p className="text-sm text-slate-400 font-extrabold uppercase tracking-widest">Loading tournaments...</p>
        </div>
      ) : tournaments.length === 0 ? (
        <div className="bg-slate-900/60 p-8 text-center rounded-2xl border border-dashed border-slate-800 shadow-xl">
          <Compass className="w-12 h-12 text-indigo-400 mx-auto mb-3 animate-pulse opacity-70" />
          <h3 className="font-black text-slate-200 uppercase text-sm">No active tournaments</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-2 leading-relaxed font-semibold">
            All custom tournaments are completed or fully registered. Click the <span className="font-black underline text-purple-400">Seed Info</span> option inside Profile Settings to generate realistic mock tourney events instantly!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tournaments.map(t => {
            const hasJoined = joinedIds.has(t.id);
            const isFull = t.currentPlayers >= t.maxPlayers;
            const percentFilled = Math.min(100, Math.floor((t.currentPlayers / t.maxPlayers) * 100));

            // Format timestamp elegant
            let dateStr = "Soon";
            if (t.startTime) {
              try {
                const nativeDate = t.startTime?.toDate ? t.startTime.toDate() : new Date(t.startTime);
                dateStr = nativeDate.toLocaleDateString("en-NP", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true
                });
              } catch (e) {
                console.error(e);
              }
            }

            return (
              <div 
                key={t.id} 
                className="bg-slate-900 border border-slate-800/80 rounded-2xl shadow-xl hover:shadow-2xl hover:border-indigo-500/30 transition-all overflow-hidden flex flex-col group"
              >
                {/* Tournament Image Banner */}
                {t.bannerUrl && (
                  <div className="w-full h-40 bg-slate-950 relative overflow-hidden">
                    <img 
                      src={t.bannerUrl} 
                      alt={t.title} 
                      className="w-full h-full object-cover group-hover:scale-103 transition duration-250" 
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full text-slate-200 text-[10px] font-black uppercase tracking-wider border border-slate-800">
                      {t.gameType}
                    </div>
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-blue-500 to-indigo-600 px-3 py-1 rounded-full text-white text-[10px] font-black uppercase tracking-wider shadow-lg">
                      Upcoming
                    </div>
                  </div>
                )}

                <div className="p-4 flex-grow flex flex-col">
                  <div className="flex-grow">
                    <h3 className="font-extrabold text-base sm:text-lg text-slate-50 leading-tight group-hover:text-blue-400 transition">
                      {t.title}
                    </h3>
                    
                    {/* Time details */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold mt-2.5">
                      <Calendar className="w-4 h-4 text-pink-400" />
                      <span>{dateStr} (Nepal Standard Time)</span>
                    </div>
 
                    {/* Stats strip - customized to Vibrant Palette colors */}
                    <div className="grid grid-cols-2 gap-4 my-4 p-3.5 bg-slate-950/60 rounded-xl border border-slate-850/80">
                      <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Entry Fee</p>
                        <p className="font-black text-lg text-blue-400">₹{t.entryFee}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Prize Pool</p>
                        <p className="font-black text-lg text-emerald-400">₹{t.prizePool}</p>
                      </div>
                    </div>
 
                    {/* Seat availability progress bar */}
                    <div className="space-y-1.5 mb-4">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Slots booked</span>
                        </span>
                        <span>{t.currentPlayers} / {t.maxPlayers} Players</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-850/40">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-300" 
                          style={{ width: `${percentFilled}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions lock trigger */}
                  {hasJoined ? (
                    <div className="flex items-center justify-center gap-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 p-3 rounded-xl text-xs font-black uppercase tracking-wider animate-pulse">
                      <Check className="w-4 h-4 text-emerald-400" /> Registered & Slot Booked
                    </div>
                  ) : isFull ? (
                    <div className="flex items-center justify-center bg-slate-950 text-slate-500 border border-slate-800 p-3 rounded-xl text-xs font-black uppercase tracking-wider">
                      Fully Booked Out
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOpenJoinModal(t)}
                      className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/10 transition active:scale-[0.98] text-center cursor-pointer"
                    >
                      Join Tournament (₹{t.entryFee})
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Join confirmation modal overlays */}
      {selectedTournament && (
        <div id="joinTournamentModal" className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">
                Join {selectedTournament.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-semibold">Confirm your booking below to register seat.</p>
            </div>

            {/* Price review summary */}
            <div className="bg-slate-950 p-4 rounded-xl space-y-2 text-xs text-slate-300 border border-slate-850">
              <div className="flex justify-between font-bold">
                <span>Tournament Entry Cost:</span>
                <span className="font-extrabold text-white">₹{selectedTournament.entryFee}</span>
              </div>
              <div className="flex justify-between border-t border-slate-850 pt-2.5">
                <span>Current Wallet Balance:</span>
                <span className="font-black text-emerald-400">₹{userProfile.wallet}</span>
              </div>
              <div className="flex justify-between pt-1.5 font-bold">
                <span>Remaining Wallet Balance:</span>
                <span className="font-black text-blue-400">₹{userProfile.wallet - selectedTournament.entryFee}</span>
              </div>
            </div>

            {/* Warnings info */}
            <div className="bg-amber-500/10 text-amber-400 p-3.5 rounded-xl border border-amber-500/20 flex items-start gap-2.5 text-[10px] sm:text-xs font-semibold leading-relaxed">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-500" />
              <span>
                Fees are immediately debited from your wallet. Make sure your bound Free Fire character parameters match exactly to process payouts!
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-805">
              <button
                onClick={() => setSelectedTournament(null)}
                className="py-3 bg-slate-800 hover:bg-slate-755 text-slate-305 font-black rounded-xl text-xs transition cursor-pointer"
                disabled={processingJoin}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmJoin}
                disabled={processingJoin}
                className="py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-500/10 transition active:scale-95 disabled:opacity-50 cursor-pointer animate-pulse"
              >
                {processingJoin ? "Processing..." : `Confirm (₹${selectedTournament.entryFee})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
