/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "firebase/auth";
import { doc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "../lib/firebase";
import { ShieldAlert, LogIn, UserPlus, Eye, EyeOff } from "lucide-react";

interface AuthProps {
  onNotifyToast: (msg: string, type: "success" | "error") => void;
}

export default function Auth({ onNotifyToast }: AuthProps) {
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onNotifyToast("Welcome back to Hamro Tournament!", "success");
    } catch (err: any) {
      onNotifyToast(err.message || "Failed to sign in. Please check your credentials.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password || !username) {
      onNotifyToast("Please write all required inputs", "error");
      return;
    }
    if (username.length < 2 || username.length > 20) {
      onNotifyToast("Username must be between 2 to 20 letters", "error");
      return;
    }
    if (password.length < 6) {
      onNotifyToast("Password must match at least 6 characters", "error");
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      // 1. Core Profile Setup (including 10 Rupees startup credits as required)
      const userRef = doc(db, "users", uid);
      await setDoc(userRef, {
        uid: uid,
        email: email,
        username: username.trim(),
        wallet: 10,
        esewaId: "",
        ffUid: "",
        ffIgn: "",
        ffUidLocked: false,
        ffIgnLocked: false,
        totalKills: 0,
        totalDeposited: 0,
        totalWinnings: 0,
        totalMatches: 0,
        totalWins: 0,
        createdAt: serverTimestamp(),
        role: "user" // Default role
      });

      // 2. Insert transactional record representing welcomes
      await addDoc(collection(db, "transactions"), {
        userId: uid,
        amount: 10,
        type: "credit",
        description: "Welcome Bonus Credits",
        status: "completed",
        createdAt: serverTimestamp()
      });

      onNotifyToast("Account created successfully! Enjoy ₹10 Welcome Bonus!", "success");
    } catch (err: any) {
      onNotifyToast(err.message || "Failed to create account. Email may already be associated.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-6 px-4" id="auth-screen">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl transition-all">
        {/* Animated App Icon & Logo Header styled in Vibrant Palette */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/20 active:scale-95 transition-transform duration-250 select-none">
            <span className="text-4xl" role="img" aria-label="trophy">🏆</span>
          </div>
          <h2 className="text-2xl font-black text-slate-50 tracking-tight uppercase">
            Hamro <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Tournament</span>
          </h2>
          <p className="text-[10px] text-purple-400 mt-1.5 font-black uppercase tracking-wider">
            Join Premier Tournaments & Win Real eSewa Cash
          </p>
        </div>

        {isSignUpMode ? (
          // Sign Up Form
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                Gamer Nickname / Alias
              </label>
              <input
                type="text"
                placeholder="e.g. NepalSniper"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-slate-950 text-slate-100 placeholder-slate-600 px-4 py-3 rounded-xl border border-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full transition text-sm"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-950 text-slate-100 placeholder-slate-600 px-4 py-3 rounded-xl border border-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full transition text-sm"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-950 text-slate-100 placeholder-slate-600 pl-4 pr-10 py-3 rounded-xl border border-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full transition text-sm"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition shadow-lg shadow-blue-500/15 disabled:opacity-55 active:scale-[0.98] cursor-pointer"
            >
              <UserPlus className="w-4 h-4" /> 
              {loading ? "Creating Account..." : "Create Free Account (+₹10 Bonus)"}
            </button>

            <button
              type="button"
              onClick={() => setIsSignUpMode(false)}
              className="w-full text-center text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:underline mt-2 cursor-pointer"
              disabled={loading}
            >
              Already have an account? Sign In
            </button>
          </form>
        ) : (
          // Sign In Form
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-950 text-slate-100 placeholder-slate-600 px-4 py-3 rounded-xl border border-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full transition text-sm"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your security phrase"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-950 text-slate-100 placeholder-slate-600 pl-4 pr-10 py-3 rounded-xl border border-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full transition text-sm"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition shadow-lg shadow-blue-500/15 disabled:opacity-55 active:scale-[0.98] cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              {loading ? "Signing User In..." : "Sign In Securely"}
            </button>

            <button
              type="button"
              onClick={() => setIsSignUpMode(true)}
              className="w-full text-center text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:underline mt-2 cursor-pointer"
              disabled={loading}
            >
              New here? Create Gamer Profile
            </button>
          </form>
        )}

        {/* Informative Security Disclaimer */}
        <div className="flex gap-2 items-start mt-6 bg-slate-950/45 p-3 rounded-xl border border-slate-850 text-slate-400 text-[10px] leading-relaxed">
          <ShieldAlert className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
          <p className="font-semibold text-left">
            Safety Guard: Real credentials, payments, and account histories are stored and encrypted on Google Cloud Firebase. Any fairplay violations will lead to bans.
          </p>
        </div>
      </div>
    </div>
  );
}
