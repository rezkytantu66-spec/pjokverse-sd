"use client";

import React, { useState } from "react";
import pjokData from "./data/pjokData.json";
import GameWorld from "./GameWorld";

const SHIRT_COLORS = [
  { name: "Merah", hex: "#ef4444" },
  { name: "Biru", hex: "#3b82f6" },
  { name: "Hijau", hex: "#22c55e" },
  { name: "Kuning", hex: "#eab308" },
  { name: "Ungu", hex: "#a855f7" },
];

export default function Home() {
  const [selectedFase, setSelectedFase] = useState<any>(null);
  const [playerName, setPlayerName] = useState("");
  const [shirtColor, setShirtColor] = useState("#ef4444");
  const [isTeacherMode, setIsTeacherMode] = useState(false);

  if (selectedFase) {
    return (
      <GameWorld
        faseData={selectedFase}
        playerName={isTeacherMode ? "Guru Pemantau" : playerName.trim() || "Siswa PJOK"}
        shirtColor={shirtColor}
        isSpectator={isTeacherMode}
        onBack={() => setSelectedFase(null)}
      />
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-500 to-blue-800 flex flex-col items-center justify-center p-6 text-white">
      <div className="max-w-4xl w-full bg-slate-900/90 backdrop-blur-md p-8 rounded-3xl border border-slate-700 shadow-2xl text-center">
        <span className="bg-yellow-400 text-slate-950 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
          {pjokData.kurikulum}
        </span>
        <h1 className="text-3xl md:text-5xl font-extrabold mt-3 mb-2">
          PJOK<span className="text-yellow-400">Verse</span> SD
        </h1>
        <p className="text-slate-300 text-sm md:text-base mb-6">
          Isi namamu, pilih warna kaos olahraga, lalu masuk ke dunia 3D bersama <b>Coach Resky</b>!
        </p>

        {/* Pilihan Peran: Siswa atau Layar Pemantau Guru */}
        <div className="max-w-md mx-auto flex bg-slate-800 p-1.5 rounded-2xl border border-slate-600 mb-5">
          <button
            type="button"
            onClick={() => setIsTeacherMode(false)}
            className={`flex-1 py-2.5 rounded-xl text-xs md:text-sm font-extrabold transition ${
              !isTeacherMode
                ? "bg-yellow-400 text-slate-950 shadow"
                : "text-slate-300 hover:text-white"
            }`}
          >
            🏃 Mode Siswa (HP)
          </button>
          <button
            type="button"
            onClick={() => setIsTeacherMode(true)}
            className={`flex-1 py-2.5 rounded-xl text-xs md:text-sm font-extrabold transition ${
              isTeacherMode
                ? "bg-emerald-400 text-slate-950 shadow"
                : "text-slate-300 hover:text-white"
            }`}
          >
            🖥️ Layar Pemantau Guru
          </button>
        </div>

        {/* Input Nama Siswa & Warna Kaos (Hanya muncul di Mode Siswa) */}
        {!isTeacherMode ? (
          <div className="max-w-md mx-auto bg-slate-800/80 p-4 rounded-2xl border border-slate-600 mb-7 text-left">
            <label className="block text-xs font-bold text-yellow-400 uppercase mb-1.5">
              Nama Panggilan Siswa
            </label>
            <input
              type="text"
              maxLength={16}
              placeholder="Contoh: Budi, Siti, Andi..."
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-600 text-white text-sm focus:outline-none focus:border-yellow-400 mb-4"
            />

            <label className="block text-xs font-bold text-yellow-400 uppercase mb-1.5">
              Warna Kaos Olahraga
            </label>
            <div className="flex items-center gap-3">
              {SHIRT_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setShirtColor(c.hex)}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                  className={`w-9 h-9 rounded-full transition-transform ${
                    shirtColor === c.hex ? "scale-125 ring-4 ring-white" : "opacity-75 hover:opacity-100"
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto bg-emerald-950/70 p-4 rounded-2xl border border-emerald-500/60 mb-7 text-left">
            <p className="text-sm font-extrabold text-emerald-300 mb-1">
              🖥️ Mode Proyektor / Layar Kelas Aktif
            </p>
            <p className="text-xs text-slate-200 leading-relaxed">
              Pilih Fase pembelajaran di bawah untuk memantau seluruh pergerakan siswa dari sudut pandang udara tanpa memunculkan karakter guru di lapangan.
            </p>
          </div>
        )}

        {/* Pilihan Fase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
          {pjokData.fase.map((fase) => (
            <button
              key={fase.id}
              onClick={() => setSelectedFase(fase)}
              className="group bg-slate-800 hover:bg-blue-600 border border-slate-600 hover:border-yellow-400 p-6 rounded-2xl transition-all flex flex-col justify-between shadow-lg"
            >
              <div>
                <span className="text-xs font-bold text-yellow-400 uppercase">{fase.nama_dunia}</span>
                <h2 className="text-xl font-extrabold mt-1 mb-2 group-hover:text-white">{fase.nama_fase}</h2>
                <p className="text-xs text-slate-300 group-hover:text-blue-100 leading-relaxed">
                  {fase.deskripsi}
                </p>
              </div>
              <div className="mt-6 text-sm font-bold text-emerald-400 group-hover:text-yellow-300">
                {isTeacherMode ? "Buka Layar Pemantau →" : "Mulai Belajar →"}
              </div>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}