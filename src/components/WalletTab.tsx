/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  increment, 
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  limit 
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { UserProfile, Transaction } from "../types";
import { 
  TrendingUp, 
  ArrowLeftRight, 
  Copy, 
  Send, 
  MessageSquareCode, 
  Activity, 
  DollarSign, 
  Download, 
  Upload, 
  X,
  AlertCircle 
} from "lucide-react";

interface WalletTabProps {
  userProfile: UserProfile;
  onRefreshWallet: () => void;
  onNotifyToast: (msg: string, type: "success" | "error") => void;
}

export default function WalletTab({ userProfile, onRefreshWallet, onNotifyToast }: WalletTabProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals/Sheets states
  const [openDeposit, setOpenDeposit] = useState(false);
  const [openWithdraw, setOpenWithdraw] = useState(false);

  // Form states
  const [depositAmt, setDepositAmt] = useState<number | "">("");
  const [transactionId, setTransactionId] = useState("");
  const [withdrawEsewa, setWithdrawEsewa] = useState("");
  const [withdrawAmt, setWithdrawAmt] = useState<number | "">("");

  // DB loading handlers
  useEffect(() => {
    fetchTransactions();
    // Default populate esewa ID if user has one saved
    if (userProfile.esewaId) {
      setWithdrawEsewa(userProfile.esewaId);
    }
  }, [userProfile.uid]);

  async function fetchTransactions() {
    setLoading(true);
    try {
      const q = query(
        collection(db, "transactions"),
        where("userId", "==", userProfile.uid),
        orderBy("createdAt", "desc"),
        limit(20)
      );
      const snap = await getDocs(q);
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(items);
    } catch (err) {
      console.error("Error fetching transactions list:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleCopyEsewaId() {
    try {
      navigator.clipboard?.writeText("9841234567");
      onNotifyToast("eSewa admin ID 9841234567 copied to clipboard!", "success");
    } catch (e) {
      onNotifyToast("Admin ID: 9841234567. Please write this down.", "success");
    }
  }

  async function handleSubmitDeposit(e: React.FormEvent) {
    e.preventDefault();
    if (!depositAmt || depositAmt < 50) {
      onNotifyToast("Minimum deposit amount is ₹50", "error");
      return;
    }
    if (!transactionId.trim()) {
      onNotifyToast("Please write down your eSewa transaction reference ID", "error");
      return;
    }

    setLoading(true);
    try {
      // 1. Log pending deposit request in Firestore
      await addDoc(collection(db, "deposits"), {
        userId: userProfile.uid,
        userName: userProfile.username,
        amount: Number(depositAmt),
        transactionId: transactionId.trim(),
        status: "pending",
        createdAt: serverTimestamp()
      });

      // 2. Add matching pending ledger entry inside transactions
      await addDoc(collection(db, "transactions"), {
        userId: userProfile.uid,
        amount: Number(depositAmt),
        type: "credit",
        description: `Deposit via eSewa (TxID: ${transactionId.trim()})`,
        status: "pending",
        createdAt: serverTimestamp()
      });

      onNotifyToast("eSewa deposit submitted! Support team is checking transaction details.", "success");
      setOpenDeposit(false);
      setDepositAmt("");
      setTransactionId("");
      fetchTransactions();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "deposits");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitWithdraw(e: React.FormEvent) {
    e.preventDefault();
    if (!withdrawAmt || withdrawAmt < 50) {
      onNotifyToast("Minimum withdrawal requirement is ₹50", "error");
      return;
    }
    if (!withdrawEsewa.trim()) {
      onNotifyToast("Please supply your 10-digit eSewa receiver mobile number", "error");
      return;
    }
    const cleanEsewa = withdrawEsewa.trim().replace("@esewa", "");
    if (!/^\d{10}$/.test(cleanEsewa)) {
      onNotifyToast("Invalid eSewa ID format! It must be a 10 digit Mobile Number.", "error");
      return;
    }
    if (Number(withdrawAmt) > userProfile.wallet) {
      onNotifyToast("Insufficient wallet balance to request withdrawal!", "error");
      return;
    }

    setLoading(true);
    try {
      // 1. Lock/Decrement funds immediately during approval queue
      const userRef = doc(db, "users", userProfile.uid);
      await updateDoc(userRef, {
        wallet: increment(-Number(withdrawAmt)),
        esewaId: cleanEsewa
      });

      // 2. Log withdrawal request inside withdrawals DB
      await addDoc(collection(db, "withdrawals"), {
        userId: userProfile.uid,
        userName: userProfile.username,
        amount: Number(withdrawAmt),
        esewaId: cleanEsewa,
        status: "pending",
        createdAt: serverTimestamp()
      });

      // 3. Increment ledger with pending debit
      await addDoc(collection(db, "transactions"), {
        userId: userProfile.uid,
        amount: Number(withdrawAmt),
        type: "debit",
        description: `Withdrawal Pending (Recipient: ${cleanEsewa})`,
        status: "pending",
        createdAt: serverTimestamp()
      });

      onNotifyToast("eSewa cashout request logged! Winnings will land in your eSewa in 5-7 hours.", "success");
      setOpenWithdraw(false);
      setWithdrawAmt("");
      onRefreshWallet();
      fetchTransactions();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "withdrawals");
    } finally {
      setLoading(false);
    }
  }

  const generatedWhatsappPresetText = `Hello admin! I just submitted an eSewa deposit request on Hamro Tournament. Gamer Account Username: ${encodeURIComponent(userProfile.username || '')}. Email: ${encodeURIComponent(userProfile.email || '')}. Reference transaction details logged. Please approve!`;

  return (
    <div className="space-y-4 py-2">
      <div className="px-1">
        <h2 className="text-xl font-black text-slate-50 tracking-tight uppercase">
          💰 Wallet <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Ledger & Payouts</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1.5 font-bold">
          Securely submit deposits, execute eSewa withdrawals, or inspect match ledger records.
        </p>
      </div>

      {/* Grid of Balances - Customized Vibrant Palette */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 text-center shadow-lg hover:border-slate-750 transition">
          <p className="text-[9px] text-[#8e8e93] font-black uppercase tracking-wider">Avail Balance</p>
          <p className="text-lg font-black text-emerald-400 truncate mt-1">₹{userProfile.wallet}</p>
        </div>
        <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 text-center shadow-lg hover:border-slate-750 transition">
          <p className="text-[9px] text-[#8e8e93] font-black uppercase tracking-wider">Deposited</p>
          <p className="text-lg font-black text-blue-400 truncate mt-1">₹{userProfile.totalDeposited ?? 0}</p>
        </div>
        <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 text-center shadow-lg hover:border-slate-750 transition">
          <p className="text-[9px] text-[#8e8e93] font-black uppercase tracking-wider">Winnings</p>
          <p className="text-lg font-black text-amber-400 truncate mt-1">₹{userProfile.totalWinnings ?? 0}</p>
        </div>
      </div>

      {/* Action buttons with vibrant neon looking colors */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setOpenDeposit(true)}
          className="flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-2xl font-black text-xs shadow-lg shadow-emerald-500/10 active:scale-95 transition-transform duration-200 cursor-pointer"
        >
          <Download className="w-4 h-4 text-slate-950" /> Deposit via eSewa
        </button>
        <button
          onClick={() => setOpenWithdraw(true)}
          className="flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 rounded-2xl font-black text-xs shadow-lg shadow-orange-500/10 active:scale-95 transition-transform duration-200 cursor-pointer"
        >
          <Upload className="w-4 h-4 text-slate-950" /> eSewa Withdrawals
        </button>
      </div>

      {/* Alert details - Vibrant Palette format */}
      <div className="flex gap-2.5 items-start bg-amber-500/10 text-amber-400 p-4 rounded-2xl border border-amber-500/20 text-xs shadow-sm">
        <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-500" />
        <p className="font-bold text-left leading-relaxed">
          Important Fair-Play Directive: Only won tournament prizes are qualified for withdrawal request. General deposit points cannot be cashed back under money-laundering preventions.
        </p>
      </div>

      {/* Ledger Log Lists */}
      <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 px-4 py-4">
        <h3 className="font-black text-sm text-slate-100 mb-4 flex items-center gap-1.5 border-b border-slate-850 pb-2.5 uppercase tracking-wide">
          <Activity className="w-4 h-4 text-blue-400" /> Transaction history log
        </h3>

        {loading && transactions.length === 0 ? (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-400 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-bold">Querying statement ledger...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-slate-500 font-bold">
            <p className="text-xs font-black uppercase tracking-widest">No statements found</p>
            <p className="text-[10px] text-slate-650 mt-1">Setup details or create deposits to view records</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-850 bg-slate-950/20 px-2 rounded-xl border border-slate-850">
            {transactions.map((tx, i) => {
              const parsedDate = tx.createdAt?.toDate ? tx.createdAt.toDate() : new Date(tx.createdAt || Date.now());
              const isCredit = tx.type === "credit";
              const valueColor = isCredit ? "text-emerald-400 pr-1" : "text-rose-450 pr-1";
              const valueSign = isCredit ? "+" : "-";

              // Badges formatting
              let statusStyle = "bg-amber-400/10 text-amber-400 border border-amber-400/20";
              if (tx.status === "completed") {
                statusStyle = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
              } else if (tx.status === "failed") {
                statusStyle = "bg-red-500/10 text-red-400 border border-red-500/20";
              }

              return (
                <div key={tx.id || i} className="flex justify-between items-center py-3">
                  <div className="min-w-0 pr-2">
                    <p className="font-extrabold text-xs text-slate-100 truncate">
                      {tx.description}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      {parsedDate.toLocaleString("en-NP")}
                    </p>
                    <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-full uppercase mt-1.5 ${statusStyle}`}>
                      {tx.status}
                    </span>
                  </div>
                  <div className={`font-black text-sm ${valueColor} flex-shrink-0 font-mono`}>
                    {valueSign} ₹{tx.amount}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Slide-Up Deposit modal */}
      {openDeposit && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 border-t sm:border border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-305">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2 uppercase tracking-tight">
                💰 Deposit via eSewa
              </h3>
              <button 
                onClick={() => setOpenDeposit(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-750 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Merchant info */}
            <div className="bg-slate-950 border border-slate-850 text-center p-4 rounded-xl space-y-2.5">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block">Official eSewa ID</span>
              <p className="text-xl font-mono font-black text-emerald-400">9841234567</p>
              <button 
                type="button"
                onClick={handleCopyEsewaId}
                className="inline-flex items-center gap-1.5 bg-slate-850 text-xs text-slate-200 border border-slate-800 px-3.5 py-1.5 rounded-full font-black shadow transition cursor-pointer hover:bg-slate-800 hover:text-white"
              >
                <Copy className="w-3.5 h-3.5 text-blue-400" /> Copy ID
              </button>
            </div>

            {/* Step-by-step guideline capsule */}
            <div className="bg-amber-500/5 text-amber-400 border border-amber-500/20 p-3.5 rounded-xl text-xs font-semibold leading-relaxed space-y-1 shadow-sm">
              <p className="font-black uppercase tracking-wider text-amber-505 text-[10px] flex items-center gap-1">📋 Dynamic Instructions:</p>
              <p>1. Open your native eSewa app and transfer desired point sum above to eSewa ID.</p>
              <p>2. Enter your exact transfer amount & transaction ID below.</p>
              <p>3. Submit the deposit request, then click the green WhatsApp link below to instantly confirm.</p>
            </div>

            {/* WhatsApp Proof generator */}
            <a 
              href={`https://wa.me/9779800000000?text=${generatedWhatsappPresetText}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 bg-[#25D366] hover:brightness-110 text-slate-950 py-3 rounded-xl font-black text-xs shadow-lg transition active:scale-98"
            >
              <MessageSquareCode className="w-4.5 h-4.5" /> Share Screenshot / Verify Proof (WhatsApp)
            </a>

            {/* Deposit Submission form */}
            <form onSubmit={handleSubmitDeposit} className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                  Sum Amount (Min: ₹50)
                </label>
                
                {/* Fast presets buttons */}
                <div className="grid grid-cols-4 gap-2 mb-2.5">
                  {[100, 500, 1000, 5000].map(amt => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setDepositAmt(amt)}
                      className={`py-2 px-1 text-xs font-black rounded-xl border transition cursor-pointer ${depositAmt === amt ? "bg-gradient-to-r from-emerald-500 to-teal-500 border-none text-slate-950 shadow-md shadow-emerald-500/10" : "bg-slate-950 border-slate-800 text-slate-350 hover:text-white"}`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>

                <input
                  type="number"
                  placeholder="Enter custom deposit sum"
                  value={depositAmt}
                  onChange={e => setDepositAmt(e.target.value === "" ? "" : Number(e.target.value))}
                  className="bg-slate-950 border border-slate-800 text-slate-150 placeholder-slate-600 px-4 py-3 rounded-xl focus:ring-1 focus:ring-emerald-500 outline-none w-full text-xs sm:text-sm font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                  Transaction Reference ID (eSewa reference)
                </label>
                <input
                  type="text"
                  placeholder="Enter 12-character transaction ID"
                  value={transactionId}
                  onChange={e => setTransactionId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-150 placeholder-slate-600 px-4 py-3 rounded-xl focus:ring-1 focus:ring-emerald-500 outline-none w-full text-xs sm:text-sm font-bold"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/10 cursor-pointer transition active:scale-98"
              >
                <Send className="w-4 h-4" /> Submit Deposit Check
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Slide-Up Withdrawal modal */}
      {openWithdraw && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 border-t sm:border border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-305">
            <div className="flex justify-between items-center pb-2 border-b border-slate-850">
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2 uppercase tracking-tight">
                💸 Withdraw to eSewa
              </h3>
              <button 
                onClick={() => setOpenWithdraw(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-750 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Balance status bar */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-xs shadow-inner">
              <div className="flex justify-between font-bold">
                <span className="text-slate-400 uppercase tracking-wider text-[10px]">Maximum Withdrawals Limit:</span>
                <span className="font-black text-amber-400">₹{userProfile.wallet}</span>
              </div>
            </div>

            {/* Rules banner */}
            <div className="bg-rose-500/10 text-rose-400 border border-rose-500/20 p-3.5 rounded-xl text-xs font-semibold leading-relaxed shadow-sm">
              ⚠️ Minimum cashout sum limit is ₹50. Payout processing takes 5-7 hours. Ensure your recipient registration matches exactly.
            </div>

            <form onSubmit={handleSubmitWithdraw} className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                  Recipient eSewa Registered Mobile ID
                </label>
                <input
                  type="text"
                  placeholder="98XXXXXXXX"
                  maxLength={10}
                  value={withdrawEsewa}
                  onChange={e => setWithdrawEsewa(e.target.value.replace(/\D/g, ""))}
                  className="bg-slate-950 border border-slate-800 text-slate-150 placeholder-slate-600 px-4 py-3 rounded-xl focus:ring-1 focus:ring-orange-500 outline-none w-full text-xs sm:text-sm font-bold"
                  required
                />
                <p className="text-[10px] text-slate-550 mt-1.5 pr-1 font-semibold leading-normal">
                  Nepal 10-digit registered cellular account number (98xxxxxxxx).
                </p>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                  Sum Payout Sum (₹)
                </label>

                {/* Presets */}
                <div className="grid grid-cols-3 gap-2 mb-2.5">
                  {[100, 500, 1000].map(amt => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setWithdrawAmt(amt)}
                      className={`py-2 px-1 text-xs font-black rounded-xl border transition cursor-pointer ${withdrawAmt === amt ? "bg-gradient-to-r from-orange-500 to-amber-500 border-none text-slate-950 shadow shadow-orange-500/10" : "bg-slate-950 border-slate-800 text-slate-350 hover:text-white"}`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>

                <input
                  type="number"
                  placeholder="Enter amount to extract"
                  value={withdrawAmt}
                  onChange={e => setWithdrawAmt(e.target.value === "" ? "" : Number(e.target.value))}
                  className="bg-slate-950 border border-slate-800 text-slate-150 placeholder-slate-600 px-4 py-3 rounded-xl focus:ring-1 focus:ring-orange-500 outline-none w-full text-xs sm:text-sm font-bold"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/10 cursor-pointer transition active:scale-98"
              >
                <ArrowLeftRight className="w-4 h-4" /> Submit Withdrawal Request
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
