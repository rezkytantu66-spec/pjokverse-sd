"use client";

import React, { useState, useEffect } from "react";
import GameWorld from "./GameWorld";
import pjokData from "./data/pjokData.json";

const SHIRT_COLORS = [
  { name: "Merah", hex: "#ef4444" },
  { name: "Biru", hex: "#3b82f6" },
  { name: "Kuning", hex: "#eab308" },
  { name: "Hijau", hex: "#22c55e" },
  { name: "Ungu", hex: "#a855f7" },
  { name: "Oranye", hex: "#f97316" },
];

const AVATAR_STYLES = [
  { id: "boy", label: "👦 Putra" },
  { id: "girl", label: "👧 Putri" },
  { id: "hijab", label: "🧕 Hijab" },
  { id: "cap", label: "🧢 Topi Atlet" },
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
  const [shirtColor, setShirtColor] = useState(SHIRT_COLORS[1].hex);
  const [avatarType, setAvatarType] = useState("boy");
  const [isSpectator, setIsSpectator] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  if (selectedFase) {
    return (
      <GameWorld
        faseData={selectedFase}
        playerName={playerName.trim() || "Siswa PJOK"}
        shirtColor={shirtColor}
        avatarType={avatarType}
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
    <main className="min-h-[100dvh] bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white flex flex-col items-center justify-center p-4 md:p-6">
      <MenuBGM muted={isMuted} />

      <div className="max-w-4xl w-full bg-slate-900/80 border border-slate-700 rounded-3xl p-5 md:p-8 shadow-2xl backdrop-blur-md">
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setIsMuted((m) => !m)}
            className="bg-slate-800 hover:bg-slate-700 px-3.5 py-1.5 rounded-full text-xs font-bold border border-slate-600 shadow transition"
          >
            {isMuted ? "🔇 Musik Mati" : "🎵 Musik Nyala"}
          </button>
        </div>

        <div className="text-center mb-6">
          <span className="bg-yellow-400 text-slate-950 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            Kurikulum Merdeka • PJOK SD
          </span>
          <h1 className="text-2xl md:text-4xl font-extrabold mt-2 text-yellow-400">
            🏃‍♂️ {(pjokData as any).judul_game || "PJOKVerse SD"}
          </h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1">
            Atur karaktermu, lalu pilih fase belajar atau masuk sebagai Layar Pemantau Guru!
          </p>
        </div>

        {/* Pengaturan Nama, Gaya Avatar & Warna Kaos */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Nama Siswa
            </label>
            <input
              type="text"
              maxLength={16}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Ketik namamu..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-600 text-white text-sm focus:outline-none focus:border-yellow-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Gaya Karakter
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {AVATAR_STYLES.map((av) => (
                <button
                  key={av.id}
                  onClick={() => setAvatarType(av.id)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-bold border transition ${
                    avatarType === av.id
                      ? "bg-yellow-400 text-slate-950 border-white"
                      : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
                  }`}
                >
                  {av.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Warna Kaos Olahraga
            </label>
            <div className="flex flex-wrap gap-2">
              {SHIRT_COLORS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setShirtColor(c.hex)}
                  style={{ backgroundColor: c.hex }}
                  className={`w-7 h-7 rounded-full border-2 transition ${
                    shirtColor === c.hex ? "border-white scale-110 ring-2 ring-yellow-400" : "border-transparent opacity-75"
                  }`}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Pilihan Fase Siswa */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  className="w-full bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-extrabold py-2 rounded-xl text-xs md:text-sm transition"
                >
                  ▶ Masuk Sebagai Siswa
                </button>
                <button
                  onClick={() => {
                    setIsSpectator(true);
                    setSelectedFase(f);
                  }}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-sky-300 font-bold py-1.5 rounded-xl text-xs border border-slate-600 transition"
                >
                  🖥️ Layar Pemantau Guru
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}