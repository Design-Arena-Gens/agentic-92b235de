"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { topics, motivationQuotes } from "../lib/topics";
import { buildSchedule, displayDate, toYMD } from "../lib/schedule";

function getDefaultTime(): { hour: number; minute: number } {
  return { hour: 9, minute: 0 };
}

export default function Planner() {
  const today = useMemo(() => new Date(), []);

  const [startYmd, setStartYmd] = useState<string>(() => {
    const fromStorage = localStorage.getItem("plannerStartYmd");
    if (fromStorage) return fromStorage;
    return toYMD(today);
  });
  const [time, setTime] = useState<string>(() => {
    const fromStorage = localStorage.getItem("plannerTime");
    if (fromStorage) return fromStorage;
    const def = getDefaultTime();
    return `${String(def.hour).padStart(2, "0")}:${String(def.minute).padStart(2, "0")}`;
  });
  const [completed, setCompleted] = useState<number[]>(() => {
    try {
      const raw = localStorage.getItem("plannerCompleted");
      return raw ? (JSON.parse(raw) as number[]) : [];
    } catch {
      return [];
    }
  });
  const [notifPerm, setNotifPerm] = useState<NotificationPermission | "unsupported">(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported"
  );

  const schedule = useMemo(() => {
    const [hour, minute] = time.split(":").map((v) => parseInt(v, 10));
    return buildSchedule(startYmd, hour, minute);
  }, [startYmd, time]);

  const currentIndex = useMemo(() => {
    const now = new Date();
    const index = schedule.findIndex((entry) => now < entry.startAt);
    if (index === -1) return topics.length - 1;
    return Math.max(0, index - 1);
  }, [schedule]);

  const progressPct = Math.round((completed.length / topics.length) * 100);

  useEffect(() => {
    localStorage.setItem("plannerStartYmd", startYmd);
  }, [startYmd]);
  useEffect(() => {
    localStorage.setItem("plannerTime", time);
  }, [time]);
  useEffect(() => {
    localStorage.setItem("plannerCompleted", JSON.stringify(completed));
  }, [completed]);

  const quote = useMemo(() => {
    return motivationQuotes[Math.floor(Math.random() * motivationQuotes.length)];
  }, [startYmd, time, completed.length]);

  const toggleToday = () => {
    const idx = currentIndex;
    setCompleted((prev) => (prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]));
  };

  const resetProgress = () => setCompleted([]);

  // Notifications (best-effort, while tab is open)
  const timerRef = useRef<number | null>(null);
  const scheduleNotification = () => {
    if (!(typeof window !== "undefined" && "Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    if (timerRef.current) window.clearTimeout(timerRef.current);

    const [hour, minute] = time.split(":").map((v) => parseInt(v, 10));
    const now = new Date();
    const target = new Date();
    target.setHours(hour, minute, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    const ms = target.getTime() - now.getTime();
    timerRef.current = window.setTimeout(() => {
      const idx = currentIndex;
      const title = `Day ${idx + 1}: ${topics[idx]}`;
      const body = "Time to study today?s topic!";
      try { new Notification(title, { body }); } catch {}
      // Chain next reminder for tomorrow
      scheduleNotification();
    }, Math.min(ms, 2_147_483_000));
  };

  useEffect(() => {
    scheduleNotification();
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time, startYmd, notifPerm]);

  const enableNotifications = async () => {
    if (!(typeof window !== "undefined" && "Notification" in window)) {
      setNotifPerm("unsupported");
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setNotifPerm(perm);
      if (perm === "granted") scheduleNotification();
    } catch {}
  };

  const [hour, minute] = time.split(":").map((v) => parseInt(v, 10));
  const icsHref = `/api/ics?start=${startYmd}&hour=${hour}&minute=${minute}`;

  const todayDone = completed.includes(currentIndex);

  return (
    <>
      <section className="card">
        <div className="controls">
          <div>
            <label>Start date</label>
            <input
              type="date"
              value={startYmd}
              onChange={(e) => setStartYmd(e.target.value)}
            />
          </div>
          <div>
            <label>Daily reminder time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
          <div>
            <label>&nbsp;</label>
            <a className="secondary" href={icsHref} download>
              <button className="secondary">Download ICS</button>
            </a>
          </div>
          <div>
            <label>&nbsp;</label>
            <button className="primary" onClick={enableNotifications}>
              {notifPerm === "granted" ? "Notifications enabled" : "Enable notifications"}
            </button>
          </div>
          <div>
            <label>&nbsp;</label>
            <button className="secondary" onClick={resetProgress}>Reset progress</button>
          </div>
        </div>
      </section>

      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="badge">Today</div>
            <h3 style={{ margin: "6px 0" }}>Day {currentIndex + 1} ? {topics[currentIndex]}</h3>
            <small className="dim">{displayDate(schedule[currentIndex].date)} at {String(hour).padStart(2, "0")}:{String(minute).padStart(2, "0")}</small>
          </div>
          <div>
            <button className="primary" onClick={toggleToday}>{todayDone ? "Mark as not done" : "Mark as done"}</button>
          </div>
        </div>
        <div style={{ marginTop: 12 }} className="progress"><span style={{ width: `${progressPct}%` }} /></div>
        <p className="quote" style={{ marginTop: 12 }}>{quote}</p>
      </section>

      <section className="card">
        <h3 style={{ marginTop: 0 }}>Full plan</h3>
        <div className="grid">
          {schedule.map((entry, idx) => (
            <div className="list-item" key={idx}>
              <h4>Day {idx + 1} ? {topics[idx]}</h4>
              <small className="dim">{displayDate(entry.date)} at {String(hour).padStart(2, "0")}:{String(minute).padStart(2, "0")}</small>
              <div style={{ marginTop: 8 }}>
                <span className="badge" style={{ background: completed.includes(idx) ? '#dcfce7' : '#f1f5f9', borderColor: completed.includes(idx) ? '#86efac' : undefined }}>
                  {completed.includes(idx) ? 'Done' : 'Pending'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
