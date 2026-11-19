"use client";

import React, { useState, useEffect } from "react";
import GameWorld from "./GameWorld";
import pjokData from "./data/pjokData.json";

// Ubah kode PIN guru di bawah ini sesuai keinginan (atau atur NEXT_PUBLIC_TEACHER_PIN di Vercel)
const TEACHER_PIN = process.env.NEXT_PUBLIC_TEACHER_PIN || "PJOK2026";

export interface AvatarPreset {
  id: string;
  label: string;
  emoji: string;
  headStyle: "boy" | "girl" | "hijab" | "cap" | "bandana" | "glasses" | "crown";
  skinColor: string;
  shirtColor: string;
  pantsColor: string;
}

export const AVATAR_35_LIST: AvatarPreset[] = [
  { id: "av-01", label: "01. Atlet Putra Merah", emoji: "👦", headStyle: "boy", skinColor: "#fcd34d", shirtColor: "#ef4444", pantsColor: "#1e293b" },
  { id: "av-02", label: "02. Atlet Putri Merah", emoji: "👧", headStyle: "girl", skinColor: "#fcd34d", shirtColor: "#ef4444", pantsColor: "#1e293b" },
  { id: "av-03", label: "03. Atlet Hijab Merah", emoji: "🧕", headStyle: "hijab", skinColor: "#fde68a", shirtColor: "#dc2626", pantsColor: "#0f172a" },
  { id: "av-04", label: "04. Topi Atlet Merah", emoji: "🧢", headStyle: "cap", skinColor: "#f59e0b", shirtColor: "#ef4444", pantsColor: "#1e293b" },
  { id: "av-05", label: "05. Bandana Merah", emoji: "🥋", headStyle: "bandana", skinColor: "#d97706", shirtColor: "#b91c1c", pantsColor: "#111827" },

  { id: "av-06", label: "06. Atlet Putra Biru", emoji: "👦", headStyle: "boy", skinColor: "#fde68a", shirtColor: "#3b82f6", pantsColor: "#1e293b" },
  { id: "av-07", label: "07. Atlet Putri Biru", emoji: "👧", headStyle: "girl", skinColor: "#f59e0b", shirtColor: "#2563eb", pantsColor: "#0f172a" },
  { id: "av-08", label: "08. Atlet Hijab Biru", emoji: "🧕", headStyle: "hijab", skinColor: "#fcd34d", shirtColor: "#3b82f6", pantsColor: "#1e3a8a" },
  { id: "av-09", label: "09. Topi Atlet Biru", emoji: "🧢", headStyle: "cap", skinColor: "#fcd34d", shirtColor: "#0284c7", pantsColor: "#1e293b" },
  { id: "av-10", label: "10. Kacamata Biru", emoji: "🤓", headStyle: "glasses", skinColor: "#fde68a", shirtColor: "#3b82f6", pantsColor: "#1e293b" },

  { id: "av-11", label: "11. Atlet Putra Hijau", emoji: "👦", headStyle: "boy", skinColor: "#d97706", shirtColor: "#22c55e", pantsColor: "#1e293b" },
  { id: "av-12", label: "12. Atlet Putri Hijau", emoji: "👧", headStyle: "girl", skinColor: "#fcd34d", shirtColor: "#16a34a", pantsColor: "#0f172a" },
  { id: "av-13", label: "13. Atlet Hijab Hijau", emoji: "🧕", headStyle: "hijab", skinColor: "#f59e0b", shirtColor: "#10b981", pantsColor: "#064e3b" },
  { id: "av-14", label: "14. Topi Atlet Hijau", emoji: "🧢", headStyle: "cap", skinColor: "#fde68a", shirtColor: "#22c55e", pantsColor: "#1e293b" },
  { id: "av-15", label: "15. Bandana Hijau", emoji: "🥋", headStyle: "bandana", skinColor: "#fcd34d", shirtColor: "#15803d", pantsColor: "#1e293b" },

  { id: "av-16", label: "16. Atlet Putra Kuning", emoji: "👦", headStyle: "boy", skinColor: "#f59e0b", shirtColor: "#eab308", pantsColor: "#1e293b" },
  { id: "av-17", label: "17. Atlet Putri Kuning", emoji: "👧", headStyle: "girl", skinColor: "#fde68a", shirtColor: "#facc15", pantsColor: "#1e293b" },
  { id: "av-18", label: "18. Atlet Hijab Kuning", emoji: "🧕", headStyle: "hijab", skinColor: "#fcd34d", shirtColor: "#eab308", pantsColor: "#334155" },
  { id: "av-19", label: "19. Mahkota Emas", emoji: "👑", headStyle: "crown", skinColor: "#fcd34d", shirtColor: "#f59e0b", pantsColor: "#1e293b" },
  { id: "av-20", label: "20. Kacamata Kuning", emoji: "🤓", headStyle: "glasses", skinColor: "#d97706", shirtColor: "#eab308", pantsColor: "#0f172a" },

  { id: "av-21", label: "21. Atlet Putra Ungu", emoji: "👦", headStyle: "boy", skinColor: "#fcd34d", shirtColor: "#a855f7", pantsColor: "#1e293b" },
  { id: "av-22", label: "22. Atlet Putri Ungu", emoji: "👧", headStyle: "girl", skinColor: "#d97706", shirtColor: "#9333ea", pantsColor: "#0f172a" },
  { id: "av-23", label: "23. Atlet Hijab Ungu", emoji: "🧕", headStyle: "hijab", skinColor: "#fde68a", shirtColor: "#8b5cf6", pantsColor: "#1e1b4b" },
  { id: "av-24", label: "24. Topi Atlet Ungu", emoji: "🧢", headStyle: "cap", skinColor: "#f59e0b", shirtColor: "#7e22ce", pantsColor: "#1e293b" },
  { id: "av-25", label: "25. Mahkota Ungu", emoji: "👑", headStyle: "crown", skinColor: "#fde68a", shirtColor: "#a855f7", pantsColor: "#0f172a" },

  { id: "av-26", label: "26. Atlet Putra Oranye", emoji: "👦", headStyle: "boy", skinColor: "#fde68a", shirtColor: "#f97316", pantsColor: "#1e293b" },
  { id: "av-27", label: "27. Atlet Putri Oranye", emoji: "👧", headStyle: "girl", skinColor: "#fcd34d", shirtColor: "#ea580c", pantsColor: "#0f172a" },
  { id: "av-28", label: "28. Atlet Hijab Oranye", emoji: "🧕", headStyle: "hijab", skinColor: "#d97706", shirtColor: "#f97316", pantsColor: "#1e293b" },
  { id: "av-29", label: "29. Bandana Oranye", emoji: "🥋", headStyle: "bandana", skinColor: "#fcd34d", shirtColor: "#ea580c", pantsColor: "#111827" },
  { id: "av-30", label: "30. Topi Atlet Oranye", emoji: "🧢", headStyle: "cap", skinColor: "#d97706", shirtColor: "#f97316", pantsColor: "#1e293b" },

  { id: "av-31", label: "31. Atlet Putra Pink", emoji: "👦", headStyle: "boy", skinColor: "#fcd34d", shirtColor: "#ec4899", pantsColor: "#1e293b" },
  { id: "av-32", label: "32. Atlet Putri Pink", emoji: "👧", headStyle: "girl", skinColor: "#fde68a", shirtColor: "#db2777", pantsColor: "#0f172a" },
  { id: "av-33", label: "33. Atlet Hijab Pink", emoji: "🧕", headStyle: "hijab", skinColor: "#fcd34d", shirtColor: "#f43f5e", pantsColor: "#1e293b" },
  { id: "av-34", label: "34. Kacamata Tosca", emoji: "🤓", headStyle: "glasses", skinColor: "#f59e0b", shirtColor: "#14b8a6", pantsColor: "#0f172a" },
  { id: "av-35", label: "35. Juara Putih Emas", emoji: "👑", headStyle: "crown", skinColor: "#d97706", shirtColor: "#f8fafc", pantsColor: "#1e293b" },
];

