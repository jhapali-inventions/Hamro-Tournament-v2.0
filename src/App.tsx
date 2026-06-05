/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot, getDoc, setDoc, serverTimestamp, addDoc, collection } from "firebase/firestore";
import { auth, db } from "./lib/firebase";
import { UserProfile, ActiveTab } from "./types";

// Component imports
import Header from "./components/Header";
import Auth from "./components/Auth";
import HomeTab from "./components/HomeTab";
import TournamentsTab from "./components/TournamentsTab";
import LeaderboardTab from "./components/LeaderboardTab";
import WalletTab from "./components/WalletTab";
import ProfileTab from "./components/ProfileTab";
import ModalsContainer from "./components/ModalsContainer";

// Lucide icon imports
import { Home, Trophy, BarChart2, Wallet, UserCircle, RefreshCw } from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");

  // Global Toast popups helper
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [toastTimeout, setToastTimeout] = useState<NodeJS.Timeout | null>(null);

  // Active Modals overlays state
  const [activeModal, setActiveModal] = useState<"terms" | "about" | "announcements" | "tutorial" | null>(null);

  function triggerToast(msg: string, type: "success" | "error" = "success") {
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }
    setToast({ msg, type });
    const timer = setTimeout(() => {
      setToast(null);
    }, 3500);
    setToastTimeout(timer);
  }

  // Subscribe to Firebase Authentication actions and sync user profiles
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setCurrentUser(firebaseUser);

        // Fetch / establish User Profile document
        const userRef = doc(db, "users", firebaseUser.uid);
        
        // Listen in real-time to user's wallet and locks statuses
        const unsubDoc = onSnapshot(userRef, async (userDoc) => {
          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as UserProfile);
            setLoading(false);
          } else {
            // Profile document doesn't exist yet, we seed a default profile
            const freshProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              username: firebaseUser.email?.split("@")[0] || "GamerPlayer",
              wallet: 10, // Default welcome bonus credits
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
              role: "user"
            };

            try {
              // 1. Set standard user profile doc
              await setDoc(userRef, freshProfile);

              // 2. Setup the introductory credit bonus transaction
              await addDoc(collection(db, "transactions"), {
                userId: firebaseUser.uid,
                amount: 10,
                type: "credit",
                description: "Welcome Registration Bonus",
                status: "completed",
                createdAt: serverTimestamp()
              });

              setUserProfile(freshProfile);
              triggerToast("Welcome gift of ₹10 credits added to your esports balance!", "success");
            } catch (err) {
              console.error("Error setting default user profile:", err);
            } finally {
              setLoading(false);
            }
          }
        }, (err) => {
          console.error("Error subscribing to profile stream:", err);
          setLoading(false);
        });

        return () => unsubDoc();
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubAuth();
  }, []);

  function handleRefreshUserProfile() {
    // Force grab profile again if snapshot lags or updates
    if (!currentUser) return;
    const userRef = doc(db, "users", currentUser.uid);
    getDoc(userRef).then(snap => {
      if (snap.exists()) {
        setUserProfile(snap.data() as UserProfile);
      }
    }).catch(console.error);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 transition-colors flex flex-col justify-between pb-20 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.15),rgba(255,255,255,0))]">
      
      {/* 1. Header persist */}
      {currentUser && userProfile && (
        <Header 
          userProfile={userProfile} 
          onOpenWalletTab={() => setActiveTab("wallet")} 
          onNotifyToast={triggerToast}
        />
      )}

      {/* 2. Main content rendering canvas */}
      <main className="flex-grow max-w-md w-full mx-auto px-4 pt-4 pb-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-sm text-slate-400 font-extrabold uppercase tracking-wider">Syncing Arena...</p>
          </div>
        ) : !currentUser ? (
          // Authenticate view if logged out
          <Auth onNotifyToast={triggerToast} />
        ) : !userProfile ? (
          <div className="text-center py-10">
            <p className="text-sm text-slate-500">Configuring gamer tags. Please wait...</p>
          </div>
        ) : (
          // Tabs orchestration
          <>
            {activeTab === "home" && (
              <HomeTab 
                userProfile={userProfile} 
                onNavigateTab={(tab) => setActiveTab(tab)} 
                openModal={(type) => setActiveModal(type)}
              />
            )}
            
            {activeTab === "tournaments" && (
              <TournamentsTab 
                userProfile={userProfile} 
                onRefreshWallet={handleRefreshUserProfile}
                onNotifyToast={triggerToast}
              />
            )}
            
            {activeTab === "leaderboard" && (
              <LeaderboardTab />
            )}
            
            {activeTab === "wallet" && (
              <WalletTab 
                userProfile={userProfile} 
                onRefreshWallet={handleRefreshUserProfile}
                onNotifyToast={triggerToast}
              />
            )}
            
            {activeTab === "profile" && (
              <ProfileTab 
                userProfile={userProfile} 
                onRefreshWallet={handleRefreshUserProfile}
                onNotifyToast={triggerToast}
              />
            )}
          </>
        )}
      </main>

      {/* 3. Global persistent bottom control bar styled with Vibrant Palette */}
      {currentUser && (
        <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/90 py-2.5 px-3 z-40 transition-all">
          <div className="max-w-md mx-auto flex justify-between items-center text-slate-400">
            
            {/* Home Tab */}
            <button
              onClick={() => setActiveTab("home")}
              className={`flex-1 py-1 flex flex-col items-center justify-center gap-1 transition-all hover:text-slate-100 active:scale-90 cursor-pointer ${
                activeTab === "home" 
                  ? "text-blue-400 font-black drop-shadow-[0_0_6px_rgba(59,130,246,0.3)] scale-105" 
                  : "text-slate-400"
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px] font-bold tracking-tight">Home</span>
            </button>

            {/* Tournaments Tab */}
            <button
              onClick={() => setActiveTab("tournaments")}
              className={`flex-1 py-1 flex flex-col items-center justify-center gap-1 transition-all hover:text-slate-100 active:scale-90 cursor-pointer ${
                activeTab === "tournaments" 
                  ? "text-purple-400 font-black drop-shadow-[0_0_6px_rgba(168,85,247,0.3)] scale-105" 
                  : "text-slate-400"
              }`}
            >
              <Trophy className="w-5 h-5" />
              <span className="text-[10px] font-bold tracking-tight">Tourneys</span>
            </button>

            {/* Leaderboard Tab */}
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`flex-1 py-1 flex flex-col items-center justify-center gap-1 transition-all hover:text-slate-100 active:scale-90 cursor-pointer ${
                activeTab === "leaderboard" 
                  ? "text-pink-400 font-black drop-shadow-[0_0_6px_rgba(236,72,153,0.3)] scale-105" 
                  : "text-slate-400"
              }`}
            >
              <BarChart2 className="w-5 h-5" />
              <span className="text-[10px] font-bold tracking-tight">Ranking</span>
            </button>

            {/* Wallet Tab */}
            <button
              onClick={() => setActiveTab("wallet")}
              className={`flex-1 py-1 flex flex-col items-center justify-center gap-1 transition-all hover:text-slate-100 active:scale-90 cursor-pointer ${
                activeTab === "wallet" 
                  ? "text-emerald-400 font-black drop-shadow-[0_0_6px_rgba(16,185,129,0.3)] scale-105" 
                  : "text-slate-400"
              }`}
            >
              <Wallet className="w-5 h-5" />
              <span className="text-[10px] font-bold tracking-tight">Wallet</span>
            </button>

            {/* Profile Tab */}
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex-1 py-1 flex flex-col items-center justify-center gap-1 transition-all hover:text-slate-100 active:scale-90 cursor-pointer ${
                activeTab === "profile" 
                  ? "text-indigo-400 font-black drop-shadow-[0_0_6px_rgba(99,102,241,0.3)] scale-105" 
                  : "text-slate-400"
              }`}
            >
              <UserCircle className="w-5 h-5" />
              <span className="text-[10px] font-bold tracking-tight">Profile</span>
            </button>

          </div>
        </nav>
      )}

      {/* 4. Modals and Slide overlays block */}
      <ModalsContainer 
        activeModal={activeModal} 
        onCloseModal={() => setActiveModal(null)} 
      />

      {/* 5. Custom Toast alerts overlay bubble */}
      {toast && (
        <div 
          onClick={() => setToast(null)}
          className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-full text-xs font-bold shadow-lg z-50 text-white min-w-[240px] text-center cursor-pointer transition-all duration-300 animate-in slide-in-from-bottom-6 ${
            toast.type === "error" 
              ? "bg-gradient-to-r from-red-500 to-rose-600 shadow-red-500/10" 
              : "bg-gradient-to-r from-emerald-500 to-green-600 shadow-emerald-500/10"
          }`}
        >
          {toast.msg}
        </div>
      )}

    </div>
  );
}
