/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  writeBatch,
  query,
  getDocs
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { UserProfile, AppNotification } from "../types";
import { 
  Bell, 
  Sparkles, 
  Trophy, 
  Flag, 
  Megaphone, 
  Check, 
  Trash2, 
  X, 
  Chrome, 
  ShieldAlert 
} from "lucide-react";

interface NotificationsCenterProps {
  userProfile: UserProfile;
  onNotifyToast: (msg: string, type: "success" | "error") => void;
}

export default function NotificationsCenter({ userProfile, onNotifyToast }: NotificationsCenterProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [nativePermission, setNativePermission] = useState<NotificationPermission>(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default"
  );
  
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play a soft synthetic synthesizer notification chime
  function playRingtone() {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = "sine";
      
      // Ringtone chime: standard beautiful ascending esports beep
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Audio Context beep failed", e);
    }
  }

  // Real-time notifications listener
  useEffect(() => {
    // Query all to process client-side and prevent single composite-index limitations
    const q = query(collection(db, "notifications"));
    
    // Track previous notification IDs to notice new entries
    const seenIds = new Set<string>();
    let firstLoad = true;

    const unsub = onSnapshot(q, (snapshot) => {
      const list: AppNotification[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        // Client-side secure filter to match player or general broadcasts
        if (data.userId === userProfile.uid || data.userId === "all") {
          list.push({
            id: docSnap.id,
            ...data
          } as AppNotification);
        }
      });

      // Client-side sort by createdAt descending
      list.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      // Detect newly created notifications for local visual/audio cues and native push triggers
      if (!firstLoad && list.length > 0) {
        const freshEntries = list.filter(item => !seenIds.has(item.id) && !item.isRead);
        if (freshEntries.length > 0) {
          // Play notification sound
          playRingtone();
          
          // Trigger browsers push API alert
          freshEntries.forEach(item => {
            onNotifyToast(`🔔 ${item.title}: ${item.body}`, "success");
            
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              try {
                new window.Notification(item.title, {
                  body: item.body,
                  icon: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=128"
                });
              } catch (e) {
                console.error("Native browser Notification trigger error:", e);
              }
            }
          });
        }
      }

      // Catalog all IDs
      list.forEach(item => seenIds.add(item.id));
      firstLoad = false;
      setNotifications(list);
    }, (error) => {
      console.error("Notifications listener failed:", error);
    });

    return () => unsub();
  }, [userProfile.uid]);

  // Request browser permission for push notifications
  async function requestBrowserPermission() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      onNotifyToast("Push Notifications are not supported by this browser.", "error");
      return;
    }

    try {
      const permission = await window.Notification.requestPermission();
      setNativePermission(permission);
      if (permission === "granted") {
        onNotifyToast("Native push notification channel registered successfully!", "success");
        playRingtone();
      } else {
        onNotifyToast("Notification access denied.", "error");
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Mark specific notification as read
  async function markAsRead(id: string) {
    try {
      await updateDoc(doc(db, "notifications", id), {
        isRead: true
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `notifications/${id}`);
    }
  }

  // Mark all notifications as read
  async function markAllAsRead() {
    try {
      const unread = notifications.filter(n => !n.isRead);
      if (unread.length === 0) return;

      const batch = writeBatch(db);
      unread.forEach(n => {
        batch.update(doc(db, "notifications", n.id), { isRead: true });
      });
      await batch.commit();
      onNotifyToast("All notifications marked as read", "success");
    } catch (err) {
      console.error("Error bulk marking notifications read:", err);
    }
  }

  // Clear / remove all notifications
  async function clearAllNotifications() {
    try {
      if (notifications.length === 0) return;
      const batch = writeBatch(db);
      notifications.forEach(n => {
        batch.delete(doc(db, "notifications", n.id));
      });
      await batch.commit();
      onNotifyToast("Inbox notifications basket cleared", "success");
    } catch (err) {
      console.error("Error bulk deleting notifications:", err);
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative select-none">
      {/* Bell alert trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700/90 flex items-center justify-center text-slate-200 transition-all hover:bg-slate-700 hover:text-white cursor-pointer relative active:scale-90"
        title="Gaming Notifications Center"
      >
        <Bell className={`w-4 h-4 ${unreadCount > 0 ? "animate-bounce text-indigo-400" : ""}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white font-extrabold text-[9px] w-5 h-5 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-900 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Drawer Popover Panel */}
      {isOpen && (
        <>
          {/* Backdrop screen lock */}
          <div className="fixed inset-0 z-40 bg-zinc-950/20 backdrop-blur-xs" onClick={() => setIsOpen(false)} />
          
          <div className="absolute right-0 mt-2.5 w-80 sm:w-85 bg-slate-900 border border-slate-800/95 rounded-2xl shadow-2xl z-50 p-4 shrink-0 flex flex-col max-h-[80vh] overflow-hidden animate-in slide-in-from-top-3 duration-150">
            <div className="flex justify-between items-center border-b border-slate-850 pb-2.5">
              <div className="flex items-center gap-1.5">
                <Bell className="w-4.5 h-4.5 text-indigo-400" />
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-100">Live Notification Center</h4>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 rounded-full hover:bg-slate-800 transition flex items-center justify-center text-slate-500 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick action controls */}
            {notifications.length > 0 && (
              <div className="flex justify-between py-2 border-b border-slate-850/60 text-[10px] items-center">
                <button 
                  onClick={markAllAsRead}
                  className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer transition"
                >
                  <Check className="w-3 h-3" /> Mark all read
                </button>
                <button 
                  onClick={clearAllNotifications}
                  className="text-rose-400 hover:text-rose-350 font-bold flex items-center gap-1 cursor-pointer transition"
                >
                  <Trash2 className="w-3 h-3" /> Clear Inbox
                </button>
              </div>
            )}

            {/* Content Scrolling Body */}
            <div className="overflow-y-auto space-y-2 mt-3 flex-grow pr-1 max-h-[350px]">
              
              {/* Native Push Request Button */}
              {nativePermission !== "granted" && (
                <button
                  type="button"
                  onClick={requestBrowserPermission}
                  className="w-full p-2.5 mb-1 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 hover:from-blue-900/60 hover:to-indigo-900/60 text-slate-200 rounded-xl border border-blue-500/15 flex items-center gap-2 text-left cursor-pointer transition"
                >
                  <Chrome className="w-4.5 h-4.5 text-blue-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-black text-[10px] uppercase tracking-wide text-blue-400">Enable Push Notifications</p>
                    <p className="text-[9px] text-slate-400 font-semibold truncate">Get tournament alarms on desktop background!</p>
                  </div>
                </button>
              )}

              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Sparkles className="w-8 h-8 text-indigo-500/60 mx-auto mb-2 animate-pulse" />
                  <p className="text-xs font-bold text-slate-300">All caught up!</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 max-w-[200px] mx-auto font-medium leading-normal">
                    Notifications alert you when tournament status updates or custom results post.
                  </p>
                </div>
              ) : (
                notifications.map(n => {
                  // Style configurations based on type
                  let typeIcon = <Bell className="w-4 h-4 text-slate-100" />;
                  let typeBg = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                  
                  if (n.type === "start") {
                    typeIcon = <Flag className="w-4 h-4 text-emerald-400" />;
                    typeBg = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                  } else if (n.type === "results") {
                    typeIcon = <Trophy className="w-4 h-4 text-amber-400" />;
                    typeBg = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                  } else if (n.type === "announcement") {
                    typeIcon = <Megaphone className="w-4 h-4 text-pink-405" />;
                    typeBg = "bg-pink-500/10 text-pink-400 border-pink-500/20";
                  }

                  let diffStr = "Just now";
                  if (n.createdAt) {
                    try {
                      const t = n.createdAt?.toDate ? n.createdAt.toDate() : new Date(n.createdAt);
                      const diffSec = Math.floor((Date.now() - t.getTime()) / 1000);
                      if (diffSec < 60) diffStr = "1m ago";
                      else if (diffSec < 3600) diffStr = `${Math.floor(diffSec / 60)}m ago`;
                      else if (diffSec < 86400) diffStr = `${Math.floor(diffSec / 3600)}h ago`;
                      else diffStr = `${Math.floor(diffSec / 86400)}d ago`;
                    } catch (e) {
                      console.error(e);
                    }
                  }

                  return (
                    <div 
                      key={n.id}
                      onClick={() => !n.isRead && markAsRead(n.id)}
                      className={`p-3 rounded-xl border transition flex gap-2.5 items-start relative overflow-hidden ${
                        n.isRead 
                          ? "bg-slate-950/40 border-slate-850/80 hover:bg-slate-950/60" 
                          : "bg-slate-900 border-indigo-500/20 hover:border-indigo-400/30 shadow-md cursor-pointer"
                      }`}
                    >
                      {/* Active state indicator dot */}
                      {!n.isRead && (
                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full col bg-indigo-400 animate-ping" />
                      )}

                      <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border ${typeBg}`}>
                        {typeIcon}
                      </div>

                      <div className="min-w-0 flex-grow leading-tight">
                        <div className="flex justify-between items-start gap-1">
                          <p className={`text-xs uppercase tracking-tight truncate ${n.isRead ? "text-slate-300 font-bold" : "text-white font-black"}`}>
                            {n.title}
                          </p>
                          <span className="text-[8px] font-bold text-slate-500 shrink-0 font-mono">{diffStr}</span>
                        </div>
                        <p className={`text-[10px] mt-1 font-semibold leading-relaxed break-words text-slate-400`}>
                          {n.body}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}

            </div>
          </div>
        </>
      )}
    </div>
  );
}