function MenuBGM({ muted }: { muted: boolean }) {
  useEffect(() => {
    if (muted) return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const melody = [523.25, 659.25, 783.99, 659.25, 880.0, 783.99, 659.25, 587.33];
    let step = 0;

    const interval = setInterval(() => {
      if (ctx.state === "suspended") ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(melody[step % melody.length], ctx.currentTime);

      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
      step++;
    }, 360);

    return () => {
      clearInterval(interval);
      ctx.close();
    };
  }, [muted]);

  return null;
}

export default function HomePage() {
  const [selectedFase, setSelectedFase] = useState<any>(null);
  const [playerName, setPlayerName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarPreset>(AVATAR_35_LIST[0]);
  const [isSpectator, setIsSpectator] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // State Modal Kunci PIN Guru
  const [pendingTeacherFase, setPendingTeacherFase] = useState<any>(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");

  const handleOpenTeacherPrompt = (fase: any) => {
    setPendingTeacherFase(fase);
    setPinInput("");
    setPinError("");
  };

  const handleVerifyTeacherPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim().toUpperCase() === TEACHER_PIN.toUpperCase()) {
      const targetFase = pendingTeacherFase;
      setPendingTeacherFase(null);
      setPinInput("");
      setPinError("");
      setIsSpectator(true);
      setSelectedFase(targetFase);
    } else {
      setPinError("❌ Kode PIN Guru salah! Fitur ini terkunci khusus untuk guru.");
    }
  };

  if (selectedFase) {
    return (
      <GameWorld
        faseData={selectedFase}
        playerName={playerName.trim() || "Siswa PJOK"}
        avatarPreset={selectedAvatar}
        isSpectator={isSpectator}
        isMuted={isMuted}
        onBack={() => {
          setSelectedFase(null);
          setIsSpectator(false);
        }}
      />
    );
  }

  return (
    <main className="min-h-[100dvh] bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white flex flex-col items-center justify-start py-4 px-3 md:p-6 overflow-y-auto">
      <MenuBGM muted={isMuted} />

      {/* Modal Kunci PIN Khusus Guru */}
      {pendingTeacherFase && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleVerifyTeacherPin}
            className="bg-slate-900 border-2 border-yellow-400 rounded-2xl p-5 max-w-sm w-full shadow-2xl"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-extrabold text-yellow-400 text-base">
                🔒 Akses Layar Pemantau Guru
              </h3>
              <button
                type="button"
                onClick={() => setPendingTeacherFase(null)}
                className="text-slate-400 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              Mode ini terkunci agar siswa tidak masuk ke layar pantau. Masukkan <b>Kode PIN Guru</b> untuk memantau <b>{pendingTeacherFase.nama_fase}</b>:
            </p>
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Masukkan Kode PIN Guru..."
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-600 text-white text-sm mb-2 focus:outline-none focus:border-yellow-400"
            />
            {pinError && (
              <p className="text-xs text-red-400 font-semibold mb-2">{pinError}</p>
            )}
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => setPendingTeacherFase(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-xl text-xs"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-extrabold py-2 rounded-xl text-xs"
              >
                🔓 Buka Pemantau
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="max-w-3xl w-full bg-slate-900/85 border border-slate-700 rounded-3xl p-4 md:p-7 shadow-2xl backdrop-blur-md">
        <div className="flex justify-between items-center mb-3">
          <span className="bg-yellow-400 text-slate-950 text-[10px] md:text-xs font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
            Kurikulum Merdeka • PJOK SD
          </span>
          <button
            onClick={() => setIsMuted((m) => !m)}
            className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full text-xs font-bold border border-slate-600 shadow transition"
          >
            {isMuted ? "🔇 Musik Mati" : "🎵 Musik Nyala"}
          </button>
        </div>

        <div className="text-center mb-5">
          <h1 className="text-2xl md:text-4xl font-extrabold text-yellow-400">
            🏃‍♂️ {(pjokData as any).judul_game || "PJOKVerse SD"}
          </h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1">
            Isi nama, pilih 1 dari 35 karakter atletmu, lalu pilih fase belajar!
          </p>
        </div>

        {/* Pengaturan Nama & Pilihan 35 Karakter / Avatar */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 mb-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              1. Nama Siswa
            </label>
            <input
              type="text"
              maxLength={16}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Ketik namamu di sini..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-600 text-white text-sm focus:outline-none focus:border-yellow-400"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-300">
                2. Pilih Karakter / Avatar (35 Pilihan)
              </label>
              <span className="text-[11px] font-bold text-yellow-400">
                Terpilih: {selectedAvatar.label}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 max-h-56 overflow-y-auto pr-1">
              {AVATAR_35_LIST.map((av) => {
                const active = selectedAvatar.id === av.id;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition ${
                      active
                        ? "bg-yellow-400/20 border-yellow-400 text-white ring-1 ring-yellow-400"
                        : "bg-slate-900/90 border-slate-700 text-slate-300 hover:border-slate-500"
                    }`}
                  >
                    <span
                      style={{ backgroundColor: av.shirtColor }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 border border-white/60 shadow"
                    >
                      {av.emoji}
                    </span>
                    <span className="text-[11px] font-bold leading-tight line-clamp-2">
                      {av.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pilihan Fase Siswa & Layar Pemantau Guru Terkunci */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {pjokData.fase.map((f: any) => (
            <div
              key={f.id}
              className="bg-slate-800/90 border border-slate-700 hover:border-yellow-400 rounded-2xl p-4 flex flex-col justify-between transition"
            >
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase">{f.nama_fase}</span>
                <h2 className="text-lg font-extrabold text-white mt-0.5">{f.nama_dunia}</h2>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{f.deskripsi}</p>
              </div>

              <div className="mt-4 space-y-2">
                <button
                  onClick={() => {
                    setIsSpectator(false);
                    setSelectedFase(f);
                  }}
                  className="w-full bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-extrabold py-2.5 rounded-xl text-xs md:text-sm transition shadow"
                >
                  ▶ Masuk Sebagai Siswa
                </button>
                <button
                  onClick={() => handleOpenTeacherPrompt(f)}
                  className="w-full bg-slate-900 hover:bg-slate-700 text-sky-300 font-bold py-2 rounded-xl text-xs border border-slate-600 transition flex items-center justify-center gap-1.5"
                >
                  <span>🔒</span>
                  <span>Layar Pemantau Guru</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}