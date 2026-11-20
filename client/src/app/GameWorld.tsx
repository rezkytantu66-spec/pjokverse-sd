"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text, Sky, Environment } from "@react-three/drei";
import * as THREE from "three";
import { io, Socket } from "socket.io-client";
import pjokData from "./data/pjokData.json";
import { AVATAR_35_LIST, AvatarPreset } from "./page";

const ARENA_TILES = [
  { id: 0, label: "A", color: "#ef4444", pos: [-4.2, 0, 13.8] as [number, number, number] },
  { id: 1, label: "B", color: "#3b82f6", pos: [4.2, 0, 13.8] as [number, number, number] },
  { id: 2, label: "C", color: "#eab308", pos: [-4.2, 0, 22.2] as [number, number, number] },
  { id: 3, label: "D", color: "#22c55e", pos: [4.2, 0, 22.2] as [number, number, number] },
];

const BUILDING_COLORS = [
  "#f97316",
  "#8b5cf6",
  "#0ea5e9",
  "#10b981",
  "#ec4899",
  "#eab308",
];

const LEVEL_NAMES: { [lvl: number]: string } = {
  1: "Pemula",
  2: "Dasar",
  3: "Terampil",
  4: "Mahir",
  5: "Juara PJOK",
};

const XP_PER_CHARACTER_LEVEL = 500;

function getCharacterLevelFromXp(xp: number): number {
  return Math.min(20, Math.floor(Math.max(0, xp) / XP_PER_CHARACTER_LEVEL) + 1);
}

function getCharacterTitle(charLevel: number): string {
  if (charLevel <= 2) return "Taruna PJOK";
  if (charLevel <= 5) return "Atlet Muda";
  if (charLevel <= 9) return "Bintang Lapangan";
  if (charLevel <= 14) return "Kapten Juara";
  return "Legenda PJOK";
}

// =========================================================================
// DATA 6 RUANG KELAS DI DALAM GEDUNG SEKOLAH (KELAS 1 - 6)
// =========================================================================
interface SchoolClassroomMission {
  id: string;
  kelas: number;
  namaKelas: string;
  tingkatKesulitan: string;
  bintang: string;
  warna: string;
  pos: [number, number, number];
  sisi: "kiri" | "kanan";
  judulMisi: string;
  deskripsiMisi: string;
  xpReward: number;
  soalMisi: {
    pertanyaan: string;
    pilihan: string[];
    jawaban_benar: number;
    pembahasan: string;
  }[];
}

const SCHOOL_CLASSROOMS: SchoolClassroomMission[] = [
  {
    id: "kelas-1",
    kelas: 1,
    namaKelas: "Ruang Kelas 1",
    tingkatKesulitan: "Tingkat 1 • Pemula",
    bintang: "⭐",
    warna: "#22c55e",
    pos: [-8.5, 0, 12],
    sisi: "kiri",
    judulMisi: "Misi Gerak Lokomotor Dasar",
    deskripsiMisi: "Bantu Pak Lukman mengenali gerak berjalan dan berlari yang benar untuk siswa Kelas 1!",
    xpReward: 100,
    soalMisi: [
      {
        pertanyaan: "Saat berjalan ke depan dengan sikap tubuh yang baik, pandangan mata seharusnya mengarah ke ...",
        pilihan: ["Bawah sepatu", "Depan lurus", "Samping kiri terus", "Langit atas"],
        jawaban_benar: 1,
        pembahasan: "Pandangan mata lurus ke depan menjaga keseimbangan dan mencegah menabrak rintangan.",
      },
      {
        pertanyaan: "Gerakan berpindah tempat dari satu titik ke titik lain seperti berjalan dan berlari disebut gerak ...",
        pilihan: ["Lokomotor", "Non-lokomotor", "Diam di tempat", "Tidur siang"],
        jawaban_benar: 0,
        pembahasan: "Gerak lokomotor adalah gerakan yang memindahkan seluruh tubuh dari satu tempat ke tempat lain.",
      },
    ],
  },
  {
    id: "kelas-2",
    kelas: 2,
    namaKelas: "Ruang Kelas 2",
    tingkatKesulitan: "Tingkat 2 • Dasar",
    bintang: "⭐⭐",
    warna: "#14b8a6",
    pos: [8.5, 0, 12],
    sisi: "kanan",
    judulMisi: "Misi Keseimbangan & Sikap Pesawat Terbang",
    deskripsiMisi: "Uji pengetahuan keseimbangan statis dan senam lantai dasar tingkat Kelas 2!",
    xpReward: 150,
    soalMisi: [
      {
        pertanyaan: "Untuk menjaga keseimbangan saat berdiri dengan satu kaki meniru pesawat terbang, kedua lengan sebaiknya ...",
        pilihan: ["Dilipat di dada", "Direntangkan lurus ke samping", "Dimasukkan ke saku", "Diletakkan di kepala"],
        jawaban_benar: 1,
        pembahasan: "Merentangkan kedua lengan ke samping membantu menjaga titik pusat keseimbangan tubuh.",
      },
      {
        pertanyaan: "Alat empuk yang digunakan sebagai alas saat berlatih senam lantai agar tidak cedera adalah ...",
        pilihan: ["Papan kayu", "Matras senam", "Lantai keramik", "Batu bata"],
        jawaban_benar: 1,
        pembahasan: "Matras empuk melindungi kepala, punggung, dan persendian saat berlatih senam lantai.",
      },
    ],
  },
  {
    id: "kelas-3",
    kelas: 3,
    namaKelas: "Ruang Kelas 3",
    tingkatKesulitan: "Tingkat 3 • Terampil",
    bintang: "⭐⭐⭐",
    warna: "#3b82f6",
    pos: [-8.5, 0, 0],
    sisi: "kiri",
    judulMisi: "Misi Koordinasi Lempar Tangkap Bola",
    deskripsiMisi: "Selesaikan tantangan gerak manipulatif melempar dan menangkap bola tingkat Kelas 3!",
    xpReward: 200,
    soalMisi: [
      {
        pertanyaan: "Ketika menangkap bola yang datang setinggi dada, posisi kedua telapak tangan yang tepat adalah ...",
        pilihan: [
          "Membentuk mangkuk terbuka menghadap arah bola",
          "Mengepal erat seperti meninju",
          "Disilangkan di belakang punggung",
          "Ditutup rapat menghadap tanah",
        ],
        jawaban_benar: 0,
        pembahasan: "Telapak tangan terbuka membentuk mangkuk dengan jari rileks meredam laju bola agar tidak terlepas.",
      },
      {
        pertanyaan: "Permainan kasti dan rounders mengombinasikan tiga gerak dasar utama, yaitu ...",
        pilihan: [
          "Berenang, menyelam, dan mengapung",
          "Melempar, menangkap, dan memukul bola",
          "Berguling, meroda, dan kayang",
          "Menendang, menyundul, dan menggiring",
        ],
        jawaban_benar: 1,
        pembahasan: "Permainan bola kecil seperti kasti melatih ketepatan melempar, menangkap, dan memukul bola.",
      },
    ],
  },
  {
    id: "kelas-4",
    kelas: 4,
    namaKelas: "Ruang Kelas 4",
    tingkatKesulitan: "Tingkat 4 • Menengah",
    bintang: "⭐⭐⭐⭐",
    warna: "#8b5cf6",
    pos: [8.5, 0, 0],
    sisi: "kanan",
    judulMisi: "Misi Taktik Permainan Invasi & Net",
    deskripsiMisi: "Pecahkan strategi operan akurat dan teknik dasar permainan beregu Kelas 4!",
    xpReward: 250,
    soalMisi: [
      {
        pertanyaan: "Dalam permainan sepak bola, bagian kaki yang paling akurat digunakan untuk mengoper bola jarak pendek kepada teman adalah ...",
        pilihan: ["Ujung jari kaki", "Kaki bagian dalam", "Tumit belakang", "Lutut"],
        jawaban_benar: 1,
        pembahasan: "Permukaan kaki bagian dalam lebih lebar dan datar sehingga arah bola mudah dikontrol.",
      },
      {
        pertanyaan: "Pada saat melakukan passing bawah bola voli, perkenaan bola yang benar berada pada ...",
        pilihan: [
          "Ujung jari-jari tangan",
          "Pergelangan hingga lengan bawah yang dirapatkan lurus",
          "Siku yang ditekuk ke atas",
          "Dahi atau kepala bagian atas",
        ],
        jawaban_benar: 1,
        pembahasan: "Lengan bawah yang rapat dan lurus menghasilkan pantulan bola voli yang stabil dan terarah.",
      },
    ],
  },
  {
    id: "kelas-5",
    kelas: 5,
    namaKelas: "Ruang Kelas 5",
    tingkatKesulitan: "Tingkat 5 • Mahir",
    bintang: "⭐⭐⭐⭐⭐",
    warna: "#f97316",
    pos: [-8.5, 0, -12],
    sisi: "kiri",
    judulMisi: "Misi Kebugaran Jasmani & Daya Tahan Jantung",
    deskripsiMisi: "Tantangan analisis kebugaran jasmani, pemanasan, dan daya tahan kardiorespirasi Kelas 5!",
    xpReward: 350,
    soalMisi: [
      {
        pertanyaan: "Mengapa pemanasan (warming up) wajib dilakukan sebelum olahraga inti dengan intensitas tinggi?",
        pilihan: [
          "Agar cepat merasa lelah dan mengantuk",
          "Menaikkan suhu tubuh secara bertahap dan menyiapkan otot serta sendi agar terhindar dari cedera",
          "Menurunkan detak jantung hingga berhenti",
          "Menggantikan kebutuhan minum air putih",
        ],
        jawaban_benar: 1,
        pembahasan: "Pemanasan melancarkan aliran darah ke otot dan meningkatkan kelenturan sendi sebelum aktivitas berat.",
      },
      {
        pertanyaan: "Latihan lari pelan secara teratur selama 15-20 menit (jogging) terutama bermanfaat untuk melatih ...",
        pilihan: [
          "Daya tahan jantung dan paru-paru",
          "Kekuatan otot jari tangan saja",
          "Kemampuan menahan napas di dalam air",
          "Kelenturan pergelangan kaki saja",
        ],
        jawaban_benar: 0,
        pembahasan: "Jogging adalah latihan aerobik yang memperkuat kerja jantung dan kapasitas paru-paru.",
      },
      {
        pertanyaan: "Gerakan push-up dan plank secara teratur bertujuan untuk meningkatkan kekuatan serta daya tahan otot ...",
        pilihan: ["Lengan, bahu, dada, dan otot inti perut", "Daun telinga", "Jari kaki saja", "Otot leher bagian belakang"],
        jawaban_benar: 0,
        pembahasan: "Push-up dan plank melatih kekuatan otot tubuh bagian atas serta stabilitas otot inti (core).",
      },
    ],
  },
  {
    id: "kelas-6",
    kelas: 6,
    namaKelas: "Ruang Kelas 6",
    tingkatKesulitan: "Tingkat 6 • Juara Ujian",
    bintang: "👑",
    warna: "#ef4444",
    pos: [8.5, 0, -12],
    sisi: "kanan",
    judulMisi: "Misi Ujian Akhir Juara PJOK SD",
    deskripsiMisi: "Misi tertinggi di gedung sekolah! Buktikan penguasaan penuh PJOK dan pertolongan pertama Kelas 6!",
    xpReward: 500,
    soalMisi: [
      {
        pertanyaan: "Saat teman mengalami kram otot betis di lapangan olahraga, tindakan pertolongan pertama yang paling tepat adalah ...",
        pilihan: [
          "Memaksanya langsung berlari cepat kembali",
          "Menghentikan aktivitas, meluruskan kaki perlahan, dan meregangkan otot betis dengan lembut",
          "Memukul bagian betis dengan benda keras",
          "Menyuruhnya melompat-lompat dengan satu kaki",
        ],
        jawaban_benar: 1,
        pembahasan: "Mengistirahatkan otot dan melakukan peregangan perlahan membantu melemaskan kontraksi otot yang kram.",
      },
      {
        pertanyaan: "Prinsip penanganan cedera terkilir (keseleo) ringan yang dikenal dengan metode RICE terdiri dari ...",
        pilihan: [
          "Run, Jump, Climb, Exercise",
          "Rest (Istirahat), Ice (Kompres Es), Compression (Balut Tekan), Elevation (Tinggikan)",
          "Read, Inspect, Count, Evaluate",
          "Relax, Inhale, Cool, Eat",
        ],
        jawaban_benar: 1,
        pembahasan: "Metode RICE (Rest, Ice, Compression, Elevation) efektif mengurangi pembengkakan dan nyeri pada cedera jaringan lunak.",
      },
      {
        pertanyaan: "Kombinasi pola hidup sehat yang paling ideal untuk mendukung pertumbuhan fisik siswa usia sekolah adalah ...",
        pilihan: [
          "Begadang bermain gawai dan melewatkan sarapan",
          "Gizi seimbang, aktivitas fisik teratur 60 menit/hari, minum air cukup, dan tidur 8-10 jam",
          "Hanya makan makanan manis tanpa sayuran",
          "Berolahraga berat tanpa pernah istirahat",
        ],
        jawaban_benar: 1,
        pembahasan: "Keseimbangan nutrisi, olahraga rutin, hidrasi, dan tidur berkualitas adalah kunci kebugaran optimal.",
      },
    ],
  },
];

const EXPLORE_OBJECTS = [
  {
    id: "obj-bola-sepak",
    nama: "Bola & Gawang Sepak",
    ikon: "⚽",
    kategori: "Permainan Invasi",
    pos: [-12, 0, -10] as [number, number, number],
    materi:
      "Menendang, menggiring, dan mengoper bola merupakan gerak dasar manipulatif dalam permainan invasi seperti sepak bola. Gunakan kaki bagian dalam agar arah operan lebih akurat kepada teman satu tim serta selalu jaga sportivitas di lapangan.",
  },
  {
    id: "obj-ring-basket",
    nama: "Ring & Bola Basket",
    ikon: "🏀",
    kategori: "Koordinasi Tangan & Mata",
    pos: [12, 0, -10] as [number, number, number],
    materi:
      "Memantulkan bola ke lantai (dribbling), melempar (passing), dan menembak ke arah ring (shooting) melatih kelincahan serta koordinasi mata dan tangan. Tekuk sedikit lutut saat memantulkan bola agar keseimbangan tubuh tetap terjaga.",
  },
  {
    id: "obj-net-voli",
    nama: "Net & Bola Voli",
    ikon: "🏐",
    kategori: "Permainan Net",
    pos: [-14, 0, 6] as [number, number, number],
    materi:
      "Dalam permainan net seperti bola voli dan bulu tangkis, pemain memukul bola melewati atas jaring (net) tanpa menyentuhnya. Passing bawah dilakukan dengan merapatkan kedua lengan lurus ke depan untuk memantulkan bola ke atas.",
  },
  {
    id: "obj-lintasan-lari",
    nama: "Lintasan & Cone Lari",
    ikon: "🏃",
    kategori: "Atletik & Gerak Lokomotor",
    pos: [14, 0, 6] as [number, number, number],
    materi:
      "Berjalan, berlari, dan melompat adalah gerak dasar lokomotor yang memindahkan tubuh dari satu tempat ke tempat lain. Saat berlari cepat, ayunkan lengan secara bergantian di samping badan dan condongkan tubuh sedikit ke depan.",
  },
  {
    id: "obj-matras-senam",
    nama: "Matras & Simpai Senam",
    ikon: "🤸",
    kategori: "Senam Lantai & Keseimbangan",
    pos: [-10, 0, 20] as [number, number, number],
    materi:
      "Senam lantai menggunakan matras empuk untuk menjaga keselamatan tubuh saat melakukan gerak keseimbangan, bertumpu, dan berguling. Selalu lakukan pemanasan peregangan otot leher, bahu, dan pinggang sebelum berlatih di atas matras.",
  },
  {
    id: "obj-pos-sehat",
    nama: "Pos P3K & Air Mineral",
    ikon: "🩺",
    kategori: "Perilaku Hidup Sehat",
    pos: [10, 0, 20] as [number, number, number],
    materi:
      "Tubuh membutuhkan cairan yang cukup sebelum, selama, dan setelah berolahraga agar tidak mengalami dehidrasi. Selain minum air putih, istirahat cukup dan menjaga kebersihan pakaian olahraga membuat tubuh tetap bugar dan sehat.",
  },
];

// =========================================================================
// ARENA JEMBATAN JUARA: 20 LEVEL KESULITAN BERTINGKAT & LINTASAN SUPER PANJANG
// =========================================================================
const TOTAL_BRIDGE_LEVELS = 20;
const BRIDGE_START_LINE_Z = 22.8;

const BRIDGE_SEGMENTS = [
  { id: "start", minX: -9, maxX: 9, minZ: 22, maxZ: 32, y: 0.4, color: "#10b981", level: 1, title: "START 35 PEMAIN" },
  { id: "lv1", minX: -7, maxX: 7, minZ: 8, maxZ: 22, y: 0.4, color: "#34d399", level: 1, title: "Lv.1 Lompat Dasar" },
  { id: "lv2", minX: -7, maxX: 7, minZ: -6, maxZ: 8, y: 0.4, color: "#2dd4bf", level: 2, title: "Lv.2 Lompat Ganda" },
  { id: "lv3-l", minX: -7.5, maxX: -1.5, minZ: -20, maxZ: -6, y: 0.4, color: "#38bdf8", level: 3, title: "Lv.3 Jalur Kembar" },
  { id: "lv3-r", minX: 1.5, maxX: 7.5, minZ: -20, maxZ: -6, y: 0.4, color: "#38bdf8", level: 3 },
  { id: "lv4-a", minX: -7.5, maxX: 7.5, minZ: -26, maxZ: -20, y: 0.4, color: "#facc15", level: 4, title: "Lv.4 Pos 1 & Celah" },
  { id: "lv4-b", minX: -6.5, maxX: 6.5, minZ: -38, maxZ: -28.2, y: 0.4, color: "#60a5fa", level: 4 },
  { id: "lv5", minX: -6.5, maxX: 6.5, minZ: -54, maxZ: -38, y: 0.4, color: "#818cf8", level: 5, title: "Lv.5 Pintu Geser" },
  { id: "lv6-l", minX: -7.5, maxX: -3.5, minZ: -68, maxZ: -54, y: 0.4, color: "#a78bfa", level: 6, title: "Lv.6 Tiga Lintasan" },
  { id: "lv6-m", minX: -2.0, maxX: 2.0, minZ: -68, maxZ: -54, y: 0.4, color: "#a78bfa", level: 6 },
  { id: "lv6-r", minX: 3.5, maxX: 7.5, minZ: -68, maxZ: -54, y: 0.4, color: "#a78bfa", level: 6 },
  { id: "lv7", minX: -7, maxX: 7, minZ: -84, maxZ: -68, y: 0.4, color: "#c084fc", level: 7, title: "Lv.7 Kipas Pemutar" },
  { id: "lv8-a", minX: -7.5, maxX: 7.5, minZ: -90, maxZ: -84, y: 0.4, color: "#facc15", level: 8, title: "Lv.8 Pos 2 & Lompat Celah" },
  { id: "lv8-b", minX: -6, maxX: 6, minZ: -98, maxZ: -92.3, y: 0.4, color: "#e879f9", level: 8 },
  { id: "lv8-c", minX: -6, maxX: 6, minZ: -106, maxZ: -100.3, y: 0.4, color: "#e879f9", level: 8 },
  { id: "lv9-a", minX: -7.5, maxX: -0.5, minZ: -116, maxZ: -106, y: 0.4, color: "#f472b6", level: 9, title: "Lv.9 Zig-Zag Lebar" },
  { id: "lv9-b", minX: 0.5, maxX: 7.5, minZ: -126, maxZ: -115.5, y: 0.4, color: "#f472b6", level: 9 },
  { id: "lv10", minX: -6.5, maxX: 6.5, minZ: -144, maxZ: -126, y: 0.4, color: "#fb7185", level: 10, title: "Lv.10 Gerbang Beruntun" },
  { id: "lv11-1", minX: -8, maxX: -4.8, minZ: -160, maxZ: -144, y: 0.4, color: "#f43f5e", level: 11, title: "Lv.11 Empat Jalur" },
  { id: "lv11-2", minX: -3.4, maxX: -0.4, minZ: -160, maxZ: -144, y: 0.4, color: "#f43f5e", level: 11 },
  { id: "lv11-3", minX: 0.4, maxX: 3.4, minZ: -160, maxZ: -144, y: 0.4, color: "#f43f5e", level: 11 },
  { id: "lv11-4", minX: 4.8, maxX: 8, minZ: -160, maxZ: -144, y: 0.4, color: "#f43f5e", level: 11 },
  { id: "lv12-a", minX: -7.5, maxX: 7.5, minZ: -166, maxZ: -160, y: 0.4, color: "#facc15", level: 12, title: "Lv.12 Pos 3 & Rintangan Tinggi" },
  { id: "lv12-b", minX: -6, maxX: 6, minZ: -182, maxZ: -168.4, y: 0.4, color: "#fb923c", level: 12 },
  { id: "lv13", minX: -7, maxX: 7, minZ: -202, maxZ: -182, y: 0.4, color: "#f97316", level: 13, title: "Lv.13 Badai Kipas" },
  { id: "lv14-a", minX: -7.5, maxX: -2.5, minZ: -210, maxZ: -202, y: 0.4, color: "#ea580c", level: 14, title: "Lv.14 Zig-Zag Cepat" },
  { id: "lv14-b", minX: -2.2, maxX: 2.2, minZ: -218, maxZ: -209.5, y: 0.4, color: "#ea580c", level: 14 },
  { id: "lv14-c", minX: 2.5, maxX: 7.5, minZ: -226, maxZ: -217.5, y: 0.4, color: "#ea580c", level: 14 },
  { id: "lv15-a", minX: -7.5, maxX: 7.5, minZ: -232, maxZ: -226, y: 0.4, color: "#facc15", level: 15, title: "Lv.15 Pos 4 & Gerbang Cepat" },
  { id: "lv15-b", minX: -6, maxX: 6, minZ: -252, maxZ: -232, y: 0.4, color: "#ef4444", level: 15 },
  { id: "lv16-a", minX: -5.5, maxX: 5.5, minZ: -260, maxZ: -254.5, y: 0.4, color: "#dc2626", level: 16, title: "Lv.16 Lompat 4 Pulau" },
  { id: "lv16-b", minX: -5.0, maxX: 5.0, minZ: -268, maxZ: -262.5, y: 0.4, color: "#dc2626", level: 16 },
  { id: "lv16-c", minX: -4.5, maxX: 4.5, minZ: -276, maxZ: -270.5, y: 0.4, color: "#dc2626", level: 16 },
  { id: "lv17-a", minX: -7.5, maxX: 7.5, minZ: -282, maxZ: -276, y: 0.4, color: "#facc15", level: 17, title: "Lv.17 Pos 5 & Jembatan Tipis" },
  { id: "lv17-b", minX: -6.8, maxX: -4.2, minZ: -306, maxZ: -282, y: 0.4, color: "#b91c1c", level: 17 },
  { id: "lv17-c", minX: -1.3, maxX: 1.3, minZ: -306, maxZ: -282, y: 0.4, color: "#b91c1c", level: 17 },
  { id: "lv17-d", minX: 4.2, maxX: 6.8, minZ: -306, maxZ: -282, y: 0.4, color: "#b91c1c", level: 17 },
  { id: "lv18", minX: -6.5, maxX: 6.5, minZ: -334, maxZ: -306, y: 0.4, color: "#991b1b", level: 18, title: "Lv.18 Benteng Kipas Ganda" },
  { id: "lv19-a", minX: -7.5, maxX: 7.5, minZ: -340, maxZ: -334, y: 0.4, color: "#facc15", level: 19, title: "Lv.19 Pos 6 & Gerbang Kilat" },
  { id: "lv19-b", minX: -5.5, maxX: 5.5, minZ: -372, maxZ: -340, y: 0.4, color: "#7f1d1d", level: 19 },
  { id: "lv20-a", minX: -4.8, maxX: 4.8, minZ: -386, maxZ: -374.7, y: 0.4, color: "#450a0a", level: 20, title: "Lv.20 Ujian Akhir Juara!" },
  { id: "lv20-b", minX: -4.2, maxX: 4.2, minZ: -398, maxZ: -388.8, y: 0.4, color: "#450a0a", level: 20 },
  { id: "finish", minX: -9, maxX: 9, minZ: -416, maxZ: -400.8, y: 0.4, color: "#f59e0b", level: 20, title: "FINISH 20 LEVEL" },
];

const BRIDGE_HURDLES = [
  { z: 15, minX: -6.8, maxX: 6.8, height: 1.25 },
  { z: 3, minX: -6.8, maxX: 6.8, height: 1.3 },
  { z: -2, minX: -6.8, maxX: 6.8, height: 1.35 },
  { z: -175, minX: -5.8, maxX: 5.8, height: 1.45 },
  { z: -292, minX: -6.7, maxX: -4.3, height: 1.45 },
  { z: -292, minX: -1.2, maxX: 1.2, height: 1.45 },
  { z: -292, minX: 4.3, maxX: 6.7, height: 1.45 },
  { z: -380, minX: -4.6, maxX: 4.6, height: 1.5 },
  { z: -393, minX: -4.0, maxX: 4.0, height: 1.55 },
];

const BRIDGE_GATES = [
  { id: "g1", z: -43, speed: 2.2, range: 4.5, width: 3.4, phase: 0 },
  { id: "g2", z: -49, speed: 2.3, range: 4.5, width: 3.4, phase: Math.PI },
  { id: "g3", z: -131, speed: 2.9, range: 4.5, width: 3.7, phase: 0.5 },
  { id: "g4", z: -138, speed: 2.9, range: 4.5, width: 3.7, phase: 3.6 },
  { id: "g5", z: -237, speed: 3.5, range: 4.2, width: 3.6, phase: 0 },
  { id: "g6", z: -242, speed: 3.5, range: 4.2, width: 3.6, phase: Math.PI },
  { id: "g7", z: -247, speed: 3.7, range: 4.2, width: 3.6, phase: 1.5 },
  { id: "g8", z: -346, speed: 4.2, range: 3.8, width: 3.5, phase: 0 },
  { id: "g9", z: -352, speed: 4.4, range: 3.8, width: 3.5, phase: 2.1 },
  { id: "g10", z: -358, speed: 4.5, range: 3.8, width: 3.6, phase: 4.2 },
  { id: "g11", z: -365, speed: 4.7, range: 3.8, width: 3.6, phase: 1.0 },
];

const BRIDGE_SPINNERS = [
  { id: "s1", x: -3.5, z: -76, radius: 3.2, speed: 2.3 },
  { id: "s2", x: 3.5, z: -76, radius: 3.2, speed: -2.3 },
  { id: "s3", x: -3.8, z: -192, radius: 3.1, speed: 2.9 },
  { id: "s4", x: 0, z: -192, radius: 2.6, speed: -3.1 },
  { id: "s5", x: 3.8, z: -192, radius: 3.1, speed: 2.9 },
  { id: "s6", x: -3.3, z: -313, radius: 3.1, speed: 3.6 },
  { id: "s7", x: 3.3, z: -313, radius: 3.1, speed: -3.6 },
  { id: "s8", x: 0, z: -320, radius: 3.8, speed: 3.9 },
  { id: "s9", x: -3.3, z: -327, radius: 3.1, speed: -4.1 },
  { id: "s10", x: 3.3, z: -327, radius: 3.1, speed: 4.1 },
];

interface PodiumEntry {
  rank: 1 | 2 | 3;
  name: string;
  detail: string;
  isSelf?: boolean;
}

interface PodiumModalState {
  title: string;
  subtitle: string;
  winners: PodiumEntry[];
  bonusXp: number;
}

interface CameraOrbitState {
  yaw: number;
  pitch: number;
  zoom: number;
}

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function prioritizeQuestionsByLevel<T>(items: T[], level: number): T[] {
  if (items.length <= 1) return [...items];
  const chunkSize = Math.max(1, Math.ceil(items.length / 5));
  const startIdx = ((level - 1) * chunkSize) % items.length;
  const prioritized = [...items.slice(startIdx), ...items.slice(0, startIdx)];
  const head = prioritized.slice(0, Math.min(chunkSize * 2, prioritized.length));
  const tail = prioritized.slice(Math.min(chunkSize * 2, prioritized.length));
  return [...shuffleArray(head), ...shuffleArray(tail)];
}

function getStandingTileLabel(pos?: [number, number, number]) {
  if (!pos) return null;
  for (const tile of ARENA_TILES) {
    if (Math.abs(pos[0] - tile.pos[0]) < 3.9 && Math.abs(pos[2] - tile.pos[2]) < 3.9) {
      return tile;
    }
  }
  return null;
}

function CheerfulBGM({ muted }: { muted: boolean }) {
  useEffect(() => {
    if (muted) return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const melody = [
      523.25, 659.25, 783.99, 659.25, 880.0, 783.99, 659.25, 587.33,
      523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 659.25,
    ];
    let step = 0;

    const interval = setInterval(() => {
      if (ctx.state === "suspended") ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(melody[step % melody.length], ctx.currentTime);

      gain.gain.setValueAtTime(0.025, ctx.currentTime);
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

function VoxelCharacter({
  shirtColor,
  pantsColor = "#1e293b",
  skinColor = "#fcd34d",
  headStyle = "boy",
  isMoving,
  isCoach = false,
  isGhost = false,
}: {
  shirtColor: string;
  pantsColor?: string;
  skinColor?: string;
  headStyle?: string;
  isMoving: boolean;
  isCoach?: boolean;
  isGhost?: boolean;
}) {
  const leftLeg = useRef<THREE.Mesh>(null);
  const rightLeg = useRef<THREE.Mesh>(null);
  const leftArm = useRef<THREE.Mesh>(null);
  const rightArm = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * 10;
    const swing = isMoving ? Math.sin(t) * 0.6 : 0;

    if (leftLeg.current) leftLeg.current.rotation.x = swing;
    if (rightLeg.current) rightLeg.current.rotation.x = -swing;
    if (leftArm.current) leftArm.current.rotation.x = -swing;
    if (rightArm.current) rightArm.current.rotation.x = swing;
  });

  const opacity = isGhost ? 0.35 : 1;

  return (
    <group>
      <mesh ref={leftLeg} position={[-0.25, 0.45, 0]} castShadow={!isGhost}>
        <boxGeometry args={[0.38, 0.9, 0.42]} />
        <meshStandardMaterial color={pantsColor} transparent={isGhost} opacity={opacity} />
      </mesh>
      <mesh ref={rightLeg} position={[0.25, 0.45, 0]} castShadow={!isGhost}>
        <boxGeometry args={[0.38, 0.9, 0.42]} />
        <meshStandardMaterial color={pantsColor} transparent={isGhost} opacity={opacity} />
      </mesh>
      <mesh position={[0, 1.4, 0]} castShadow={!isGhost}>
        <boxGeometry args={[0.95, 1.05, 0.55]} />
        <meshStandardMaterial color={shirtColor} transparent={isGhost} opacity={opacity} />
      </mesh>
      {isCoach && (
        <mesh position={[0, 1.65, 0.3]} castShadow>
          <boxGeometry args={[0.22, 0.25, 0.15]} />
          <meshStandardMaterial color="#facc15" metalness={0.6} roughness={0.2} />
        </mesh>
      )}
      <mesh ref={leftArm} position={[-0.68, 1.4, 0]} castShadow={!isGhost}>
        <boxGeometry args={[0.32, 0.95, 0.38]} />
        <meshStandardMaterial color={skinColor} transparent={isGhost} opacity={opacity} />
      </mesh>
      <mesh ref={rightArm} position={[0.68, 1.4, 0]} castShadow={!isGhost}>
        <boxGeometry args={[0.32, 0.95, 0.38]} />
        <meshStandardMaterial color={skinColor} transparent={isGhost} opacity={opacity} />
      </mesh>
      <mesh position={[0, 2.38, 0]} castShadow={!isGhost}>
        <boxGeometry args={[0.85, 0.85, 0.85]} />
        <meshStandardMaterial color={skinColor} transparent={isGhost} opacity={opacity} />
      </mesh>
      <mesh position={[-0.2, 2.42, 0.44]}>
        <boxGeometry args={[0.12, 0.12, 0.05]} />
        <meshStandardMaterial color="#1e293b" transparent={isGhost} opacity={opacity} />
      </mesh>
      <mesh position={[0.2, 2.42, 0.44]}>
        <boxGeometry args={[0.12, 0.12, 0.05]} />
        <meshStandardMaterial color="#1e293b" transparent={isGhost} opacity={opacity} />
      </mesh>

      {!isCoach && headStyle === "boy" && (
        <mesh position={[0, 2.83, -0.02]}>
          <boxGeometry args={[0.88, 0.22, 0.88]} />
          <meshStandardMaterial color="#1e293b" transparent={isGhost} opacity={opacity} />
        </mesh>
      )}

      {!isCoach && headStyle === "girl" && (
        <group>
          <mesh position={[0, 2.83, -0.02]}>
            <boxGeometry args={[0.88, 0.24, 0.88]} />
            <meshStandardMaterial color="#451a03" transparent={isGhost} opacity={opacity} />
          </mesh>
          <mesh position={[0, 2.55, -0.55]}>
            <boxGeometry args={[0.35, 0.55, 0.3]} />
            <meshStandardMaterial color="#451a03" transparent={isGhost} opacity={opacity} />
          </mesh>
        </group>
      )}

      {!isCoach && headStyle === "hijab" && (
        <group>
          <mesh position={[0, 2.42, -0.06]}>
            <boxGeometry args={[0.94, 0.94, 0.86]} />
            <meshStandardMaterial color="#f8fafc" transparent={isGhost} opacity={opacity} />
          </mesh>
          <mesh position={[0, 1.92, 0]}>
            <boxGeometry args={[0.98, 0.25, 0.65]} />
            <meshStandardMaterial color="#f8fafc" transparent={isGhost} opacity={opacity} />
          </mesh>
        </group>
      )}

      {!isCoach && headStyle === "cap" && (
        <group position={[0, 2.84, 0]}>
          <mesh>
            <boxGeometry args={[0.9, 0.22, 0.9]} />
            <meshStandardMaterial color={shirtColor} transparent={isGhost} opacity={opacity} />
          </mesh>
          <mesh position={[0, -0.05, 0.35]}>
            <boxGeometry args={[0.86, 0.08, 0.45]} />
            <meshStandardMaterial color="#0f172a" transparent={isGhost} opacity={opacity} />
          </mesh>
        </group>
      )}

      {!isCoach && headStyle === "bandana" && (
        <group>
          <mesh position={[0, 2.83, -0.02]}>
            <boxGeometry args={[0.88, 0.22, 0.88]} />
            <meshStandardMaterial color="#1e293b" transparent={isGhost} opacity={opacity} />
          </mesh>
          <mesh position={[0, 2.66, 0]}>
            <boxGeometry args={[0.9, 0.14, 0.9]} />
            <meshStandardMaterial color="#ffffff" transparent={isGhost} opacity={opacity} />
          </mesh>
        </group>
      )}

      {!isCoach && headStyle === "glasses" && (
        <group>
          <mesh position={[0, 2.83, -0.02]}>
            <boxGeometry args={[0.88, 0.22, 0.88]} />
            <meshStandardMaterial color="#1e293b" transparent={isGhost} opacity={opacity} />
          </mesh>
          <mesh position={[0, 2.42, 0.45]}>
            <boxGeometry args={[0.78, 0.18, 0.06]} />
            <meshStandardMaterial color="#0f172a" transparent={isGhost} opacity={opacity} />
          </mesh>
        </group>
      )}

      {!isCoach && headStyle === "crown" && (
        <group>
          <mesh position={[0, 2.83, -0.02]}>
            <boxGeometry args={[0.88, 0.2, 0.88]} />
            <meshStandardMaterial color="#1e293b" transparent={isGhost} opacity={opacity} />
          </mesh>
          <mesh position={[0, 3.05, 0]}>
            <cylinderGeometry args={[0.32, 0.36, 0.26, 8]} />
            <meshStandardMaterial color="#facc15" metalness={0.7} roughness={0.2} transparent={isGhost} opacity={opacity} />
          </mesh>
        </group>
      )}

      {isCoach && (
        <group position={[0, 2.85, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.9, 0.25, 0.9]} />
            <meshStandardMaterial color="#1e3a8a" />
          </mesh>
          <mesh position={[0, -0.05, 0.35]} castShadow>
            <boxGeometry args={[0.88, 0.1, 0.5]} />
            <meshStandardMaterial color="#1d4ed8" />
          </mesh>
        </group>
      )}
    </group>
  );
}

function RemotePlayer({ data, isHighlighted = false }: { data: any; isHighlighted?: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const preset = AVATAR_35_LIST.find((a) => a.id === data.avatarType);
  const remoteCharLevel = data.characterLevel || getCharacterLevelFromXp(data.score || 0);

  useFrame((_, delta) => {
    if (!groupRef.current || !data.pos) return;
    groupRef.current.position.lerp(
      new THREE.Vector3(data.pos[0], data.pos[1], data.pos[2]),
      delta * 12
    );
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      data.rotY || 0,
      delta * 12
    );
  });

  return (
    <group ref={groupRef} position={data.pos || [0, 0, 5]}>
      <VoxelCharacter
        shirtColor={preset?.shirtColor || data.color || "#3b82f6"}
        pantsColor={preset?.pantsColor || "#1e293b"}
        skinColor={preset?.skinColor || "#fcd34d"}
        headStyle={preset?.headStyle || "boy"}
        isMoving={data.isMoving || false}
        isGhost={Boolean(data.isEliminated)}
      />
      {isHighlighted && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
          <ringGeometry args={[0.9, 1.35, 32]} />
          <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.7} />
        </mesh>
      )}
      <Text
        position={[0, 3.25, 0]}
        fontSize={isHighlighted ? 0.55 : 0.4}
        color={data.isEliminated ? "#94a3b8" : isHighlighted ? "#facc15" : "#38bdf8"}
        outlineWidth={0.05}
        outlineColor="black"
      >
        {`${data.isEliminated ? "👻 " : ""}${data.name || "Teman"} • Lv.${remoteCharLevel}`}
      </Text>
    </group>
  );
}

function ArenaFloorTile({
  tile,
  isFallen,
}: {
  tile: (typeof ARENA_TILES)[0];
  isFallen: boolean;
}) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const targetY = isFallen ? -12 : 0.15;
    meshRef.current.position.y = THREE.MathUtils.lerp(
      meshRef.current.position.y,
      targetY,
      delta * 5
    );
  });

  return (
    <group ref={meshRef} position={[tile.pos[0], 0.15, tile.pos[2]]}>
      <mesh receiveShadow castShadow>
        <boxGeometry args={[7.8, 0.3, 7.8]} />
        <meshStandardMaterial color={tile.color} />
      </mesh>
      <Text
        position={[0, 0.18, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={2.8}
        color="white"
        outlineWidth={0.12}
        outlineColor="black"
      >
        {tile.label}
      </Text>
    </group>
  );
}

function SpectatorCameraController({
  preset,
  followedPlayer,
  cameraOrbitRef,
}: {
  preset: "overview" | "arena";
  followedPlayer: any | null;
  cameraOrbitRef: React.MutableRefObject<CameraOrbitState>;
}) {
  const targetFocus = useRef(new THREE.Vector3(0, 1, 2));
  const manualOffset = useRef(new THREE.Vector3(0, 0, 0));
  const keys = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const down = (e: KeyboardEvent) => (keys.current[e.key.toLowerCase()] = true);
    const up = (e: KeyboardEvent) => (keys.current[e.key.toLowerCase()] = false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    manualOffset.current.set(0, 0, 0);
  }, [preset, followedPlayer?.id]);

  useFrame((state, delta) => {
    const moveSpeed = 16 * delta;
    if (keys.current["w"] || keys.current["arrowup"]) manualOffset.current.z -= moveSpeed;
    if (keys.current["s"] || keys.current["arrowdown"]) manualOffset.current.z += moveSpeed;
    if (keys.current["a"] || keys.current["arrowleft"]) manualOffset.current.x -= moveSpeed;
    if (keys.current["d"] || keys.current["arrowright"]) manualOffset.current.x += moveSpeed;
    if (keys.current["q"]) cameraOrbitRef.current.yaw -= 1.8 * delta;
    if (keys.current["e"]) cameraOrbitRef.current.yaw += 1.8 * delta;

    const orbit = cameraOrbitRef.current;
    let desiredFocus = new THREE.Vector3(0, 1, 2);
    let baseRadius = 42;

    if (followedPlayer && followedPlayer.pos) {
      const [px, py, pz] = followedPlayer.pos;
      desiredFocus.set(px, Math.max(py, 0) + 1.5, pz);
      baseRadius = 26;
    } else if (preset === "arena") {
      desiredFocus.set(0, 1, 18);
      baseRadius = 40;
    } else {
      desiredFocus.set(0, 1, -2);
      baseRadius = 46;
    }

    desiredFocus.add(manualOffset.current);

    const radius = baseRadius * orbit.zoom;
    const horizDist = radius * Math.cos(orbit.pitch);
    const camX = desiredFocus.x + Math.sin(orbit.yaw) * horizDist;
    const camY = desiredFocus.y + Math.sin(orbit.pitch) * radius;
    const camZ = desiredFocus.z + Math.cos(orbit.yaw) * horizDist;

    state.camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.1);
    targetFocus.current.lerp(desiredFocus, 0.1);
    state.camera.lookAt(targetFocus.current);
  });

  return null;
}

function Player({
  playerName,
  avatarPreset,
  characterLevel,
  questionLevel,
  score,
  correctCount,
  readExploreCount,
  completedSchoolCount,
  isEliminated,
  bridgeRaceStarted,
  worldMap,
  socketRef,
  joyVector,
  jumpTrigger,
  teleportTrigger,
  cameraOrbitRef,
  onInteractBuilding,
  onNearCoach,
  onNearPakLukman,
  onNearSchoolDoor,
  onNearPortal,
  onNearAdventurePortal,
  onNearExplorePortal,
  onNearBridgePortal,
  onNearReturnPortal,
  onNearExploreObject,
  onNearClassroom,
  onBridgeLevelChange,
  onBridgeFall,
  onBridgeFinish,
  onStandingTileChange,
  gedungList,
  isTileFallen,
  isMiniGame,
}: any) {
  const groupRef = useRef<THREE.Group>(null);
  const keys = useRef<{ [key: string]: boolean }>({});
  const velocityY = useRef(0);
  const isGrounded = useRef(true);
  const [moving, setMoving] = useState(false);
  const lastEmitTime = useRef(0);
  const bridgeCheckpointRef = useRef<[number, number, number]>([0, 0.5, 27]);
  const highestBridgeLevelRef = useRef<number>(1);
  const bridgeFinishedRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;
      if (e.code === "Space" && isGrounded.current) {
        velocityY.current = 9.8;
        isGrounded.current = false;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => (keys.current[e.key.toLowerCase()] = false);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (jumpTrigger > 0 && isGrounded.current) {
      velocityY.current = 9.8;
      isGrounded.current = false;
    }
  }, [jumpTrigger]);

  useEffect(() => {
    if (teleportTrigger && groupRef.current) {
      groupRef.current.position.set(
        teleportTrigger.pos[0],
        teleportTrigger.pos[1],
        teleportTrigger.pos[2]
      );
      velocityY.current = 0;
      isGrounded.current = true;
      if (worldMap === "bridge") {
        bridgeCheckpointRef.current = [teleportTrigger.pos[0], 0.5, teleportTrigger.pos[2]];
        highestBridgeLevelRef.current = 1;
        bridgeFinishedRef.current = false;
      }
    }
  }, [teleportTrigger, worldMap]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const speed = 10.5;

    // Putar kamera dengan tombol Q / E di keyboard
    if (keys.current["q"]) cameraOrbitRef.current.yaw -= 1.8 * delta;
    if (keys.current["e"]) cameraOrbitRef.current.yaw += 1.8 * delta;

    let rawX = joyVector.x;
    let rawZ = joyVector.y;

    if (keys.current["w"] || keys.current["arrowup"]) rawZ -= 1;
    if (keys.current["s"] || keys.current["arrowdown"]) rawZ += 1;
    if (keys.current["a"] || keys.current["arrowleft"]) rawX -= 1;
    if (keys.current["d"] || keys.current["arrowright"]) rawX += 1;

    // Gerakan karakter mengikuti sudut putaran kamera aktif agar selalu intuitif
    const yaw = cameraOrbitRef.current.yaw;
    const moveX = rawX * Math.cos(yaw) + rawZ * Math.sin(yaw);
    const moveZ = -rawX * Math.sin(yaw) + rawZ * Math.cos(yaw);

    const length = Math.hypot(moveX, moveZ);
    const isCurrentlyMoving = length > 0.05;
    if (isCurrentlyMoving !== moving) setMoving(isCurrentlyMoving);

    if (isCurrentlyMoving) {
      const normX = moveX / Math.max(length, 1);
      const normZ = moveZ / Math.max(length, 1);

      groupRef.current.position.x += normX * speed * delta;
      groupRef.current.position.z += normZ * speed * delta;

      const targetAngle = Math.atan2(normX, normZ);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetAngle,
        0.2
      );
    }

    const pos = groupRef.current.position;
    const t = state.clock.getElapsedTime();

    if (worldMap === "bridge") {
      onStandingTileChange(null);
      onNearCoach(false);
      onNearPakLukman(false);
      onNearSchoolDoor(false);
      onNearPortal(false);
      onNearAdventurePortal(false);
      onNearExplorePortal(false);
      onNearBridgePortal(false);
      onNearExploreObject(null);
      onNearClassroom(null);
      onInteractBuilding(null);

      if (!bridgeRaceStarted && pos.z < BRIDGE_START_LINE_Z) {
        pos.z = BRIDGE_START_LINE_Z;
      }

      const onSegment = BRIDGE_SEGMENTS.find(
        (seg) =>
          pos.x >= seg.minX - 0.35 &&
          pos.x <= seg.maxX + 0.35 &&
          pos.z >= seg.minZ - 0.35 &&
          pos.z <= seg.maxZ + 0.35
      );

      let bridgeFloor = onSegment ? onSegment.y : -9;

      if (onSegment) {
        for (const hurdle of BRIDGE_HURDLES) {
          if (
            Math.abs(pos.z - hurdle.z) < 0.72 &&
            pos.x >= hurdle.minX &&
            pos.x <= hurdle.maxX
          ) {
            bridgeFloor = hurdle.height;
            break;
          }
        }
      }

      if (!isGrounded.current || pos.y > bridgeFloor) {
        pos.y += velocityY.current * delta;
        velocityY.current -= 24 * delta;
        if (pos.y <= bridgeFloor) {
          pos.y = bridgeFloor;
          velocityY.current = 0;
          isGrounded.current = true;
        }
      } else {
        pos.y = bridgeFloor;
      }

      for (const gate of BRIDGE_GATES) {
        if (Math.abs(pos.z - gate.z) < 0.85 && pos.y < 2.2) {
          const gateX = Math.sin(t * gate.speed + gate.phase) * gate.range;
          if (Math.abs(pos.x - gateX) < gate.width / 2 + 0.35) {
            pos.z += 2.6;
          }
        }
      }

      for (const sp of BRIDGE_SPINNERS) {
        if (Math.abs(pos.z - sp.z) < sp.radius + 0.45 && pos.y < 1.6) {
          const angle = t * sp.speed;
          const barDirX = Math.cos(angle);
          const barDirZ = Math.sin(angle);
          const relX = pos.x - sp.x;
          const relZ = pos.z - sp.z;
          const perpDist = Math.abs(relX * barDirZ - relZ * barDirX);
          const alongDist = Math.abs(relX * barDirX + relZ * barDirZ);
          if (perpDist < 0.55 && alongDist < sp.radius) {
            pos.x += (relX >= 0 ? 1 : -1) * 16 * delta;
            pos.z += 7 * delta;
          }
        }
      }

      if (onSegment) {
        onBridgeLevelChange(onSegment.level);
        if (onSegment.level > highestBridgeLevelRef.current) {
          highestBridgeLevelRef.current = onSegment.level;
          const safeX = THREE.MathUtils.clamp(
            (onSegment.minX + onSegment.maxX) / 2,
            -4,
            4
          );
          const safeZ = onSegment.maxZ - 1.5;
          bridgeCheckpointRef.current = [safeX, 0.5, safeZ];
        }
        if (onSegment.id === "finish" && !bridgeFinishedRef.current && bridgeRaceStarted) {
          bridgeFinishedRef.current = true;
          onBridgeFinish();
        }
      }

      if (pos.y < -3.5) {
        const [cx, cy, cz] = bridgeCheckpointRef.current;
        pos.set(cx, cy, cz);
        velocityY.current = 0;
        isGrounded.current = true;
        onBridgeFall(highestBridgeLevelRef.current);
      }

      const distReturnBridge = new THREE.Vector2(pos.x, pos.z).distanceTo(new THREE.Vector2(0, 30.5));
      onNearReturnPortal(distReturnBridge < 3.5);
    } else if (worldMap === "school") {
      onStandingTileChange(null);
      onNearCoach(false);
      onNearPakLukman(false);
      onNearSchoolDoor(false);
      onNearPortal(false);
      onNearAdventurePortal(false);
      onNearExplorePortal(false);
      onNearBridgePortal(false);
      onNearExploreObject(null);
      onInteractBuilding(null);

      if (!isGrounded.current || pos.y > 0) {
        pos.y += velocityY.current * delta;
        velocityY.current -= 24 * delta;
        if (pos.y <= 0) {
          pos.y = 0;
          velocityY.current = 0;
          isGrounded.current = true;
        }
      }

      pos.x = THREE.MathUtils.clamp(pos.x, -11.5, 11.5);
      pos.z = THREE.MathUtils.clamp(pos.z, -21, 21);

      const distExitSchool = new THREE.Vector2(pos.x, pos.z).distanceTo(new THREE.Vector2(0, 19.5));
      onNearReturnPortal(distExitSchool < 3.6);

      let foundClass: SchoolClassroomMission | null = null;
      for (const cls of SCHOOL_CLASSROOMS) {
        const distCls = new THREE.Vector2(pos.x, pos.z).distanceTo(
          new THREE.Vector2(cls.pos[0], cls.pos[2])
        );
        if (distCls < 4.2) {
          foundClass = cls;
          break;
        }
      }
      onNearClassroom(foundClass);
    } else {
      let currentTileId: number | null = null;
      if (worldMap === "stadium") {
        for (const tile of ARENA_TILES) {
          if (Math.abs(pos.x - tile.pos[0]) < 3.9 && Math.abs(pos.z - tile.pos[2]) < 3.9) {
            currentTileId = tile.id;
            break;
          }
        }
      }
      onStandingTileChange(currentTileId);

      const standingOnFallenTile = currentTileId !== null && isTileFallen(currentTileId);
      const groundHeight = standingOnFallenTile ? -6 : currentTileId !== null ? 0.3 : 0;

      if (!isGrounded.current || pos.y > groundHeight) {
        pos.y += velocityY.current * delta;
        velocityY.current -= 24 * delta;

        if (pos.y <= groundHeight) {
          pos.y = groundHeight;
          velocityY.current = 0;
          isGrounded.current = true;
        }
      } else if (pos.y < groundHeight) {
        pos.y = groundHeight;
      }

      pos.x = THREE.MathUtils.clamp(pos.x, -42, 42);
      pos.z = THREE.MathUtils.clamp(pos.z, -42, 42);

      if (worldMap === "stadium") {
        onNearReturnPortal(false);
        onNearExploreObject(null);
        onNearClassroom(null);

        const distCoach = new THREE.Vector2(pos.x, pos.z).distanceTo(new THREE.Vector2(0, -4));
        onNearCoach(distCoach < 3.8);

        // NPC Pak Lukman (Kepala Sekolah) berdiri di depan sekolah (x = 2.8, z = -29.5)
        const distPakLukman = new THREE.Vector2(pos.x, pos.z).distanceTo(new THREE.Vector2(2.8, -29.5));
        onNearPakLukman(distPakLukman < 4.2);

        // Pintu Masuk Gedung Sekolah di bagian belakang lapangan (x = 0, z = -31.8)
        const distSchoolDoor = new THREE.Vector2(pos.x, pos.z).distanceTo(new THREE.Vector2(0, -31.8));
        onNearSchoolDoor(distSchoolDoor < 4.5);

        const distPortal = new THREE.Vector2(pos.x, pos.z).distanceTo(new THREE.Vector2(14, -4));
        onNearPortal(distPortal < 3.8);

        const distAdventure = new THREE.Vector2(pos.x, pos.z).distanceTo(new THREE.Vector2(-14, -4));
        onNearAdventurePortal(distAdventure < 3.8);

        const distExplore = new THREE.Vector2(pos.x, pos.z).distanceTo(new THREE.Vector2(0, -15));
        onNearExplorePortal(distExplore < 3.8);

        const distBridge = new THREE.Vector2(pos.x, pos.z).distanceTo(new THREE.Vector2(0, 31));
        onNearBridgePortal(distBridge < 3.8);

        let foundBuilding = null;
        for (const gedung of gedungList) {
          const distB = new THREE.Vector2(pos.x, pos.z).distanceTo(
            new THREE.Vector2(gedung.posisi_3d[0], gedung.posisi_3d[2])
          );
          if (distB < 4.5) {
            foundBuilding = gedung;
            break;
          }
        }
        onInteractBuilding(foundBuilding);
      } else {
        onNearCoach(false);
        onNearPakLukman(false);
        onNearSchoolDoor(false);
        onNearPortal(false);
        onNearAdventurePortal(false);
        onNearExplorePortal(false);
        onNearBridgePortal(false);
        onNearClassroom(null);
        onInteractBuilding(null);

        const distReturn = new THREE.Vector2(pos.x, pos.z).distanceTo(new THREE.Vector2(0, -18));
        onNearReturnPortal(distReturn < 3.8);

        let foundExploreObj = null;
        for (const obj of EXPLORE_OBJECTS) {
          const distObj = new THREE.Vector2(pos.x, pos.z).distanceTo(
            new THREE.Vector2(obj.pos[0], obj.pos[2])
          );
          if (distObj < 3.8) {
            foundExploreObj = obj;
            break;
          }
        }
        onNearExploreObject(foundExploreObj);
      }
    }

    const now = state.clock.getElapsedTime();
    if (socketRef.current && socketRef.current.connected && now - lastEmitTime.current > 0.05) {
      lastEmitTime.current = now;
      socketRef.current.emit("movePlayer", {
        pos: [pos.x, pos.y, pos.z],
        rotY: groupRef.current.rotation.y,
        isMoving: isCurrentlyMoving,
        worldMap,
        characterLevel,
        questionLevel,
        score,
        correctCount,
        readExploreCount,
        completedSchoolCount,
      });
    }

    // Kamera Dinamis yang Bisa Diputar & Di-zoom oleh Pemain
    const orbit = cameraOrbitRef.current;
    const baseDist = isMiniGame ? 34 : worldMap === "bridge" ? 27 : worldMap === "school" ? 24 : 30;
    const radius = baseDist * orbit.zoom;
    const targetY = Math.max(pos.y, 0) + 1.4;
    const horizDist = radius * Math.cos(orbit.pitch);

    const camX = pos.x + Math.sin(orbit.yaw) * horizDist;
    const camY = targetY + Math.sin(orbit.pitch) * radius;
    const camZ = pos.z + Math.cos(orbit.yaw) * horizDist;

    state.camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.14);
    state.camera.lookAt(pos.x, targetY, pos.z - 1.5);
  });

  return (
    <group ref={groupRef} position={[0, 0, 5]}>
      <VoxelCharacter
        shirtColor={avatarPreset.shirtColor}
        pantsColor={avatarPreset.pantsColor}
        skinColor={avatarPreset.skinColor}
        headStyle={avatarPreset.headStyle}
        isMoving={moving}
        isGhost={isEliminated}
      />
      <Text
        position={[0, 3.25, 0]}
        fontSize={0.4}
        color={isEliminated ? "#94a3b8" : "white"}
        outlineWidth={0.05}
        outlineColor="black"
      >
        {`${isEliminated ? "👻 (Gugur) " : ""}${playerName} • Lv.${characterLevel}`}
      </Text>
    </group>
  );
}

// =========================================================================
// KOMPONEN 3D INTERIOR GEDUNG SEKOLAH (6 RUANG KELAS: KELAS 1 - 6)
// =========================================================================
function SchoolInteriorEnvironment({
  completedClassIds,
}: {
  completedClassIds: string[];
}) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[28, 46]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[5.5, 42]} />
        <meshStandardMaterial color="#dc2626" />
      </mesh>

      <mesh position={[-13.5, 3.5, 0]} receiveShadow>
        <boxGeometry args={[0.8, 7, 46]} />
        <meshStandardMaterial color="#fef3c7" />
      </mesh>
      <mesh position={[13.5, 3.5, 0]} receiveShadow>
        <boxGeometry args={[0.8, 7, 46]} />
        <meshStandardMaterial color="#fef3c7" />
      </mesh>
      <mesh position={[0, 3.5, -22.5]} receiveShadow>
        <boxGeometry args={[28, 7, 0.8]} />
        <meshStandardMaterial color="#fde68a" />
      </mesh>

      <group position={[0, 3.8, -21.8]}>
        <mesh>
          <boxGeometry args={[14, 2.2, 0.3]} />
          <meshStandardMaterial color="#1e3a8a" />
        </mesh>
        <Text
          position={[0, 0.3, 0.25]}
          fontSize={0.62}
          color="#facc15"
          outlineWidth={0.06}
          outlineColor="black"
        >
          🏫 GEDUNG SEKOLAH PJOK (KELAS 1 - 6)
        </Text>
        <Text
          position={[0, -0.45, 0.25]}
          fontSize={0.38}
          color="#ffffff"
          outlineWidth={0.04}
          outlineColor="black"
        >
          Pilih Ruang Kelas & Selesaikan Semua Misi Bertingkat!
        </Text>
      </group>

      <group position={[0, 0, 20.5]}>
        <mesh position={[-2.1, 2.1, 0]} castShadow>
          <boxGeometry args={[0.45, 4.2, 0.45]} />
          <meshStandardMaterial color="#f97316" />
        </mesh>
        <mesh position={[2.1, 2.1, 0]} castShadow>
          <boxGeometry args={[0.45, 4.2, 0.45]} />
          <meshStandardMaterial color="#f97316" />
        </mesh>
        <mesh position={[0, 4.2, 0]} castShadow>
          <boxGeometry args={[4.6, 0.5, 0.5]} />
          <meshStandardMaterial color="#f97316" />
        </mesh>
        <mesh position={[0, 2.1, 0]}>
          <planeGeometry args={[3.8, 3.9]} />
          <meshStandardMaterial color="#fdba74" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
        <Text
          position={[0, 5.0, 0]}
          fontSize={0.55}
          color="#ffedd5"
          outlineWidth={0.07}
          outlineColor="black"
        >
          🚪 Keluar ke Lapangan Sekolah
        </Text>
      </group>

      {SCHOOL_CLASSROOMS.map((cls) => {
        const isDone = completedClassIds.includes(cls.id);
        const dirSign = cls.sisi === "kiri" ? -1 : 1;
        const rotY = cls.sisi === "kiri" ? Math.PI / 2 : -Math.PI / 2;

        return (
          <group key={cls.id} position={cls.pos}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow>
              <planeGeometry args={[4.8, 5.2]} />
              <meshStandardMaterial color={isDone ? "#86efac" : cls.warna} />
            </mesh>

            <group position={[dirSign * 4.4, 0, 0]} rotation={[0, rotY, 0]}>
              <mesh position={[0, 2.3, 0]} castShadow>
                <boxGeometry args={[4.4, 4.6, 0.45]} />
                <meshStandardMaterial color={cls.warna} />
              </mesh>
              <mesh position={[0, 1.8, 0.25]}>
                <boxGeometry args={[2.2, 3.5, 0.15]} />
                <meshStandardMaterial color="#78350f" />
              </mesh>
              <mesh position={[0, 4.95, 0.2]}>
                <boxGeometry args={[4.6, 0.85, 0.25]} />
                <meshStandardMaterial color="#0f172a" />
              </mesh>
              <Text
                position={[0, 4.95, 0.36]}
                fontSize={0.44}
                color={isDone ? "#86efac" : "#fef08a"}
                outlineWidth={0.05}
                outlineColor="black"
              >
                {`${isDone ? "✅ " : ""}${cls.namaKelas} (${cls.bintang})`}
              </Text>
              <Text
                position={[0, 3.95, 0.36]}
                fontSize={0.28}
                color="#ffffff"
                outlineWidth={0.04}
                outlineColor="black"
              >
                {cls.judulMisi}
              </Text>
            </group>
          </group>
        );
      })}
    </group>
  );
}

// =========================================================================
// KOMPONEN 3D JEMBATAN JUARA (20 LEVEL & GARIS PEMBATAS START BERSAMA)
// =========================================================================
function ChampionBridgeEnvironment({ raceStarted }: { raceStarted: boolean }) {
  const gateRefs = useRef<(THREE.Mesh | null)[]>([]);
  const spinnerRefs = useRef<(THREE.Mesh | null)[]>([]);
  const barrierRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    BRIDGE_GATES.forEach((gate, i) => {
      const mesh = gateRefs.current[i];
      if (mesh) {
        mesh.position.x = Math.sin(t * gate.speed + gate.phase) * gate.range;
      }
    });
    BRIDGE_SPINNERS.forEach((sp, i) => {
      const mesh = spinnerRefs.current[i];
      if (mesh) {
        mesh.rotation.y = t * sp.speed;
      }
    });
    if (barrierRef.current) {
      const targetY = raceStarted ? 7.5 : 0;
      barrierRef.current.position.y = THREE.MathUtils.lerp(
        barrierRef.current.position.y,
        targetY,
        delta * 6
      );
    }
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4, -195]} receiveShadow>
        <planeGeometry args={[200, 520]} />
        <meshStandardMaterial color="#0284c7" />
      </mesh>

      {BRIDGE_SEGMENTS.map((seg) => {
        const width = seg.maxX - seg.minX;
        const depth = seg.maxZ - seg.minZ;
        const centerX = (seg.minX + seg.maxX) / 2;
        const centerZ = (seg.minZ + seg.maxZ) / 2;
        return (
          <group key={seg.id}>
            <mesh position={[centerX, seg.y - 0.35, centerZ]} receiveShadow castShadow>
              <boxGeometry args={[width, 0.7, depth]} />
              <meshStandardMaterial color={seg.color} />
            </mesh>
            {seg.title && (
              <Text
                position={[0, 3.6, seg.maxZ - 1]}
                fontSize={0.78}
                color="#fef08a"
                outlineWidth={0.08}
                outlineColor="black"
              >
                {seg.title}
              </Text>
            )}
          </group>
        );
      })}

      <mesh position={[0, 0.42, 22.2]} receiveShadow>
        <boxGeometry args={[17.5, 0.05, 0.55]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      <group ref={barrierRef} position={[0, 0, 22.1]}>
        <mesh position={[-8.4, 1.8, 0]} castShadow>
          <boxGeometry args={[0.45, 3.6, 0.45]} />
          <meshStandardMaterial color="#facc15" />
        </mesh>
        <mesh position={[8.4, 1.8, 0]} castShadow>
          <boxGeometry args={[0.45, 3.6, 0.45]} />
          <meshStandardMaterial color="#facc15" />
        </mesh>
        <mesh position={[0, 1.4, 0]} castShadow>
          <boxGeometry args={[17.2, 0.55, 0.35]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
        <mesh position={[0, 2.35, 0]} castShadow>
          <boxGeometry args={[17.2, 0.45, 0.35]} />
          <meshStandardMaterial color="#facc15" />
        </mesh>
        <Text
          position={[0, 3.25, 0]}
          fontSize={0.65}
          color="#fef08a"
          outlineWidth={0.08}
          outlineColor="black"
        >
          {raceStarted ? "🚀 LOMBA DIMULAI!" : "🚦 TUNGGU START BERSAMA-SAMA"}
        </Text>
      </group>

      <group position={[0, 0.4, 31]}>
        <mesh position={[-1.6, 1.8, 0]}>
          <boxGeometry args={[0.35, 3.6, 0.35]} />
          <meshStandardMaterial color="#f97316" />
        </mesh>
        <mesh position={[1.6, 1.8, 0]}>
          <boxGeometry args={[0.35, 3.6, 0.35]} />
          <meshStandardMaterial color="#f97316" />
        </mesh>
        <mesh position={[0, 3.6, 0]}>
          <boxGeometry args={[3.6, 0.45, 0.45]} />
          <meshStandardMaterial color="#f97316" />
        </mesh>
        <Text position={[0, 4.4, 0]} fontSize={0.52} color="#ffedd5" outlineWidth={0.06} outlineColor="black">
          🏟️ Kembali ke Stadion
        </Text>
      </group>

      {BRIDGE_HURDLES.map((h, idx) => (
        <mesh
          key={idx}
          position={[(h.minX + h.maxX) / 2, h.height - 0.4, h.z]}
          castShadow
        >
          <boxGeometry args={[h.maxX - h.minX, 0.95, 1.15]} />
          <meshStandardMaterial color="#f97316" />
        </mesh>
      ))}

      {BRIDGE_GATES.map((gate, idx) => (
        <mesh
          key={gate.id}
          ref={(el) => {
            gateRefs.current[idx] = el;
          }}
          position={[0, 1.5, gate.z]}
          castShadow
        >
          <boxGeometry args={[gate.width, 2.3, 0.95]} />
          <meshStandardMaterial color="#dc2626" />
        </mesh>
      ))}

      {BRIDGE_SPINNERS.map((sp, idx) => (
        <group key={sp.id} position={[sp.x, 1.15, sp.z]}>
          <mesh>
            <cylinderGeometry args={[0.35, 0.35, 1.5, 16]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh
            ref={(el) => {
              spinnerRefs.current[idx] = el;
            }}
            position={[0, 0.25, 0]}
            castShadow
          >
            <boxGeometry args={[sp.radius * 2, 0.45, 0.45]} />
            <meshStandardMaterial color="#facc15" />
          </mesh>
        </group>
      ))}

      <group position={[0, 0.4, -410]}>
        <mesh position={[-7.5, 2.8, 0]} castShadow>
          <boxGeometry args={[0.5, 5.6, 0.5]} />
          <meshStandardMaterial color="#facc15" />
        </mesh>
        <mesh position={[7.5, 2.8, 0]} castShadow>
          <boxGeometry args={[0.5, 5.6, 0.5]} />
          <meshStandardMaterial color="#facc15" />
        </mesh>
        <mesh position={[0, 5.4, 0]} castShadow>
          <boxGeometry args={[15.5, 1.0, 0.6]} />
          <meshStandardMaterial color="#dc2626" />
        </mesh>
        <Text position={[0, 5.4, 0.35]} fontSize={0.85} color="#fef08a" outlineWidth={0.08} outlineColor="black">
          🏁 FINISH 20 LEVEL JEMBATAN JUARA 🏆
        </Text>
        <mesh position={[0, 1.6, -1.5]} castShadow>
          <cylinderGeometry args={[1.3, 0.7, 2.4, 20]} />
          <meshStandardMaterial color="#facc15" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

function ExploreWorldEnvironment({ readIds }: { readIds: string[] }) {
  const treePositions: [number, number, number][] = [
    [-26, 0, -24],
    [26, 0, -24],
    [-28, 0, 4],
    [28, 0, 4],
    [-24, 0, 28],
    [24, 0, 28],
  ];

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#4ade80" />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 4]} receiveShadow>
        <ringGeometry args={[12, 15.5, 48]} />
        <meshStandardMaterial color="#fde68a" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <planeGeometry args={[3.5, 36]} />
        <meshStandardMaterial color="#fef3c7" />
      </mesh>

      <group position={[0, 0, -18]}>
        <mesh position={[-1.6, 2, 0]} castShadow>
          <boxGeometry args={[0.4, 4, 0.4]} />
          <meshStandardMaterial color="#f97316" metalness={0.5} />
        </mesh>
        <mesh position={[1.6, 2, 0]} castShadow>
          <boxGeometry args={[0.4, 4, 0.4]} />
          <meshStandardMaterial color="#f97316" metalness={0.5} />
        </mesh>
        <mesh position={[0, 4, 0]} castShadow>
          <boxGeometry args={[3.6, 0.5, 0.5]} />
          <meshStandardMaterial color="#f97316" metalness={0.5} />
        </mesh>
        <mesh position={[0, 2, 0]}>
          <planeGeometry args={[2.8, 3.6]} />
          <meshStandardMaterial color="#fdba74" transparent opacity={0.75} side={THREE.DoubleSide} />
        </mesh>
        <Text position={[0, 4.9, 0]} fontSize={0.55} color="#ffedd5" outlineWidth={0.07} outlineColor="black">
          🏟️ Kembali ke Stadion Utama
        </Text>
      </group>

      <group position={EXPLORE_OBJECTS[0].pos}>
        <mesh position={[-1.6, 1.1, -0.8]} castShadow>
          <boxGeometry args={[0.2, 2.2, 0.2]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[1.6, 1.1, -0.8]} castShadow>
          <boxGeometry args={[0.2, 2.2, 0.2]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 2.2, -0.8]} castShadow>
          <boxGeometry args={[3.4, 0.2, 0.2]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0.55, 0.6]} castShadow>
          <sphereGeometry args={[0.55, 20, 20]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
        <Text position={[0, 3.1, 0]} fontSize={0.48} color={readIds.includes(EXPLORE_OBJECTS[0].id) ? "#86efac" : "#fef08a"} outlineWidth={0.06} outlineColor="black">
          {`${readIds.includes(EXPLORE_OBJECTS[0].id) ? "✅ " : "🔍 "}⚽ Bola & Gawang`}
        </Text>
      </group>

      <group position={EXPLORE_OBJECTS[1].pos}>
        <mesh position={[0, 2, -0.8]} castShadow>
          <boxGeometry args={[0.25, 4, 0.25]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0, 3.3, -0.55]} castShadow>
          <boxGeometry args={[2, 1.3, 0.15]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 2.9, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.45, 0.06, 12, 24]} />
          <meshStandardMaterial color="#ea580c" />
        </mesh>
        <mesh position={[0.7, 0.45, 0.7]} castShadow>
          <sphereGeometry args={[0.45, 20, 20]} />
          <meshStandardMaterial color="#f97316" />
        </mesh>
        <Text position={[0, 4.4, 0]} fontSize={0.48} color={readIds.includes(EXPLORE_OBJECTS[1].id) ? "#86efac" : "#fef08a"} outlineWidth={0.06} outlineColor="black">
          {`${readIds.includes(EXPLORE_OBJECTS[1].id) ? "✅ " : "🔍 "}🏀 Ring Basket`}
        </Text>
      </group>

      <group position={EXPLORE_OBJECTS[2].pos}>
        <mesh position={[-1.8, 1.4, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 2.8, 12]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        <mesh position={[1.8, 1.4, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 2.8, 12]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        <mesh position={[0, 2.1, 0]}>
          <boxGeometry args={[3.5, 0.9, 0.08]} />
          <meshStandardMaterial color="#e2e8f0" transparent opacity={0.85} />
        </mesh>
        <mesh position={[0, 0.45, 0.8]} castShadow>
          <sphereGeometry args={[0.45, 20, 20]} />
          <meshStandardMaterial color="#38bdf8" />
        </mesh>
        <Text position={[0, 3.2, 0]} fontSize={0.48} color={readIds.includes(EXPLORE_OBJECTS[2].id) ? "#86efac" : "#fef08a"} outlineWidth={0.06} outlineColor="black">
          {`${readIds.includes(EXPLORE_OBJECTS[2].id) ? "✅ " : "🔍 "}🏐 Net & Bola Voli`}
        </Text>
      </group>

      <group position={EXPLORE_OBJECTS[3].pos}>
        <mesh position={[0, 0.05, 0]} receiveShadow>
          <boxGeometry args={[3.6, 0.1, 3.6]} />
          <meshStandardMaterial color="#dc2626" />
        </mesh>
        {[-1, 0, 1].map((cx, idx) => (
          <mesh key={idx} position={[cx, 0.55, 0]} castShadow>
            <coneGeometry args={[0.35, 0.9, 16]} />
            <meshStandardMaterial color={idx === 1 ? "#facc15" : "#f97316"} />
          </mesh>
        ))}
        <Text position={[0, 2.2, 0]} fontSize={0.48} color={readIds.includes(EXPLORE_OBJECTS[3].id) ? "#86efac" : "#fef08a"} outlineWidth={0.06} outlineColor="black">
          {`${readIds.includes(EXPLORE_OBJECTS[3].id) ? "✅ " : "🔍 "}🏃 Cone Atletik`}
        </Text>
      </group>

      <group position={EXPLORE_OBJECTS[4].pos}>
        <mesh position={[0, 0.15, 0]} receiveShadow castShadow>
          <boxGeometry args={[3.4, 0.3, 2.2]} />
          <meshStandardMaterial color="#2563eb" />
        </mesh>
        <mesh position={[0, 1.1, -0.6]} castShadow>
          <torusGeometry args={[0.65, 0.08, 12, 28]} />
          <meshStandardMaterial color="#ec4899" />
        </mesh>
        <Text position={[0, 2.4, 0]} fontSize={0.48} color={readIds.includes(EXPLORE_OBJECTS[4].id) ? "#86efac" : "#fef08a"} outlineWidth={0.06} outlineColor="black">
          {`${readIds.includes(EXPLORE_OBJECTS[4].id) ? "✅ " : "🔍 "}🤸 Matras Senam`}
        </Text>
      </group>

      <group position={EXPLORE_OBJECTS[5].pos}>
        <mesh position={[0, 0.65, 0]} castShadow>
          <boxGeometry args={[2.2, 1.3, 1.4]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0.65, 0.72]}>
          <boxGeometry args={[0.7, 0.22, 0.05]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
        <mesh position={[0, 0.65, 0.72]}>
          <boxGeometry args={[0.22, 0.7, 0.05]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
        <mesh position={[0.5, 1.65, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.7, 16]} />
          <meshStandardMaterial color="#0ea5e9" />
        </mesh>
        <Text position={[0, 2.6, 0]} fontSize={0.48} color={readIds.includes(EXPLORE_OBJECTS[5].id) ? "#86efac" : "#fef08a"} outlineWidth={0.06} outlineColor="black">
          {`${readIds.includes(EXPLORE_OBJECTS[5].id) ? "✅ " : "🔍 "}🩺 Pos Hidup Sehat`}
        </Text>
      </group>

      {treePositions.map((pos, idx) => (
        <group key={idx} position={pos}>
          <mesh position={[0, 1.5, 0]} castShadow>
            <boxGeometry args={[0.9, 3, 0.9]} />
            <meshStandardMaterial color="#78350f" />
          </mesh>
          <mesh position={[0, 3.8, 0]} castShadow>
            <boxGeometry args={[3.2, 2.6, 3.2]} />
            <meshStandardMaterial color="#16a34a" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function SportsEnvironment({ faseId, nearPakLukman }: { faseId: string; nearPakLukman: boolean }) {
  const treePositions: [number, number, number][] = [
    [-28, 0, -28],
    [28, 0, -28],
    [-34, 0, -4],
    [34, 0, -4],
    [-25, 0, 32],
    [25, 0, 32],
  ];

  const groundColor =
    faseId === "fase-a"
      ? "#86efac"
      : faseId === "fase-b"
      ? "#22c55e"
      : "#16a34a";

  const trackColor =
    faseId === "fase-a"
      ? "#facc15"
      : faseId === "fase-b"
      ? "#dc2626"
      : "#0284c7";

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color={groundColor} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -4]} receiveShadow>
        <ringGeometry args={[21, 25, 48]} />
        <meshStandardMaterial color={trackColor} />
      </mesh>

      {/* =================================================================
          GEDUNG SEKOLAH DI BELAKANG LAPANGAN + GERBANG SELAMAT DATANG
          + NPC PAK LUKMAN (KEPALA SEKOLAH) DI DEPAN SEKOLAH (SEMUA FASE)
         ================================================================= */}
      <group>
        {/* Jalan Setapak Masuk Sekolah dari Lapangan ke Pintu Sekolah */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -27.5]} receiveShadow>
          <planeGeometry args={[5.2, 11.5]} />
          <meshStandardMaterial color="#cbd5e1" />
        </mesh>

        {/* Gerbang Sekolah Bertuliskan SELAMAT DATANG (x = 0, z = -23.5) */}
        <group position={[0, 0, -23.5]}>
          {/* Pilar Gerbang Kiri & Kanan */}
          <mesh position={[-3.0, 2.4, 0]} castShadow>
            <boxGeometry args={[0.7, 4.8, 0.7]} />
            <meshStandardMaterial color="#dc2626" />
          </mesh>
          <mesh position={[3.0, 2.4, 0]} castShadow>
            <boxGeometry args={[0.7, 4.8, 0.7]} />
            <meshStandardMaterial color="#dc2626" />
          </mesh>
          {/* Balok Atas Gerbang */}
          <mesh position={[0, 4.9, 0]} castShadow>
            <boxGeometry args={[7.0, 1.25, 0.8]} />
            <meshStandardMaterial color="#1e3a8a" />
          </mesh>
          <Text
            position={[0, 5.1, 0.45]}
            fontSize={0.5}
            color="#facc15"
            outlineWidth={0.05}
            outlineColor="black"
          >
            SELAMAT DATANG
          </Text>
          <Text
            position={[0, 4.55, 0.45]}
            fontSize={0.3}
            color="#ffffff"
            outlineWidth={0.04}
            outlineColor="black"
          >
            SD NEGERI JUARA PJOK
          </Text>
        </group>

        {/* NPC Pak Lukman (Kepala Sekolah) Menyambut di Depan Sekolah (x = 2.8, z = -29.5) */}
        <group position={[2.8, 0, -29.5]}>
          <VoxelCharacter
            shirtColor="#0f766e"
            pantsColor="#1e293b"
            skinColor="#fcd34d"
            headStyle="glasses"
            isMoving={false}
            isCoach={true}
          />
          <Text
            position={[0, 3.65, 0]}
            fontSize={0.44}
            color="#fde047"
            outlineWidth={0.06}
            outlineColor="black"
          >
            {nearPakLukman ? "💬 Pak Lukman" : "👋 Pak Lukman"}
          </Text>
          <Text
            position={[0, 3.22, 0]}
            fontSize={0.3}
            color="#99f6e4"
            outlineWidth={0.05}
            outlineColor="black"
          >
            (Kepala Sekolah)
          </Text>
        </group>

        {/* Bangunan Gedung Sekolah Utama di Bagian Belakang (x = 0, z = -36.5) */}
        <group position={[0, 0, -36.5]}>
          {/* Dinding Utama Gedung */}
          <mesh position={[0, 3.6, 0]} castShadow receiveShadow>
            <boxGeometry args={[16.5, 7.2, 8.0]} />
            <meshStandardMaterial color="#fef3c7" />
          </mesh>
          {/* Atap Gedung Sekolah */}
          <mesh position={[0, 8.0, 0]} castShadow>
            <boxGeometry args={[17.6, 1.7, 8.8]} />
            <meshStandardMaterial color="#b91c1c" />
          </mesh>
          {/* Pintu Masuk Utama Sekolah Menghadap Depan (z = +4.05) */}
          <mesh position={[0, 1.85, 4.05]}>
            <boxGeometry args={[3.2, 3.7, 0.25]} />
            <meshStandardMaterial color="#2563eb" />
          </mesh>
          {/* Jendela Kelas Kiri & Kanan */}
          {[-5.6, -3.3, 3.3, 5.6].map((wx, idx) => (
            <React.Fragment key={idx}>
              <mesh position={[wx, 2.4, 4.05]}>
                <boxGeometry args={[1.4, 1.4, 0.15]} />
                <meshStandardMaterial color="#38bdf8" />
              </mesh>
              <mesh position={[wx, 4.9, 4.05]}>
                <boxGeometry args={[1.4, 1.4, 0.15]} />
                <meshStandardMaterial color="#38bdf8" />
              </mesh>
            </React.Fragment>
          ))}
          {/* Papan Nama Gedung Sekolah */}
          <mesh position={[0, 6.2, 4.08]}>
            <boxGeometry args={[11.2, 1.1, 0.25]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <Text
            position={[0, 6.2, 4.25]}
            fontSize={0.54}
            color="#facc15"
            outlineWidth={0.05}
            outlineColor="black"
          >
            🏫 GEDUNG SEKOLAH (KELAS 1 - 6)
          </Text>
        </group>
      </group>

      {faseId === "fase-a" && (
        <group>
          {[-11, -7, 7, 11].map((xPos, i) => (
            <mesh key={i} position={[xPos, 0.45, -20]} castShadow>
              <coneGeometry args={[0.45, 0.9, 16]} />
              <meshStandardMaterial color={i % 2 === 0 ? "#f97316" : "#ec4899"} />
            </mesh>
          ))}
          <mesh position={[-7, 0.2, 2]} castShadow>
            <boxGeometry args={[0.8, 0.4, 7]} />
            <meshStandardMaterial color="#f59e0b" />
          </mesh>
        </group>
      )}

      {faseId === "fase-b" && (
        <group>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -10]}>
            <planeGeometry args={[18, 0.25]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <group position={[-13, 0, -25]}>
            <mesh position={[-2.4, 1.3, 0]} castShadow>
              <boxGeometry args={[0.25, 2.6, 0.25]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[2.4, 1.3, 0]} castShadow>
              <boxGeometry args={[0.25, 2.6, 0.25]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0, 2.6, 0]} castShadow>
              <boxGeometry args={[5.05, 0.25, 0.25]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          </group>
          <group position={[13, 0, -25]}>
            <mesh position={[-2.4, 1.3, 0]} castShadow>
              <boxGeometry args={[0.25, 2.6, 0.25]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[2.4, 1.3, 0]} castShadow>
              <boxGeometry args={[0.25, 2.6, 0.25]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0, 2.6, 0]} castShadow>
              <boxGeometry args={[5.05, 0.25, 0.25]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          </group>
        </group>
      )}

      {faseId === "fase-c" && (
        <group>
          <group position={[-14, 0, -25]}>
            <mesh position={[-2.2, 0.6, 0]} castShadow>
              <boxGeometry args={[2, 1.2, 2]} />
              <meshStandardMaterial color="#cbd5e1" />
            </mesh>
            <Text position={[-2.2, 1.4, 0]} fontSize={0.5} color="#0f172a">
              2
            </Text>
            <mesh position={[0, 0.9, 0]} castShadow>
              <boxGeometry args={[2.2, 1.8, 2.2]} />
              <meshStandardMaterial color="#facc15" />
            </mesh>
            <Text position={[0, 2.0, 0]} fontSize={0.6} color="#0f172a">
              1
            </Text>
            <mesh position={[2.2, 0.4, 0]} castShadow>
              <boxGeometry args={[2, 0.8, 2]} />
              <meshStandardMaterial color="#d97706" />
            </mesh>
            <Text position={[2.2, 1.0, 0]} fontSize={0.5} color="#0f172a">
              3
            </Text>
          </group>

          <group position={[14, 0, -25]}>
            <mesh position={[0, 2.2, 0]} castShadow>
              <boxGeometry args={[0.3, 4.4, 0.3]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            <mesh position={[0, 3.8, 0.3]} castShadow>
              <boxGeometry args={[2.2, 1.4, 0.15]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0, 3.4, 0.8]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.45, 0.06, 12, 24]} />
              <meshStandardMaterial color="#ea580c" />
            </mesh>
          </group>
        </group>
      )}

      {/* Portal 1 (Kanan): Arena Jatuh Bangun */}
      <group position={[14, 0, -4]}>
        <mesh position={[-1.6, 2, 0]} castShadow>
          <boxGeometry args={[0.4, 4, 0.4]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.5} />
        </mesh>
        <mesh position={[1.6, 2, 0]} castShadow>
          <boxGeometry args={[0.4, 4, 0.4]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.5} />
        </mesh>
        <mesh position={[0, 4, 0]} castShadow>
          <boxGeometry args={[3.6, 0.5, 0.5]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.5} />
        </mesh>
        <mesh position={[0, 2, 0]}>
          <planeGeometry args={[2.8, 3.6]} />
          <meshStandardMaterial color="#fef08a" transparent opacity={0.65} side={THREE.DoubleSide} />
        </mesh>
        <Text position={[0, 4.9, 0]} fontSize={0.52} color="#fde047" outlineWidth={0.07} outlineColor="black">
          🏆 Arena Jatuh Bangun
        </Text>
      </group>

      {/* Portal 2 (Kiri): Petualangan Eliminasi */}
      <group position={[-14, 0, -4]}>
        <mesh position={[-1.6, 2, 0]} castShadow>
          <boxGeometry args={[0.4, 4, 0.4]} />
          <meshStandardMaterial color="#9333ea" metalness={0.6} />
        </mesh>
        <mesh position={[1.6, 2, 0]} castShadow>
          <boxGeometry args={[0.4, 4, 0.4]} />
          <meshStandardMaterial color="#9333ea" metalness={0.6} />
        </mesh>
        <mesh position={[0, 4, 0]} castShadow>
          <boxGeometry args={[3.6, 0.5, 0.5]} />
          <meshStandardMaterial color="#9333ea" metalness={0.6} />
        </mesh>
        <mesh position={[0, 2, 0]}>
          <planeGeometry args={[2.8, 3.6]} />
          <meshStandardMaterial color="#d8b4fe" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
        <Text position={[0, 4.9, 0]} fontSize={0.52} color="#e9d5ff" outlineWidth={0.07} outlineColor="black">
          👑 Petualangan Eliminasi
        </Text>
      </group>

      {/* Portal 3 (Belakang Tengah): Dunia Explore PJOK */}
      <group position={[0, 0, -15]}>
        <mesh position={[-1.6, 2, 0]} castShadow>
          <boxGeometry args={[0.4, 4, 0.4]} />
          <meshStandardMaterial color="#0284c7" metalness={0.6} />
        </mesh>
        <mesh position={[1.6, 2, 0]} castShadow>
          <boxGeometry args={[0.4, 4, 0.4]} />
          <meshStandardMaterial color="#0284c7" metalness={0.6} />
        </mesh>
        <mesh position={[0, 4, 0]} castShadow>
          <boxGeometry args={[3.6, 0.5, 0.5]} />
          <meshStandardMaterial color="#0284c7" metalness={0.6} />
        </mesh>
        <mesh position={[0, 2, 0]}>
          <planeGeometry args={[2.8, 3.6]} />
          <meshStandardMaterial color="#7dd3fc" transparent opacity={0.75} side={THREE.DoubleSide} />
        </mesh>
        <Text position={[0, 4.9, 0]} fontSize={0.55} color="#bae6fd" outlineWidth={0.07} outlineColor="black">
          🌍 Dunia Explore PJOK
        </Text>
      </group>

      {/* Portal 4 (Depan Arena): Jembatan Juara 20 Level */}
      <group position={[0, 0, 31]}>
        <mesh position={[-1.6, 2, 0]} castShadow>
          <boxGeometry args={[0.4, 4, 0.4]} />
          <meshStandardMaterial color="#10b981" metalness={0.6} />
        </mesh>
        <mesh position={[1.6, 2, 0]} castShadow>
          <boxGeometry args={[0.4, 4, 0.4]} />
          <meshStandardMaterial color="#10b981" metalness={0.6} />
        </mesh>
        <mesh position={[0, 4, 0]} castShadow>
          <boxGeometry args={[3.6, 0.5, 0.5]} />
          <meshStandardMaterial color="#10b981" metalness={0.6} />
        </mesh>
        <mesh position={[0, 2, 0]}>
          <planeGeometry args={[2.8, 3.6]} />
          <meshStandardMaterial color="#6ee7b7" transparent opacity={0.75} side={THREE.DoubleSide} />
        </mesh>
        <Text position={[0, 4.9, 0]} fontSize={0.52} color="#a7f3d0" outlineWidth={0.07} outlineColor="black">
          🌉 Jembatan Juara (20 Level • Start Bersama)
        </Text>
      </group>

      <mesh position={[0, 0.05, 18]} receiveShadow>
        <boxGeometry args={[17.6, 0.1, 17.6]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {treePositions.map((pos, idx) => (
        <group key={idx} position={pos}>
          <mesh position={[0, 1.5, 0]} castShadow>
            <boxGeometry args={[0.9, 3, 0.9]} />
            <meshStandardMaterial color="#78350f" />
          </mesh>
          <mesh position={[0, 3.8, 0]} castShadow>
            <boxGeometry args={[3.2, 2.6, 3.2]} />
            <meshStandardMaterial color={faseId === "fase-a" ? "#22c55e" : "#15803d"} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function VirtualJoystick({ onMove }: { onMove: (vec: { x: number; y: number }) => void }) {
  const baseRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const updateJoystick = (clientX: number, clientY: number) => {
    if (!baseRef.current) return;
    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxRadius = rect.width / 2 - 16;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    setKnobPos({ x: dx, y: dy });
    onMove({ x: dx / maxRadius, y: dy / maxRadius });
  };

  const resetJoystick = () => {
    setDragging(false);
    setKnobPos({ x: 0, y: 0 });
    onMove({ x: 0, y: 0 });
  };

  return (
    <div
      ref={baseRef}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
        updateJoystick(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (dragging) updateJoystick(e.clientX, e.clientY);
      }}
      onPointerUp={resetJoystick}
      onPointerCancel={resetJoystick}
      className="w-28 h-28 rounded-full bg-slate-900/50 border-2 border-white/40 backdrop-blur-sm flex items-center justify-center touch-none cursor-pointer"
    >
      <div
        style={{ transform: `translate(${knobPos.x}px, ${knobPos.y}px)` }}
        className="w-12 h-12 rounded-full bg-yellow-400/90 border-2 border-white shadow-lg pointer-events-none"
      />
    </div>
  );
}

export default function GameWorld({
  faseData,
  playerName,
  avatarPreset,
  isSpectator = false,
  isMuted = false,
  onBack,
}: {
  faseData: any;
  playerName: string;
  avatarPreset: AvatarPreset;
  isSpectator?: boolean;
  isMuted?: boolean;
  onBack: () => void;
}) {
  const socketRef = useRef<Socket | null>(null);
  const [otherPlayers, setOtherPlayers] = useState<{ [id: string]: any }>({});
  const [onlineCount, setOnlineCount] = useState(isSpectator ? 0 : 1);

  // State Kamera Bebas (Putar Horizontal/Vertikal + Zoom)
  const cameraOrbitRef = useRef<CameraOrbitState>({ yaw: 0, pitch: 0.62, zoom: 1 });
  const cameraDragRef = useRef<{ active: boolean; lastX: number; lastY: number; pointerId: number | null }>({
    active: false,
    lastX: 0,
    lastY: 0,
    pointerId: null,
  });

  const adjustCameraOrbit = (dYaw: number, dPitch: number, dZoom: number) => {
    const cur = cameraOrbitRef.current;
    cur.yaw += dYaw;
    cur.pitch = THREE.MathUtils.clamp(cur.pitch + dPitch, 0.22, 1.32);
    cur.zoom = THREE.MathUtils.clamp(cur.zoom + dZoom, 0.55, 1.85);
  };

  const resetCameraOrbit = () => {
    cameraOrbitRef.current = { yaw: 0, pitch: 0.62, zoom: 1 };
  };

  const [worldMap, setWorldMap] = useState<"stadium" | "explore" | "bridge" | "school">("stadium");
  const [nearExplorePortal, setNearExplorePortal] = useState(false);
  const [nearBridgePortal, setNearBridgePortal] = useState(false);
  const [nearReturnPortal, setNearReturnPortal] = useState(false);
  const [nearPakLukman, setNearPakLukman] = useState(false);
  const [nearSchoolDoor, setNearSchoolDoor] = useState(false);
  const [nearbyClassroom, setNearbyClassroom] = useState<SchoolClassroomMission | null>(null);
  const [activeClassroomModal, setActiveClassroomModal] = useState<SchoolClassroomMission | null>(null);
  const [classQuizIndex, setClassQuizIndex] = useState(0);
  const [classQuizFeedback, setClassQuizFeedback] = useState<string | null>(null);
  const [completedClassIds, setCompletedClassIds] = useState<string[]>([]);
  const [schoolGraduatedModal, setSchoolGraduatedModal] = useState(false);

  const [nearbyExploreObj, setNearbyExploreObj] = useState<(typeof EXPLORE_OBJECTS)[0] | null>(null);
  const [selectedExploreModal, setSelectedExploreModal] = useState<(typeof EXPLORE_OBJECTS)[0] | null>(null);
  const [readExploreIds, setReadExploreIds] = useState<string[]>([]);
  const [exploreCompletedModal, setExploreCompletedModal] = useState(false);

  const [score, setScore] = useState(0);
  const [questionLevel, setQuestionLevel] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);
  const [levelUpBanner, setLevelUpBanner] = useState<string | null>(null);
  const [podiumModal, setPodiumModal] = useState<PodiumModalState | null>(null);
  const [progressLoaded, setProgressLoaded] = useState(false);

  const characterLevel = useMemo(() => getCharacterLevelFromXp(score), [score]);
  const characterTitle = useMemo(() => getCharacterTitle(characterLevel), [characterLevel]);
  const xpInCurrentLevel = score % XP_PER_CHARACTER_LEVEL;
  const prevCharLevelRef = useRef<number>(1);

  const storageKey = useMemo(() => {
    const cleanName = (playerName || "siswa").trim().toLowerCase().replace(/\s+/g, "_");
    return `pjok_progress_${faseData.id}_${cleanName}`;
  }, [faseData.id, playerName]);

  useEffect(() => {
    if (isSpectator || typeof window === "undefined") return;
    setProgressLoaded(false);
    try {
      const savedRaw = localStorage.getItem(storageKey);
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        const loadedScore = typeof parsed.score === "number" ? parsed.score : 0;
        setScore(loadedScore);
        prevCharLevelRef.current = getCharacterLevelFromXp(loadedScore);
        setQuestionLevel(typeof parsed.questionLevel === "number" ? parsed.questionLevel : 1);
        setCorrectCount(typeof parsed.correctCount === "number" ? parsed.correctCount : 0);
        setReadExploreIds(Array.isArray(parsed.readExploreIds) ? parsed.readExploreIds : []);
        setCompletedClassIds(Array.isArray(parsed.completedClassIds) ? parsed.completedClassIds : []);
      } else {
        setScore(0);
        prevCharLevelRef.current = 1;
        setQuestionLevel(1);
        setCorrectCount(0);
        setReadExploreIds([]);
        setCompletedClassIds([]);
      }
    } catch {
      // Abaikan jika penyimpanan terbatas
    }
    setProgressLoaded(true);
  }, [storageKey, isSpectator]);

  useEffect(() => {
    if (isSpectator || !progressLoaded || typeof window === "undefined") return;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          playerName,
          faseId: faseData.id,
          score,
          characterLevel,
          questionLevel,
          correctCount,
          readExploreIds,
          completedClassIds,
          updatedAt: Date.now(),
        })
      );
    } catch {
      // Abaikan jika penyimpanan penuh
    }
  }, [
    storageKey,
    playerName,
    faseData.id,
    score,
    characterLevel,
    questionLevel,
    correctCount,
    readExploreIds,
    completedClassIds,
    isSpectator,
    progressLoaded,
  ]);

  const speakText = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "id-ID";
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (isSpectator || !progressLoaded) return;
    if (characterLevel > prevCharLevelRef.current) {
      const title = getCharacterTitle(characterLevel);
      const msg = `🎖️ LEVEL KARAKTER NAIK ke Lv.${characterLevel} (${title})!`;
      setLevelUpBanner(msg);
      speakText(`Luar biasa ${playerName}! Karakter kamu naik ke Level ${characterLevel}, ${title}!`);
      const t = setTimeout(() => setLevelUpBanner(null), 4500);
      prevCharLevelRef.current = characterLevel;
      return () => clearTimeout(t);
    }
    prevCharLevelRef.current = characterLevel;
  }, [characterLevel, isSpectator, progressLoaded, playerName]);

  const [bridgeLevel, setBridgeLevel] = useState<number>(1);
  const [bridgeSeconds, setBridgeSeconds] = useState<number>(0);
  const [bridgeNotice, setBridgeNotice] = useState<string | null>(null);
  const [bridgeRaceStarted, setBridgeRaceStarted] = useState<boolean>(false);
  const [bridgeCountdown, setBridgeCountdown] = useState<number | null>(null);

  const [teacherTab, setTeacherTab] = useState<"leaderboard" | "live">("leaderboard");
  const [summaryStudentId, setSummaryStudentId] = useState<string | null>(null);
  const [confirmDeleteStudent, setConfirmDeleteStudent] = useState<{ id: string; name: string } | null>(null);
  const [teacherToast, setTeacherToast] = useState<string | null>(null);
  const [cameraPreset, setCameraPreset] = useState<"overview" | "arena">("overview");
  const [followedPlayerId, setFollowedPlayerId] = useState<string | null>(null);

  const [joyVector, setJoyVector] = useState({ x: 0, y: 0 });
  const [jumpTrigger, setJumpTrigger] = useState(0);
  const [teleportTrigger, setTeleportTrigger] = useState<{ pos: [number, number, number]; id: number } | null>(null);
  const [nearCoach, setNearCoach] = useState(false);
  const [nearPortal, setNearPortal] = useState(false);
  const [nearAdventurePortal, setNearAdventurePortal] = useState(false);
  const [activeBuilding, setActiveBuilding] = useState<any>(null);
  const [buildingQuestions, setBuildingQuestions] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [standingTile, setStandingTile] = useState<number | null>(null);
  const [miniGameActive, setMiniGameActive] = useState(false);
  const [gameMode, setGameMode] = useState<"practice" | "adventure">("practice");
  const [practiceRounds, setPracticeRounds] = useState(0);
  const [practiceHits, setPracticeHits] = useState(0);
  const [isEliminated, setIsEliminated] = useState(false);
  const [eliminatedOrder, setEliminatedOrder] = useState<string[]>([]);
  const [shuffledQuestions, setShuffledQuestions] = useState<any[]>([]);
  const [mgIndex, setMgIndex] = useState(0);
  const [mgTimeLeft, setMgTimeLeft] = useState(8);
  const [mgPhase, setMgPhase] = useState<"running" | "dropped">("running");
  const [mgStatusText, setMgStatusText] = useState("");

  const allCollectedQuestions = useMemo(() => {
    const list: any[] = [];
    faseData.gedung_materi.forEach((g: any) => {
      g.kuis.forEach((k: any, qIdx: number) => {
        list.push({
          ...k,
          sumberGedung: g.nama_gedung,
          tingkatDasar: Math.min(5, qIdx + 1),
        });
      });
    });
    return list;
  }, [faseData]);

  const activeQuestionPool =
    shuffledQuestions.length > 0 ? shuffledQuestions : allCollectedQuestions;
  const currentMgQuestion = activeQuestionPool[mgIndex % activeQuestionPool.length];

  const recordCorrectProgress = () => {
    setCorrectCount((prevCorrect) => {
      const nextCorrect = prevCorrect + 1;
      const computedLevel = Math.min(5, Math.floor(nextCorrect / 3) + 1);
      if (computedLevel > questionLevel) {
        setQuestionLevel(computedLevel);
        setScore((s) => s + 150);
        const msg = `⬆️ LEVEL SOAL NAIK ke Level ${computedLevel} (${LEVEL_NAMES[computedLevel]})! +150 XP`;
        setLevelUpBanner(msg);
        setTimeout(() => setLevelUpBanner(null), 4000);
      }
      return nextCorrect;
    });
  };

  useEffect(() => {
    if (worldMap !== "bridge" || !bridgeRaceStarted || Boolean(podiumModal) || isSpectator) return;
    const t = setInterval(() => {
      setBridgeSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(t);
  }, [worldMap, bridgeRaceStarted, podiumModal, isSpectator]);

  useEffect(() => {
    if (bridgeCountdown === null) return;
    if (bridgeCountdown > 0) {
      speakText(String(bridgeCountdown));
      const timer = setTimeout(() => {
        setBridgeCountdown((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setBridgeRaceStarted(true);
      setBridgeSeconds(0);
      setBridgeNotice("🚀 GO! Semua peserta lari bersama menuju Finish 20 Level!");
      speakText("Mulai! Ayo berlari bersama menuju garis finish!");
      const clearTimer = setTimeout(() => {
        setBridgeCountdown(null);
        setBridgeNotice(null);
      }, 1800);
      return () => clearTimeout(clearTimer);
    }
  }, [bridgeCountdown]);

  const getBridgeStartPos = (): [number, number, number] => {
    const numericAvatarId =
      typeof avatarPreset.id === "number"
        ? avatarPreset.id
        : parseInt(String(avatarPreset.id).replace(/\D/g, ""), 10) || 1;
    const spawnOffsetX = ((numericAvatarId % 9) - 4) * 1.6;
    return [spawnOffsetX, 0.5, 27];
  };

  const enterSchoolBuilding = () => {
    setWorldMap("school");
    setNearSchoolDoor(false);
    setNearPakLukman(false);
    setActiveClassroomModal(null);
    setSchoolGraduatedModal(false);
    setTeleportTrigger({ pos: [0, 0, 15], id: Date.now() });
    speakText(
      `Selamat datang di dalam Gedung Sekolah, ${playerName}! Silakan masuk ke Ruang Kelas 1 sampai Kelas 6 dan selesaikan setiap misinya!`
    );
  };

  const openClassroomMission = (cls: SchoolClassroomMission) => {
    setActiveClassroomModal(cls);
    setClassQuizIndex(0);
    setClassQuizFeedback(null);
    speakText(`${cls.namaKelas}. ${cls.judulMisi}. ${cls.soalMisi[0].pertanyaan}`);
  };

  const handleClassroomAnswer = (idx: number) => {
    if (!activeClassroomModal) return;
    const currentQ = activeClassroomModal.soalMisi[classQuizIndex];
    if (idx === currentQ.jawaban_benar) {
      setClassQuizFeedback(`✅ Benar! ${currentQ.pembahasan}`);
      recordCorrectProgress();
    } else {
      setClassQuizFeedback(`❌ Belum tepat. ${currentQ.pembahasan}`);
    }
  };

  const nextClassroomStep = () => {
    if (!activeClassroomModal) return;
    setClassQuizFeedback(null);
    if (classQuizIndex + 1 < activeClassroomModal.soalMisi.length) {
      const nextIdx = classQuizIndex + 1;
      setClassQuizIndex(nextIdx);
      speakText(activeClassroomModal.soalMisi[nextIdx].pertanyaan);
    } else {
      const finishedCls = activeClassroomModal;
      const alreadyDone = completedClassIds.includes(finishedCls.id);
      const updatedClasses = alreadyDone
        ? completedClassIds
        : [...completedClassIds, finishedCls.id];

      if (!alreadyDone) {
        setCompletedClassIds(updatedClasses);
        const isAll6Done = updatedClasses.length === SCHOOL_CLASSROOMS.length;
        setScore((s) => s + finishedCls.xpReward + (isAll6Done ? 600 : 0));

        if (isAll6Done) {
          setActiveClassroomModal(null);
          setSchoolGraduatedModal(true);
          speakText(
            `Selamat dan luar biasa ${playerName}! Kamu telah menyelesaikan seluruh misi Kelas 1 sampai Kelas 6 di Gedung Sekolah!`
          );
          return;
        } else {
          setLevelUpBanner(
            `🎓 Misi ${finishedCls.namaKelas} Selesai! +${finishedCls.xpReward} XP (${updatedClasses.length}/6 Kelas)`
          );
          setTimeout(() => setLevelUpBanner(null), 4000);
        }
      }

      setActiveClassroomModal(null);
      setClassQuizIndex(0);
    }
  };

  const enterExploreWorld = () => {
    setWorldMap("explore");
    setNearExplorePortal(false);
    setSelectedExploreModal(null);
    setExploreCompletedModal(false);
    setTeleportTrigger({ pos: [0, 0, -10], id: Date.now() });
    speakText("Selamat datang di Dunia Explore PJOK! Dekati semua 6 benda olahraga untuk membaca materinya.");
  };

  const enterBridgeWorld = (autoCountdown = false) => {
    setWorldMap("bridge");
    setNearBridgePortal(false);
    setBridgeLevel(1);
    setBridgeSeconds(0);
    setPodiumModal(null);
    setBridgeRaceStarted(false);
    setBridgeCountdown(autoCountdown ? 3 : null);
    setBridgeNotice(
      autoCountdown
        ? "🚦 Bersiap di belakang garis Start!"
        : "🚦 Siap di Garis Start! Tunggu Guru atau tekan Mulai Lomba Bersama!"
    );
    setTeleportTrigger({ pos: getBridgeStartPos(), id: Date.now() });
    if (!autoCountdown) {
      speakText("Berbaris di belakang garis start! Tunggu aba-aba start bersama-sama.");
    }
  };

  const triggerBridgeMassStart = () => {
    socketRef.current?.emit("startBridgeRaceAll", { faseId: faseData.id });
    if (!isSpectator) {
      enterBridgeWorld(true);
    } else {
      setTeacherToast("🚦 Hitung mundur Start Bersama Jembatan Juara telah dikirim ke semua siswa!");
      setTimeout(() => setTeacherToast(null), 4000);
    }
  };

  const returnToStadiumWorld = () => {
    const cameFromSchool = worldMap === "school";
    setWorldMap("stadium");
    setNearReturnPortal(false);
    setNearbyExploreObj(null);
    setNearbyClassroom(null);
    setSelectedExploreModal(null);
    setActiveClassroomModal(null);
    setExploreCompletedModal(false);
    setSchoolGraduatedModal(false);
    setPodiumModal(null);
    setBridgeNotice(null);
    setBridgeRaceStarted(false);
    setBridgeCountdown(null);
    setTeleportTrigger({
      pos: cameFromSchool ? [0, 0, -27.5] : [0, 0, 5],
      id: Date.now(),
    });
  };

  const handleBridgeFall = (checkpointLvl: number) => {
    setBridgeNotice(`💦 Terjatuh! Kembali ke Pos Level ${checkpointLvl}!`);
    setTimeout(() => setBridgeNotice(null), 2000);
  };

  const handleBridgeFinish = () => {
    const bridgePeers = Object.values(otherPlayers).filter((p: any) => p.worldMap === "bridge");
    const aheadPeers = bridgePeers.filter((p: any) => (p.pos?.[2] ?? 0) <= -395);
    const myRank = Math.min(3, aheadPeers.length + 1) as 1 | 2 | 3;
    const bonusXp = myRank === 1 ? 750 : myRank === 2 ? 500 : 300;
    setScore((s) => s + bonusXp);

    const sortedPeers = [...bridgePeers].sort((a: any, b: any) => (a.pos?.[2] ?? 0) - (b.pos?.[2] ?? 0));
    const winners: PodiumEntry[] = [];
    let peerCursor = 0;

    for (let r = 1; r <= 3; r++) {
      if (r === myRank) {
        winners.push({
          rank: r as 1 | 2 | 3,
          name: playerName,
          detail: `Waktu ${bridgeSeconds} detik • +${bonusXp} XP`,
          isSelf: true,
        });
      } else {
        const peer = sortedPeers[peerCursor++];
        winners.push({
          rank: r as 1 | 2 | 3,
          name: peer ? peer.name : r === 2 ? "Peserta Peringkat 2" : "Peserta Peringkat 3",
          detail: peer ? "Penjelajah Jembatan 20 Level" : "Menyusul di Lintasan",
        });
      }
    }

    setPodiumModal({
      title: "PODIUM JUARA JEMBATAN 20 LEVEL!",
      subtitle: `Selamat ${playerName}! Kamu meraih Juara ${myRank} dan mendapatkan +${bonusXp} XP!`,
      winners,
      bonusXp,
    });
    speakText(
      `Selamat ${playerName}! Kamu berhasil meraih Juara ${myRank} pada Lomba Jembatan Juara 20 Level!`
    );
  };

  const openExploreObjectMaterial = (obj: (typeof EXPLORE_OBJECTS)[0]) => {
    setSelectedExploreModal(obj);
    if (!readExploreIds.includes(obj.id)) {
      const updatedIds = [...readExploreIds, obj.id];
      setReadExploreIds(updatedIds);
      const isAllDone = updatedIds.length === EXPLORE_OBJECTS.length;
      setScore((s) => s + (isAllDone ? 350 : 50));

      if (isAllDone) {
        setTimeout(() => {
          setSelectedExploreModal(null);
          setExploreCompletedModal(true);
          speakText(
            `Selamat dan apresiasi setinggi-tingginya untuk ${playerName}! Kamu telah membaca seluruh materi di Dunia Explore PJOK!`
          );
        }, 450);
      }
    }
  };

  const launchAdventureSession = () => {
    setWorldMap("stadium");
    const prioritized = prioritizeQuestionsByLevel(allCollectedQuestions, questionLevel);
    setShuffledQuestions(prioritized);
    setGameMode("adventure");
    setIsEliminated(false);
    setEliminatedOrder([]);
    setPodiumModal(null);
    setMiniGameActive(true);
    setMgIndex(0);
    setMgTimeLeft(9);
    setMgPhase("running");
    setMgStatusText(`👑 Level ${questionLevel} • Jawab benar agar tidak gugur!`);
    setTeleportTrigger({ pos: [0, 0.5, 18], id: Date.now() });
    socketRef.current?.emit("eliminationState", false);
    if (prioritized[0]) speakText(prioritized[0].pertanyaan);
  };

  useEffect(() => {
    const serverHost = typeof window !== "undefined" ? window.location.hostname : "localhost";
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || `http://${serverHost}:4000`;
    const socket = io(socketUrl);
    socketRef.current = socket;

    socket.on("connect", () => {
      if (!isSpectator) {
        socket.emit("joinGame", {
          name: playerName,
          faseId: faseData.id,
          color: avatarPreset.shirtColor,
          avatarType: avatarPreset.id,
        });
      }
    });

    socket.on("updatePlayers", (allPlayers: { [id: string]: any }) => {
      const filtered: { [id: string]: any } = {};
      let count = 0;
      Object.entries(allPlayers).forEach(([id, p]) => {
        if (p.faseId === faseData.id) {
          count++;
          if (id !== socket.id) {
            filtered[id] = p;
          }
        }
      });

      setOtherPlayers(filtered);
      setOnlineCount(isSpectator ? count : Math.max(count, 1));
    });

    socket.on("playerMoved", (movedPlayer: any) => {
      if (movedPlayer.faseId === faseData.id && movedPlayer.id !== socket.id) {
        setOtherPlayers((prev) => ({
          ...prev,
          [movedPlayer.id]: movedPlayer,
        }));
      }
    });

    socket.on("adventureStarted", ({ faseId }: { faseId: string }) => {
      if (faseId === faseData.id && !isSpectator) {
        launchAdventureSession();
      }
    });

    socket.on("bridgeRaceStarted", ({ faseId }: { faseId: string }) => {
      if (faseId === faseData.id && !isSpectator) {
        enterBridgeWorld(true);
      }
    });

    socket.on("kickedByTeacher", ({ targetId, targetName }: { targetId?: string; targetName?: string }) => {
      if (isSpectator) return;
      const isMeById = targetId && socket.id === targetId;
      const isMeByName =
        targetName &&
        playerName.trim().toLowerCase() === String(targetName).trim().toLowerCase();
      if (isMeById || isMeByName) {
        alert("Karakter kamu telah dihapus dari kelas oleh Guru.");
        onBack();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [faseData.id, playerName, avatarPreset, isSpectator]);

  const handleDeleteStudent = (studentId: string, studentName: string) => {
    socketRef.current?.emit("removeStudent", {
      studentId,
      studentName,
      faseId: faseData.id,
    });

    setOtherPlayers((prev) => {
      const copy = { ...prev };
      delete copy[studentId];
      return copy;
    });

    if (followedPlayerId === studentId) setFollowedPlayerId(null);
    if (summaryStudentId === studentId) setSummaryStudentId(null);
    setConfirmDeleteStudent(null);

    setTeacherToast(`🗑️ Karakter "${studentName}" telah dihapus dari kelas.`);
    setTimeout(() => setTeacherToast(null), 3500);
  };

  const studentList = useMemo(() => Object.values(otherPlayers), [otherPlayers]);

  const bridgeWaitingCount = useMemo(() => {
    const remoteInBridge = studentList.filter((p: any) => p.worldMap === "bridge").length;
    return remoteInBridge + (!isSpectator && worldMap === "bridge" ? 1 : 0);
  }, [studentList, isSpectator, worldMap]);

  const leaderboardStudents = useMemo(() => {
    return [...studentList].sort((a: any, b: any) => {
      const scoreA = a.score || 0;
      const scoreB = b.score || 0;
      const lvlA = a.characterLevel || getCharacterLevelFromXp(scoreA);
      const lvlB = b.characterLevel || getCharacterLevelFromXp(scoreB);
      if (lvlB !== lvlA) return lvlB - lvlA;
      return scoreB - scoreA;
    });
  }, [studentList]);

  const summaryStudent = summaryStudentId ? otherPlayers[summaryStudentId] || null : null;

  const visibleRemotePlayers = useMemo(
    () =>
      studentList.filter(
        (p: any) => (p.worldMap || "stadium") === (isSpectator ? "stadium" : worldMap)
      ),
    [studentList, worldMap, isSpectator]
  );
  const followedPlayer = followedPlayerId ? otherPlayers[followedPlayerId] || null : null;

  const survivors = useMemo(() => {
    const list: { id: string; name: string; isSelf: boolean; score: number }[] = [];
    if (!isSpectator && !isEliminated) {
      list.push({ id: "self", name: playerName, isSelf: true, score });
    }
    studentList.forEach((p: any) => {
      if (!p.isEliminated) {
        list.push({ id: p.id, name: p.name || "Siswa", isSelf: false, score: p.score || 0 });
      }
    });
    return list;
  }, [isSpectator, isEliminated, playerName, studentList, score]);

  const startPracticeMiniGame = () => {
    const prioritized = prioritizeQuestionsByLevel(allCollectedQuestions, questionLevel);
    setShuffledQuestions(prioritized);
    setGameMode("practice");
    setPracticeRounds(0);
    setPracticeHits(0);
    setIsEliminated(false);
    setPodiumModal(null);
    setMiniGameActive(true);
    setMgIndex(0);
    setMgTimeLeft(8);
    setMgPhase("running");
    setMgStatusText(`Ronde 1/5 • Level Soal ${questionLevel} (${LEVEL_NAMES[questionLevel]})`);
    setTeleportTrigger({ pos: [0, 0.5, 18], id: Date.now() });
    if (prioritized[0]) speakText(prioritized[0].pertanyaan);
  };

  const triggerGlobalAdventure = () => {
    socketRef.current?.emit("startAdventureAll", { faseId: faseData.id });
    if (!isSpectator) {
      launchAdventureSession();
    } else {
      setCameraPreset("arena");
      setFollowedPlayerId(null);
    }
  };

  const finishPracticeArenaWithPodium = (finalHits: number) => {
    setMiniGameActive(false);
    setMgPhase("running");
    setTeleportTrigger({ pos: [0, 0, 5], id: Date.now() });

    const ranked = [
      { name: playerName, pts: finalHits * 200 + score, isSelf: true, hits: finalHits },
      ...studentList.map((p: any) => ({
        name: p.name || "Siswa",
        pts: p.score || 0,
        isSelf: false,
        hits: Math.floor((p.score || 0) / 200),
      })),
    ].sort((a, b) => b.pts - a.pts);

    const myIndex = ranked.findIndex((r) => r.isSelf);
    const myRank = Math.min(3, myIndex + 1) as 1 | 2 | 3;
    const bonusXp = myRank === 1 ? 400 : myRank === 2 ? 250 : 150;
    setScore((s) => s + bonusXp);

    const winners: PodiumEntry[] = [0, 1, 2].map((idx) => {
      const item = ranked[idx];
      return {
        rank: (idx + 1) as 1 | 2 | 3,
        name: item ? item.name : idx === 1 ? "Peserta Peringkat 2" : "Peserta Peringkat 3",
        detail: item
          ? item.isSelf
            ? `${finalHits}/5 Soal Benar • +${bonusXp} XP`
            : `${item.pts} XP`
          : "Peserta Arena",
        isSelf: item?.isSelf,
      };
    });

    setPodiumModal({
      title: "PODIUM JUARA ARENA JATUH BANGUN!",
      subtitle: `Selamat ${playerName}! Kamu meraih Juara ${myRank} dan mendapatkan +${bonusXp} XP!`,
      winners,
      bonusXp,
    });
    speakText(
      `Selamat ${playerName}! Kamu meraih Juara ${myRank} di Arena Jatuh Bangun dengan ${finalHits} jawaban benar!`
    );
  };

  const stopMiniGame = () => {
    if (gameMode === "practice" && practiceRounds > 0) {
      finishPracticeArenaWithPodium(practiceHits);
      return;
    }
    setMiniGameActive(false);
    setMgPhase("running");
    setIsEliminated(false);
    setPodiumModal(null);
    socketRef.current?.emit("eliminationState", false);
    setTeleportTrigger({ pos: [0, 0, 5], id: Date.now() });
  };

  useEffect(() => {
    if (!miniGameActive || isSpectator) return;

    const timer = setInterval(() => {
      setMgTimeLeft((prev) => {
        if (prev > 1) return prev - 1;

        if (mgPhase === "running") {
          setMgPhase("dropped");
          const correctId = currentMgQuestion.jawaban_benar;
          const correctLabel = ARENA_TILES[correctId].label;

          if (gameMode === "adventure") {
            const newlyOut = studentList
              .filter((p: any) => p.isEliminated && !eliminatedOrder.includes(p.name))
              .map((p: any) => p.name);
            if (newlyOut.length > 0) {
              setEliminatedOrder((old) => [...old, ...newlyOut]);
            }

            if (!isEliminated) {
              if (standingTile === correctId) {
                setScore((s) => s + 250);
                recordCorrectProgress();
                setMgStatusText(`✅ LOLOS! Jawaban ${correctLabel} (+250 XP)`);
              } else {
                setIsEliminated(true);
                setEliminatedOrder((old) => (old.includes(playerName) ? old : [...old, playerName]));
                socketRef.current?.emit("eliminationState", true);
                setMgStatusText(`❌ TERELIMINASI! Jawaban benar: ${correctLabel}`);
              }
            } else {
              setMgStatusText(`👻 Penonton • Jawaban benar: ${correctLabel}`);
            }
          } else {
            const nextRound = practiceRounds + 1;
            setPracticeRounds(nextRound);
            if (standingTile === correctId) {
              setPracticeHits((h) => h + 1);
              setScore((s) => s + 200);
              recordCorrectProgress();
              setMgStatusText(`🎉 BENAR (${correctLabel}) +200 XP • Ronde ${nextRound}/5`);
            } else {
              setMgStatusText(`💥 Salah! Jawaban: ${correctLabel} • Ronde ${nextRound}/5`);
            }
          }
          return 4;
        } else {
          if (gameMode === "adventure") {
            const totalParticipants = 1 + studentList.length;
            if ((totalParticipants > 1 && survivors.length <= 1) || (totalParticipants === 1 && isEliminated)) {
              setMiniGameActive(false);
              setMgPhase("running");
              socketRef.current?.emit("eliminationState", false);

              const firstWinner = survivors[0] || { name: playerName, isSelf: true };
              const reverseElim = [...eliminatedOrder].reverse().filter((n) => n !== firstWinner.name);
              const secondName = reverseElim[0] || "Peserta Peringkat 2";
              const thirdName = reverseElim[1] || "Peserta Peringkat 3";

              const myRank: 1 | 2 | 3 = firstWinner.isSelf
                ? 1
                : secondName === playerName
                ? 2
                : 3;
              const bonusXp = myRank === 1 ? 600 : myRank === 2 ? 350 : 200;
              setScore((s) => s + bonusXp);

              const winners: PodiumEntry[] = [
                {
                  rank: 1,
                  name: firstWinner.name,
                  detail: "1 Siswa Terakhir Bertahan • Juara Utama",
                  isSelf: firstWinner.isSelf,
                },
                {
                  rank: 2,
                  name: secondName,
                  detail: "Finalis Ronde Akhir",
                  isSelf: secondName === playerName,
                },
                {
                  rank: 3,
                  name: thirdName,
                  detail: "Semifinalis Bertahan",
                  isSelf: thirdName === playerName,
                },
              ];

              setPodiumModal({
                title: "PODIUM PETUALANGAN ELIMINASI!",
                subtitle: `Selamat kepada para juara! ${playerName} mendapatkan apresiasi +${bonusXp} XP!`,
                winners,
                bonusXp,
              });
              speakText(
                `Selamat kepada Juara 1 ${firstWinner.name}, Juara 2 ${secondName}, dan Juara 3 ${thirdName} dalam Petualangan Eliminasi!`
              );
              return 0;
            }
          } else if (practiceRounds >= 5) {
            finishPracticeArenaWithPodium(practiceHits);
            return 0;
          }

          const nextIdx = mgIndex + 1;
          setMgIndex(nextIdx);
          setMgPhase("running");
          setMgStatusText(
            gameMode === "adventure"
              ? isEliminated
                ? "👻 Kamu sudah gugur, saksikan temanmu bertanding!"
                : `👑 Level ${questionLevel} • Lari ke ubin jawaban benar!`
              : `Ronde ${practiceRounds + 1}/5 • Level Soal ${questionLevel} (${LEVEL_NAMES[questionLevel]})`
          );
          if (!isEliminated) {
            setTeleportTrigger({ pos: [0, 0.5, 18], id: Date.now() });
          }
          const nextQ = activeQuestionPool[nextIdx % activeQuestionPool.length];
          if (nextQ) speakText(nextQ.pertanyaan);
          return gameMode === "adventure" ? 9 : 8;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    miniGameActive,
    mgPhase,
    mgIndex,
    standingTile,
    currentMgQuestion,
    activeQuestionPool,
    isSpectator,
    gameMode,
    isEliminated,
    survivors,
    studentList,
    eliminatedOrder,
    practiceRounds,
    practiceHits,
    playerName,
    questionLevel,
  ]);

  const isTileFallen = (tileId: number) => {
    if (!miniGameActive || mgPhase !== "dropped") return false;
    return tileId !== currentMgQuestion.jawaban_benar;
  };

  const openBuildingQuiz = () => {
    if (!activeBuilding) return;
    const orderedQuiz = prioritizeQuestionsByLevel(activeBuilding.kuis, questionLevel);
    setBuildingQuestions(orderedQuiz);
    setShowModal(true);
    setQuizIndex(0);
    setFeedback(null);
  };

  const handleAnswer = (idx: number) => {
    const activeQuizList = buildingQuestions.length > 0 ? buildingQuestions : activeBuilding.kuis;
    const currentQuiz = activeQuizList[quizIndex];
    if (idx === currentQuiz.jawaban_benar) {
      setFeedback(`✅ ${currentQuiz.pembahasan}`);
      setScore((s) => s + 100 * questionLevel);
      recordCorrectProgress();
    } else {
      setFeedback(`❌ Kurang tepat. ${currentQuiz.pembahasan}`);
    }
  };

  const nextQuestion = () => {
    setFeedback(null);
    const activeQuizList = buildingQuestions.length > 0 ? buildingQuestions : activeBuilding.kuis;
    if (quizIndex + 1 < activeQuizList.length) {
      setQuizIndex(quizIndex + 1);
    } else {
      setShowModal(false);
      setQuizIndex(0);
    }
  };

  const activeQuizList =
    activeBuilding && (buildingQuestions.length > 0 ? buildingQuestions : activeBuilding.kuis);
  const nextLevelProgress = correctCount % 3;

  const pakLukmanDialog = `Selamat datang di SD Negeri Juara PJOK, ${playerName}! Saya Pak Lukman, Kepala Sekolah di sini. Silakan masuk ke dalam Gedung Sekolah di belakang saya untuk menyelesaikan misi dari Kelas 1 sampai Kelas 6!`;

  return (
    <div
      onWheel={(e) => {
        if (!showModal && !selectedExploreModal && !activeClassroomModal && !podiumModal) {
          adjustCameraOrbit(0, 0, e.deltaY * 0.0008);
        }
      }}
      className="relative w-full h-[100dvh] overflow-hidden select-none"
    >
      <CheerfulBGM muted={isMuted} />

      {/* HUD Atas Ramping + Level Karakter & XP */}
      <div
        style={{
          paddingTop: "max(0.5rem, env(safe-area-inset-top))",
          paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
          paddingRight: "max(0.75rem, env(safe-area-inset-right))",
        }}
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between pointer-events-none gap-2"
      >
        <div className="flex items-center gap-1.5 bg-slate-900/90 text-white px-2.5 py-1.5 rounded-xl border border-slate-700 shadow pointer-events-auto">
          <button
            onClick={onBack}
            className="bg-red-600 hover:bg-red-500 px-2.5 py-1 rounded-lg text-xs font-extrabold"
          >
            ← Fase
          </button>
          <span className="text-xs font-bold text-yellow-400 truncate max-w-[105px] sm:max-w-none">
            {worldMap === "school"
              ? "🏫 Gedung Sekolah"
              : worldMap === "explore"
              ? "🌍 Explore PJOK"
              : worldMap === "bridge"
              ? "🌉 Jembatan Juara"
              : faseData.nama_fase}
          </span>
          {!isSpectator && worldMap !== "stadium" && (
            <button
              onClick={returnToStadiumWorld}
              className="bg-orange-500 hover:bg-orange-400 text-slate-950 px-2 py-1 rounded-lg text-[11px] font-extrabold"
            >
              🏟️ Stadion
            </button>
          )}
        </div>

        {!isSpectator ? (
          <div className="flex items-center gap-1.5 bg-slate-900/90 text-white px-2.5 py-1.5 rounded-xl border border-slate-700 shadow pointer-events-auto text-xs">
            <span
              title={`${characterTitle} • ${xpInCurrentLevel}/${XP_PER_CHARACTER_LEVEL} XP menuju Lv.${characterLevel + 1}`}
              className="bg-yellow-400 text-slate-950 px-2 py-0.5 rounded-lg font-extrabold"
            >
              🎖️ Lv.{characterLevel}
            </span>
            {worldMap === "school" && (
              <span className="text-amber-300 font-bold">
                🏫 {completedClassIds.length}/{SCHOOL_CLASSROOMS.length}
              </span>
            )}
            {worldMap === "explore" && (
              <span className="text-sky-300 font-bold">
                🔍 {readExploreIds.length}/{EXPLORE_OBJECTS.length}
              </span>
            )}
            {worldMap === "bridge" && (
              <span className="text-emerald-300 font-bold">
                🌉 Lv.{bridgeLevel}/{TOTAL_BRIDGE_LEVELS} • ⏱️ {bridgeSeconds}d
              </span>
            )}
            <span className="text-emerald-400 font-extrabold">
              {score} XP
            </span>
            <span className="text-sky-400 font-bold">👥 {onlineCount}</span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 text-white p-1.5 rounded-xl border border-slate-700 shadow-lg pointer-events-auto">
            <button
              onClick={triggerBridgeMassStart}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold px-2.5 py-1 rounded-lg shadow"
            >
              🌉 Start Jembatan Bersama
            </button>
            <button
              onClick={triggerGlobalAdventure}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold px-2.5 py-1 rounded-lg shadow"
            >
              👑 Mulai Eliminasi Kelas
            </button>
            <button
              onClick={() => {
                setFollowedPlayerId(null);
                setCameraPreset("overview");
                resetCameraOrbit();
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                !followedPlayerId && cameraPreset === "overview"
                  ? "bg-yellow-400 text-slate-950"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200"
              }`}
            >
              🗺️ Lapangan
            </button>
            <button
              onClick={() => {
                setFollowedPlayerId(null);
                setCameraPreset("arena");
                resetCameraOrbit();
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                !followedPlayerId && cameraPreset === "arena"
                  ? "bg-yellow-400 text-slate-950"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200"
              }`}
            >
              🏆 Arena
            </button>
          </div>
        )}
      </div>

      {/* Kontrol Kamera Bebas (Putar Kiri/Kanan, Atas/Bawah, Zoom In/Out, Reset) */}
      <div
        style={{
          top: "max(3.2rem, calc(env(safe-area-inset-top) + 2.8rem))",
          right: "max(0.75rem, env(safe-area-inset-right))",
        }}
        className="fixed z-10 flex items-center gap-1 bg-slate-900/85 backdrop-blur-sm text-white px-2 py-1 rounded-xl border border-slate-700 shadow-lg pointer-events-auto text-[11px] font-extrabold"
      >
        <span className="text-slate-300 hidden sm:inline mr-0.5">🎥 Kamera:</span>
        <button
          title="Putar Kamera ke Kiri"
          onClick={() => adjustCameraOrbit(-0.35, 0, 0)}
          className="bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-lg"
        >
          ↺
        </button>
        <button
          title="Putar Kamera ke Kanan"
          onClick={() => adjustCameraOrbit(0.35, 0, 0)}
          className="bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-lg"
        >
          ↻
        </button>
        <button
          title="Perbesar (Zoom In)"
          onClick={() => adjustCameraOrbit(0, 0, -0.15)}
          className="bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-lg"
        >
          🔍+
        </button>
        <button
          title="Perkecil (Zoom Out)"
          onClick={() => adjustCameraOrbit(0, 0, 0.15)}
          className="bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-lg"
        >
          🔍-
        </button>
        <button
          title="Reset Sudut Kamera"
          onClick={resetCameraOrbit}
          className="bg-yellow-400 hover:bg-yellow-300 text-slate-950 px-2 py-1 rounded-lg"
        >
          Reset
        </button>
      </div>

      {/* Notifikasi Guru */}
      {isSpectator && teacherToast && (
        <div
          style={{ top: "max(5.8rem, calc(env(safe-area-inset-top) + 5.2rem))" }}
          className="fixed left-1/2 -translate-x-1/2 z-30 bg-emerald-600 text-white px-4 py-2 rounded-2xl border-2 border-white font-extrabold text-xs shadow-2xl text-center"
        >
          {teacherToast}
        </div>
      )}

      {/* Notifikasi Naik Level Karakter / Misi */}
      {!isSpectator && levelUpBanner && (
        <div
          style={{ top: "max(5.8rem, calc(env(safe-area-inset-top) + 5.2rem))" }}
          className="fixed left-1/2 -translate-x-1/2 z-30 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 px-4 py-2 rounded-2xl border-2 border-white font-extrabold text-xs md:text-sm shadow-2xl animate-bounce text-center"
        >
          {levelUpBanner}
        </div>
      )}

      {/* Dialog NPC Pak Lukman (Kepala Sekolah) di Depan Gedung Sekolah */}
      {!isSpectator && worldMap === "stadium" && nearPakLukman && !miniGameActive && !showModal && (
        <div
          style={{ top: "max(5.8rem, calc(env(safe-area-inset-top) + 5.2rem))" }}
          className="fixed left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-lg bg-slate-900/95 text-white p-3.5 rounded-2xl border-2 border-teal-400 shadow-2xl"
        >
          <div className="flex justify-between items-center mb-1">
            <span className="font-extrabold text-teal-300 text-sm md:text-base">
              👨‍🏫 Pak Lukman (Kepala Sekolah)
            </span>
            <button
              onClick={() => speakText(pakLukmanDialog)}
              className="bg-teal-600 hover:bg-teal-500 text-xs px-3 py-1 rounded-full font-bold"
            >
              🔊 Suara Kepala Sekolah
            </button>
          </div>
          <p className="text-xs md:text-sm leading-relaxed text-slate-100">
            {pakLukmanDialog}
          </p>
          <p className="text-[11px] text-amber-300 mt-1.5 font-bold">
            🏫 Progres Kelas Sekolahmu: {completedClassIds.length} dari 6 Kelas Selesai!
          </p>
        </div>
      )}

      {/* Tombol Masuk ke Gedung Sekolah saat Dekat Pintu Sekolah */}
      {!isSpectator && worldMap === "stadium" && nearSchoolDoor && !miniGameActive && !showModal && (
        <div className="absolute bottom-36 left-1/2 -translate-x-1/2 z-10 w-[88%] max-w-xs text-center">
          <button
            onClick={enterSchoolBuilding}
            className="w-full bg-teal-400 hover:bg-teal-300 text-slate-950 font-extrabold px-4 py-3 rounded-full shadow-2xl border-2 border-white animate-bounce text-xs md:text-sm"
          >
            🏫 Masuk ke Gedung Sekolah (Kelas 1 - 6)!
          </button>
        </div>
      )}

      {/* Tombol Masuk Ruang Kelas (Kelas 1 - 6) di Dalam Gedung Sekolah */}
      {!isSpectator && worldMap === "school" && nearbyClassroom && !activeClassroomModal && (
        <div className="absolute bottom-36 left-1/2 -translate-x-1/2 z-10 w-[90%] max-w-sm text-center">
          <button
            onClick={() => openClassroomMission(nearbyClassroom)}
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-extrabold px-4 py-3 rounded-full shadow-2xl border-2 border-white animate-bounce text-xs md:text-sm"
          >
            🚪 Masuk {nearbyClassroom.namaKelas} • {nearbyClassroom.tingkatKesulitan}
          </button>
        </div>
      )}

      {/* Modal Misi Ruang Kelas (Kelas 1 - 6) */}
      {!isSpectator && activeClassroomModal && (
        <div className="fixed inset-0 z-30 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white border-2 border-yellow-400 rounded-3xl p-5 max-w-xl w-full shadow-2xl max-h-[90dvh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-700 pb-3 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    style={{ backgroundColor: activeClassroomModal.warna }}
                    className="text-slate-950 text-xs font-extrabold px-2.5 py-0.5 rounded-full"
                  >
                    {activeClassroomModal.namaKelas}
                  </span>
                  <span className="bg-slate-800 border border-amber-400 text-amber-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                    {activeClassroomModal.bintang} {activeClassroomModal.tingkatKesulitan}
                  </span>
                </div>
                <h3 className="text-base md:text-lg font-extrabold text-yellow-300">
                  {activeClassroomModal.judulMisi}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {activeClassroomModal.deskripsiMisi}
                </p>
              </div>
              <button
                onClick={() => setActiveClassroomModal(null)}
                className="text-slate-400 hover:text-white font-bold text-xl"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-extrabold text-emerald-400">
                  🎯 Soal Misi {classQuizIndex + 1} dari {activeClassroomModal.soalMisi.length} • Hadiah +{activeClassroomModal.xpReward} XP
                </span>
                <button
                  onClick={() =>
                    speakText(activeClassroomModal.soalMisi[classQuizIndex].pertanyaan)
                  }
                  className="bg-sky-600 hover:bg-sky-500 text-white text-xs px-3 py-1 rounded-full font-bold"
                >
                  🔊 Bacakan Soal
                </button>
              </div>

              <h4 className="font-bold text-sm md:text-base text-white mb-3 leading-snug">
                {activeClassroomModal.soalMisi[classQuizIndex].pertanyaan}
              </h4>

              <div className="grid grid-cols-1 gap-2">
                {activeClassroomModal.soalMisi[classQuizIndex].pilihan.map(
                  (opsi: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => handleClassroomAnswer(i)}
                      disabled={classQuizFeedback !== null}
                      className="text-left px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-600 hover:border-yellow-400 hover:bg-slate-800 font-medium text-xs md:text-sm transition"
                    >
                      {String.fromCharCode(65 + i)}. {opsi}
                    </button>
                  )
                )}
              </div>

              {classQuizFeedback && (
                <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-emerald-500/50 flex flex-col sm:flex-row justify-between items-center gap-3">
                  <p className="text-xs md:text-sm font-semibold text-slate-100">
                    {classQuizFeedback}
                  </p>
                  <button
                    onClick={nextClassroomStep}
                    className="bg-yellow-400 hover:bg-yellow-300 text-slate-950 px-4 py-2 rounded-xl text-xs font-extrabold shrink-0"
                  >
                    {classQuizIndex + 1 < activeClassroomModal.soalMisi.length
                      ? "Soal Berikutnya →"
                      : "Selesaikan Misi Kelas ✅"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Apresiasi Lulus Semua 6 Kelas Sekolah */}
      {!isSpectator && schoolGraduatedModal && (
        <div className="fixed inset-0 z-30 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-teal-900 to-slate-900 border-4 border-yellow-400 rounded-3xl p-6 max-w-md w-full text-center text-white shadow-2xl">
            <div className="text-5xl mb-2 animate-bounce">🎓🏆</div>
            <span className="inline-block bg-yellow-400 text-slate-950 text-[11px] font-extrabold px-3 py-0.5 rounded-full mb-2">
              LULUSAN TERBAIK SEKOLAH PJOK (KELAS 1 - 6)
            </span>
            <h2 className="text-lg md:text-xl font-extrabold text-yellow-300 mb-2">
              Selamat & Apresiasi untuk {playerName}!
            </h2>
            <p className="text-xs md:text-sm text-slate-200 leading-relaxed mb-4">
              Kepala Sekolah Pak Lukman sangat bangga! Kamu telah menuntaskan seluruh <b>6 misi kelas (Kelas 1 hingga Kelas 6)</b> di dalam Gedung Sekolah. Bonus <b>+600 XP</b> telah ditambahkan ke karaktermu!
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setSchoolGraduatedModal(false)}
                className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-extrabold py-2.5 rounded-xl text-xs"
              >
                🏫 Tetap di Sekolah
              </button>
              <button
                onClick={returnToStadiumWorld}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-xl text-xs"
              >
                🏟️ Keluar ke Lapangan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay Hitung Mundur Start Bersama-sama Jembatan Juara */}
      {!isSpectator && worldMap === "bridge" && bridgeCountdown !== null && (
        <div className="fixed inset-0 z-30 bg-black/55 flex items-center justify-center pointer-events-none">
          <div className="bg-slate-950/90 border-4 border-yellow-400 rounded-3xl px-8 py-6 text-center shadow-2xl animate-bounce">
            <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-300 mb-1">
              🚦 START BERSAMA-SAMA JEMBATAN JUARA
            </p>
            <div className="text-6xl md:text-7xl font-black text-yellow-400">
              {bridgeCountdown > 0 ? bridgeCountdown : "MULAI!"}
            </div>
          </div>
        </div>
      )}

      {/* Panel Status & Tombol Start Bersama-sama saat berada di Area Start Jembatan Juara */}
      {!isSpectator && worldMap === "bridge" && !bridgeRaceStarted && bridgeCountdown === null && !podiumModal && (
        <div
          style={{ top: "max(5.8rem, calc(env(safe-area-inset-top) + 5.2rem))" }}
          className="fixed left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-md bg-slate-950/90 backdrop-blur-md text-white p-3.5 rounded-2xl border-2 border-yellow-400 shadow-2xl text-center"
        >
          <p className="text-xs font-extrabold text-yellow-300 mb-1">
            🚦 RUANG TUNGGU START BERSAMA ({bridgeWaitingCount} Peserta Siap)
          </p>
          <p className="text-[11px] text-slate-200 mb-2.5 leading-snug">
            Semua peserta ditahan di belakang garis pembatas agar berlari serentak. Tunggu aba-aba guru atau tekan tombol di bawah jika semua teman sudah siap!
          </p>
          <button
            onClick={triggerBridgeMassStart}
            className="w-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold py-2.5 px-4 rounded-xl text-xs md:text-sm shadow-lg"
          >
            🚦 Mulai Lomba Bersama-sama Sekarang!
          </button>
        </div>
      )}

      {/* Indikator Level 1..20 Jembatan Juara setelah Start Dibuka */}
      {!isSpectator && worldMap === "bridge" && bridgeRaceStarted && !podiumModal && (
        <div
          style={{ top: "max(5.8rem, calc(env(safe-area-inset-top) + 5.2rem))" }}
          className="fixed left-1/2 -translate-x-1/2 z-20 bg-slate-950/85 text-white px-4 py-1.5 rounded-full border border-emerald-400 text-xs font-extrabold shadow-lg pointer-events-none"
        >
          {bridgeNotice
            ? bridgeNotice
            : `🌉 Level ${bridgeLevel} dari ${TOTAL_BRIDGE_LEVELS} (${
                bridgeLevel <= 4
                  ? "🟢 Pemula"
                  : bridgeLevel <= 8
                  ? "🔵 Dasar"
                  : bridgeLevel <= 12
                  ? "🟡 Menengah"
                  : bridgeLevel <= 16
                  ? "🟠 Mahir"
                  : "🔴 Ekstrem Juara"
              })`}
        </div>
      )}

      {/* Modal Konfirmasi Hapus Karakter Siswa di Mode Guru */}
      {isSpectator && confirmDeleteStudent && (
        <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-red-500 rounded-2xl p-5 max-w-sm w-full text-white text-center shadow-2xl">
            <div className="text-4xl mb-2">⚠️</div>
            <h3 className="text-base font-extrabold text-red-400 mb-1.5">
              Hapus Karakter Siswa?
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Karakter <b>{confirmDeleteStudent.name}</b> akan dikeluarkan dari ruang kelas dan dihapus dari daftar peringkat serta rangkuman guru.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDeleteStudent(null)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-xl text-xs"
              >
                Batal
              </button>
              <button
                onClick={() =>
                  handleDeleteStudent(confirmDeleteStudent.id, confirmDeleteStudent.name)
                }
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-extrabold py-2 rounded-xl text-xs"
              >
                🗑️ Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Podium Juara 1, 2, dan 3 */}
      {!isSpectator && podiumModal && (
        <div className="fixed inset-0 z-30 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 border-4 border-yellow-400 rounded-3xl p-6 max-w-md w-full text-center text-white shadow-2xl">
            <div className="text-5xl mb-2 animate-bounce">🏆🎉</div>
            <h2 className="text-lg md:text-xl font-extrabold text-yellow-300 mb-1">
              {podiumModal.title}
            </h2>
            <p className="text-xs md:text-sm text-sky-200 mb-4">{podiumModal.subtitle}</p>

            <div className="space-y-2 mb-5 text-left">
              {podiumModal.winners.map((w) => (
                <div
                  key={w.rank}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl border ${
                    w.rank === 1
                      ? "bg-yellow-400/20 border-yellow-400"
                      : w.rank === 2
                      ? "bg-slate-300/15 border-slate-300"
                      : "bg-amber-700/20 border-amber-500"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">
                      {w.rank === 1 ? "🥇" : w.rank === 2 ? "🥈" : "🥉"}
                    </span>
                    <div>
                      <p className="text-xs md:text-sm font-extrabold text-white">
                        Juara {w.rank}: {w.name} {w.isSelf ? "(Kamu)" : ""}
                      </p>
                      <p className="text-[11px] text-slate-300">{w.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              {worldMap === "bridge" ? (
                <button
                  onClick={() => enterBridgeWorld(false)}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-extrabold py-2.5 rounded-xl text-xs"
                >
                  🔄 Kembali ke Garis Start
                </button>
              ) : (
                <button
                  onClick={startPracticeMiniGame}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-extrabold py-2.5 rounded-xl text-xs"
                >
                  🔄 Main Lagi
                </button>
              )}
              <button
                onClick={returnToStadiumWorld}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-xl text-xs"
              >
                🏟️ Kembali ke Stadion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Apresiasi Membaca Semua Materi di Portal Explore PJOK */}
      {!isSpectator && exploreCompletedModal && (
        <div className="fixed inset-0 z-30 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-sky-900 to-slate-900 border-4 border-emerald-400 rounded-3xl p-6 max-w-md w-full text-center text-white shadow-2xl">
            <div className="text-5xl mb-2 animate-bounce">🌍🏅</div>
            <span className="inline-block bg-emerald-400 text-slate-950 text-[11px] font-extrabold px-3 py-0.5 rounded-full mb-2">
              SERTIFIKAT PENJELAJAH HEBAT PJOK
            </span>
            <h2 className="text-lg md:text-xl font-extrabold text-yellow-300 mb-2">
              Selamat, {playerName}!
            </h2>
            <p className="text-xs md:text-sm text-slate-200 leading-relaxed mb-4">
              Apresiasi luar biasa! Kamu telah menjelajahi <b>Dunia Explore PJOK</b> dan membaca tuntas seluruh <b>{EXPLORE_OBJECTS.length} materi olahraga</b>. Hadiah <b>+350 XP</b> telah ditambahkan ke karaktermu!
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setExploreCompletedModal(false)}
                className="flex-1 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold py-2.5 rounded-xl text-xs"
              >
                🌟 Lanjut Eksplorasi
              </button>
              <button
                onClick={returnToStadiumWorld}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-xl text-xs"
              >
                🏟️ Kembali ke Stadion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panel Mode Guru */}
      {isSpectator && (
        <div className="absolute top-24 right-3 z-10 w-80 max-h-[78vh] overflow-y-auto bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl border border-slate-700 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-2.5">
            <span className="text-xs font-extrabold text-yellow-400 uppercase tracking-wide">
              📊 Panel Guru ({studentList.length} Siswa)
            </span>
            {followedPlayer && (
              <button
                onClick={() => setFollowedPlayerId(null)}
                className="text-[11px] bg-slate-700 hover:bg-slate-600 px-2 py-0.5 rounded font-bold"
              >
                Lepas Kamera
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1.5 bg-slate-800 p-1 rounded-xl mb-3 text-xs font-extrabold">
            <button
              onClick={() => setTeacherTab("leaderboard")}
              className={`py-1.5 rounded-lg transition ${
                teacherTab === "leaderboard"
                  ? "bg-yellow-400 text-slate-950"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              🏆 Peringkat XP
            </button>
            <button
              onClick={() => setTeacherTab("live")}
              className={`py-1.5 rounded-lg transition ${
                teacherTab === "live"
                  ? "bg-yellow-400 text-slate-950"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              📍 Pantau Live
            </button>
          </div>

          {studentList.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">
              Menunggu siswa masuk ke {faseData.nama_fase}...
            </p>
          ) : teacherTab === "leaderboard" ? (
            <div className="space-y-1.5">
              {leaderboardStudents.map((student: any, idx: number) => {
                const stScore = student.score || 0;
                const stCharLvl = student.characterLevel || getCharacterLevelFromXp(stScore);
                const isSelected = summaryStudentId === student.id;
                return (
                  <div
                    key={student.id}
                    className={`flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-xl text-xs transition border ${
                      isSelected
                        ? "bg-yellow-400/20 border-yellow-400 text-white"
                        : "bg-slate-800/90 hover:bg-slate-800 border-slate-700 text-slate-200"
                    }`}
                  >
                    <button
                      onClick={() => {
                        setSummaryStudentId(isSelected ? null : student.id);
                        setFollowedPlayerId(student.id);
                      }}
                      className="flex items-center justify-between flex-1 min-w-0 text-left gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-extrabold shrink-0">
                          {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                        </span>
                        <div className="min-w-0">
                          <p className="font-extrabold truncate">{student.name || "Siswa"}</p>
                          <p className="text-[10px] text-amber-300 font-bold">
                            Lv.{stCharLvl} • {getCharacterTitle(stCharLvl)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="block text-emerald-400 font-extrabold">{stScore} XP</span>
                        <span className="text-[10px] text-sky-300 underline">Rangkuman</span>
                      </div>
                    </button>

                    <button
                      title={`Hapus karakter ${student.name || "Siswa"}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteStudent({
                          id: student.id,
                          name: student.name || "Siswa",
                        });
                      }}
                      className="bg-red-600/85 hover:bg-red-500 text-white px-2 py-1.5 rounded-lg text-[11px] font-bold shrink-0"
                    >
                      🗑️
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1.5">
              {studentList.map((student: any) => {
                const tileOn = getStandingTileLabel(student.pos);
                const isFocused = followedPlayerId === student.id;
                return (
                  <div
                    key={student.id}
                    className={`flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-xl text-xs transition border ${
                      isFocused
                        ? "bg-yellow-400/20 border-yellow-400 text-white"
                        : "bg-slate-800/90 hover:bg-slate-800 border-slate-700 text-slate-200"
                    }`}
                  >
                    <button
                      onClick={() => {
                        setFollowedPlayerId(isFocused ? null : student.id);
                        setSummaryStudentId(student.id);
                      }}
                      className="flex items-center justify-between flex-1 min-w-0 text-left gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          style={{ backgroundColor: student.color || "#3b82f6" }}
                          className="w-3 h-3 rounded-full shrink-0 border border-white"
                        />
                        <span className={`font-bold truncate ${student.isEliminated ? "line-through text-slate-400" : ""}`}>
                          {student.name || "Siswa"}
                        </span>
                      </div>
                      {student.worldMap === "school" ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-teal-600 text-white shrink-0">
                          🏫 Sekolah
                        </span>
                      ) : student.worldMap === "bridge" ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-600 text-white shrink-0">
                          🌉 Jembatan
                        </span>
                      ) : student.worldMap === "explore" ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-sky-600 text-white shrink-0">
                          🌍 Explore
                        </span>
                      ) : student.isEliminated ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-700 text-slate-300 shrink-0">
                          👻 Gugur
                        </span>
                      ) : tileOn ? (
                        <span
                          style={{ backgroundColor: tileOn.color }}
                          className="px-2 py-0.5 rounded text-[10px] font-extrabold text-white shrink-0"
                        >
                          Ubin {tileOn.label}
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-bold shrink-0">
                          ✅ Aktif
                        </span>
                      )}
                    </button>

                    <button
                      title={`Hapus karakter ${student.name || "Siswa"}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteStudent({
                          id: student.id,
                          name: student.name || "Siswa",
                        });
                      }}
                      className="bg-red-600/85 hover:bg-red-500 text-white px-2 py-1.5 rounded-lg text-[11px] font-bold shrink-0"
                    >
                      🗑️
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {summaryStudent && (
            <div className="mt-3 pt-3 border-t border-slate-700 bg-slate-950/90 p-3 rounded-xl border border-sky-500/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-sky-300">
                  📋 Rangkuman: {summaryStudent.name}
                </span>
                <button
                  onClick={() => setSummaryStudentId(null)}
                  className="text-xs text-slate-400 hover:text-white font-bold"
                >
                  ✕
                </button>
              </div>
              {(() => {
                const sScore = summaryStudent.score || 0;
                const sCharLvl = summaryStudent.characterLevel || getCharacterLevelFromXp(sScore);
                const sQuestionLvl = summaryStudent.questionLevel || 1;
                const sCorrect = summaryStudent.correctCount || 0;
                const sExplore = summaryStudent.readExploreCount || 0;
                const sSchool = summaryStudent.completedSchoolCount || 0;
                return (
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Level Karakter:</span>
                      <span className="font-extrabold text-yellow-300">
                        Lv.{sCharLvl} ({getCharacterTitle(sCharLvl)})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total XP Terkumpul:</span>
                      <span className="font-extrabold text-emerald-400">{sScore} XP</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Misi Kelas Sekolah:</span>
                      <span className="font-bold text-teal-300">
                        {sSchool}/{SCHOOL_CLASSROOMS.length} kelas
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tingkat Kesulitan Soal:</span>
                      <span className="font-bold text-amber-300">
                        Lv.{sQuestionLvl} ({LEVEL_NAMES[sQuestionLvl] || "Pemula"})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Kuis Benar:</span>
                      <span className="font-bold text-white">{sCorrect} soal</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Materi Explore Dibaca:</span>
                      <span className="font-bold text-sky-300">
                        {sExplore}/{EXPLORE_OBJECTS.length} materi
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Area Aktif:</span>
                      <span className="font-bold text-purple-300 uppercase">
                        {summaryStudent.worldMap || "stadium"}
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        setConfirmDeleteStudent({
                          id: summaryStudent.id,
                          name: summaryStudent.name || "Siswa",
                        })
                      }
                      className="w-full mt-2 bg-red-600 hover:bg-red-500 text-white font-extrabold py-1.5 rounded-lg text-[11px]"
                    >
                      🗑️ Hapus Karakter Siswa Ini
                    </button>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Panel Soal Mini-Game & Mode Petualangan Eliminasi */}
      {!isSpectator && worldMap === "stadium" && miniGameActive && currentMgQuestion && !podiumModal && (
        <div
          style={{ top: "max(5.8rem, calc(env(safe-area-inset-top) + 5.2rem))" }}
          className={`fixed left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-xl bg-slate-950/85 backdrop-blur-sm text-white px-3 py-2.5 rounded-2xl border-2 shadow-lg pointer-events-auto ${
            gameMode === "adventure" ? "border-purple-400" : "border-yellow-400/90"
          }`}
        >
          <div className="flex flex-wrap justify-between items-center gap-1.5 mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="bg-yellow-400 text-slate-950 text-[11px] font-extrabold px-2 py-0.5 rounded-full">
                ⏱️ {mgTimeLeft}d
              </span>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-400 text-[11px] font-extrabold px-2 py-0.5 rounded-full">
                ⭐ Soal Lv.{questionLevel}
              </span>
              {gameMode === "adventure" && (
                <span className="bg-purple-600 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full">
                  👑 Bertahan: {survivors.length} Siswa
                </span>
              )}
              <span className="bg-slate-800/90 text-sky-300 text-[11px] font-bold px-2 py-0.5 rounded-full border border-slate-600">
                {isEliminated
                  ? "👻 Penonton"
                  : standingTile !== null
                  ? `📍 Ubin ${ARENA_TILES[standingTile].label}`
                  : "📍 Di Tengah"}
              </span>
            </div>
            <button
              onClick={stopMiniGame}
              className="bg-red-600 hover:bg-red-500 text-[11px] px-2 py-0.5 rounded font-bold shrink-0"
            >
              {gameMode === "practice" && practiceRounds > 0 ? "Selesai & Podium" : "Keluar"}
            </button>
          </div>

          <div className="text-center mb-1">
            <span className="text-[10px] uppercase tracking-wider text-amber-300 font-bold">
              📚 Materi: {currentMgQuestion.sumberGedung} • {mgStatusText}
            </span>
          </div>

          <p className="font-bold text-xs md:text-sm mb-2 text-center leading-snug">
            {currentMgQuestion.pertanyaan}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] md:text-xs font-bold">
            {currentMgQuestion.pilihan.map((opsi: string, i: number) => (
              <div
                key={i}
                style={{ backgroundColor: ARENA_TILES[i]?.color || "#334155" }}
                className={`px-2.5 py-1.5 rounded-lg text-white shadow flex items-start gap-1.5 leading-snug ${
                  !isEliminated && standingTile === i ? "ring-2 ring-white scale-[1.01]" : "opacity-95"
                }`}
              >
                <span className="bg-black/40 px-1.5 py-0.5 rounded font-extrabold shrink-0">
                  {ARENA_TILES[i]?.label}
                </span>
                <span className="break-words">{opsi}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kontrol Layar Sentuh Mode Portrait */}
      {!isSpectator &&
        !showModal &&
        !selectedExploreModal &&
        !activeClassroomModal &&
        !podiumModal &&
        !exploreCompletedModal &&
        !schoolGraduatedModal && (
          <>
            <div
              style={{
                bottom: "max(1.5rem, env(safe-area-inset-bottom))",
                left: "max(1.25rem, env(safe-area-inset-left))",
              }}
              className="absolute z-10"
            >
              <VirtualJoystick onMove={setJoyVector} />
            </div>

            <div
              style={{
                bottom: "max(1.75rem, env(safe-area-inset-bottom))",
                right: "max(1.25rem, env(safe-area-inset-right))",
              }}
              className="absolute z-10"
            >
              <button
                onPointerDown={() => setJumpTrigger((n) => n + 1)}
                className="w-20 h-20 rounded-full bg-emerald-500/90 active:bg-emerald-400 border-4 border-white text-slate-950 font-extrabold text-sm shadow-xl touch-none"
              >
                LOMPAT
              </button>
            </div>
          </>
        )}

      {/* Tombol Portal 1 (Kanan): Arena Jatuh Bangun */}
      {!isSpectator && worldMap === "stadium" && nearPortal && !miniGameActive && !showModal && (
        <div className="absolute bottom-36 left-1/2 -translate-x-1/2 z-10 w-[85%] max-w-xs text-center">
          <button
            onClick={startPracticeMiniGame}
            className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold px-4 py-3 rounded-full shadow-2xl border-2 border-white animate-bounce text-xs md:text-sm"
          >
            🏆 Mulai Arena Jatuh Bangun (5 Ronde)!
          </button>
        </div>
      )}

      {/* Tombol Portal 2 (Kiri): Mode Petualangan Eliminasi */}
      {!isSpectator && worldMap === "stadium" && nearAdventurePortal && !miniGameActive && !showModal && (
        <div className="absolute bottom-36 left-1/2 -translate-x-1/2 z-10 w-[88%] max-w-xs text-center">
          <button
            onClick={triggerGlobalAdventure}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-extrabold px-4 py-3 rounded-full shadow-2xl border-2 border-yellow-300 animate-bounce text-xs md:text-sm"
          >
            👑 Mulai Petualangan Eliminasi (Juara 1-3)!
          </button>
        </div>
      )}

      {/* Tombol Portal 3 (Belakang Tengah): Masuk ke Dunia Explore PJOK */}
      {!isSpectator && worldMap === "stadium" && nearExplorePortal && !miniGameActive && !showModal && (
        <div className="absolute bottom-36 left-1/2 -translate-x-1/2 z-10 w-[88%] max-w-xs text-center">
          <button
            onClick={enterExploreWorld}
            className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold px-4 py-3 rounded-full shadow-2xl border-2 border-white animate-bounce text-xs md:text-sm"
          >
            🌍 Masuk ke Dunia Explore PJOK!
          </button>
        </div>
      )}

      {/* Tombol Portal 4 (Depan Arena): Masuk ke Jembatan Juara 20 Level */}
      {!isSpectator && worldMap === "stadium" && nearBridgePortal && !miniGameActive && !showModal && (
        <div className="absolute bottom-36 left-1/2 -translate-x-1/2 z-10 w-[88%] max-w-xs text-center">
          <button
            onClick={() => enterBridgeWorld(false)}
            className="w-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold px-4 py-3 rounded-full shadow-2xl border-2 border-white animate-bounce text-xs md:text-sm"
          >
            🌉 Masuk Ruang Start Jembatan Juara!
          </button>
        </div>
      )}

      {/* Tombol Kembali ke Stadion Utama */}
      {!isSpectator &&
        worldMap !== "stadium" &&
        nearReturnPortal &&
        !selectedExploreModal &&
        !activeClassroomModal && (
          <div className="absolute bottom-36 left-1/2 -translate-x-1/2 z-10 w-[88%] max-w-xs text-center">
            <button
              onClick={returnToStadiumWorld}
              className="w-full bg-orange-500 hover:bg-orange-400 text-slate-950 font-extrabold px-4 py-3 rounded-full shadow-2xl border-2 border-white animate-bounce text-xs md:text-sm"
            >
              {worldMap === "school"
                ? "🚪 Keluar ke Lapangan Sekolah"
                : "🏟️ Kembali ke Stadion Utama"}
            </button>
          </div>
        )}

      {/* Tombol di Dunia Explore PJOK: Dekat Benda Olahraga */}
      {!isSpectator && worldMap === "explore" && nearbyExploreObj && !selectedExploreModal && (
        <div className="absolute bottom-36 left-1/2 -translate-x-1/2 z-10 w-[88%] max-w-xs text-center">
          <button
            onClick={() => openExploreObjectMaterial(nearbyExploreObj)}
            className="w-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold px-4 py-3 rounded-full shadow-2xl border-2 border-white animate-bounce text-xs md:text-sm"
          >
            {nearbyExploreObj.ikon} Pelajari: {nearbyExploreObj.nama}
          </button>
        </div>
      )}

      {/* Modal Kartu 1 Materi PJOK saat Mendekati Objek Benda di Dunia Explore */}
      {!isSpectator && selectedExploreModal && (
        <div className="fixed inset-0 z-30 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white border-2 border-sky-400 rounded-3xl p-5 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-start border-b border-slate-700 pb-3 mb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-3xl bg-slate-800 p-2 rounded-2xl border border-slate-700">
                  {selectedExploreModal.ikon}
                </span>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-400">
                    {selectedExploreModal.kategori}
                  </span>
                  <h3 className="text-base md:text-lg font-extrabold text-yellow-300">
                    {selectedExploreModal.nama}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedExploreModal(null)}
                className="text-slate-400 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-extrabold text-emerald-400">
                  📖 Materi PJOK (+50 XP) • {readExploreIds.length}/{EXPLORE_OBJECTS.length} Selesai
                </span>
                <button
                  onClick={() => speakText(selectedExploreModal.materi)}
                  className="bg-sky-600 hover:bg-sky-500 text-white text-xs px-3 py-1 rounded-full font-bold"
                >
                  🔊 Bacakan Materi
                </button>
              </div>
              <p className="text-xs md:text-sm text-slate-200 leading-relaxed">
                {selectedExploreModal.materi}
              </p>
            </div>

            <button
              onClick={() => setSelectedExploreModal(null)}
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-extrabold py-2.5 rounded-xl text-xs md:text-sm"
            >
              ✅ Selesai Membaca & Lanjut Menjelajah
            </button>
          </div>
        </div>
      )}

      {!isSpectator && worldMap === "stadium" && nearCoach && !miniGameActive && !showModal && (
        <div
          style={{ top: "max(5.8rem, calc(env(safe-area-inset-top) + 5.2rem))" }}
          className="fixed left-1/2 -translate-x-1/2 z-10 w-[92%] max-w-lg bg-slate-900/95 text-white p-3.5 rounded-2xl border-2 border-yellow-400 shadow-2xl"
        >
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-yellow-400 text-sm md:text-base">🧢 {pjokData.npc_utama.nama}</span>
            <button
              onClick={() => speakText(pjokData.npc_utama.dialog_awal)}
              className="bg-blue-600 hover:bg-blue-500 text-xs px-3 py-1 rounded-full font-semibold"
            >
              🔊 Suara Coach
            </button>
          </div>
          <p className="text-xs md:text-sm leading-relaxed">{pjokData.npc_utama.dialog_awal}</p>
          <p className="text-xs text-emerald-400 mt-1 font-medium">
            🎖️ Karakter {playerName}: Level {characterLevel} ({characterTitle}) • {score} XP • Soal Lv.{questionLevel}
          </p>
        </div>
      )}

      {!isSpectator && worldMap === "stadium" && activeBuilding && !miniGameActive && !showModal && (
        <div className="absolute bottom-36 left-1/2 -translate-x-1/2 z-10 w-[85%] max-w-xs text-center">
          <button
            onClick={openBuildingQuiz}
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-extrabold px-4 py-3 rounded-full shadow-2xl border-2 border-white animate-bounce text-xs md:text-sm"
          >
            🚪 Masuk: {activeBuilding.nama_gedung} (Lv.{questionLevel})
          </button>
        </div>
      )}

      {!isSpectator && showModal && activeBuilding && activeQuizList && (
        <div className="absolute inset-0 z-20 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 max-w-2xl w-full rounded-2xl p-5 shadow-2xl max-h-[88dvh] overflow-y-auto">
            <div className="flex justify-between items-start border-b pb-3 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg md:text-xl font-extrabold text-blue-700">{activeBuilding.nama_gedung}</h2>
                  <span className="bg-amber-400 text-slate-950 text-[11px] font-extrabold px-2 py-0.5 rounded-full">
                    ⭐ Soal Lv.{questionLevel} ({LEVEL_NAMES[questionLevel]})
                  </span>
                </div>
                <p className="text-xs md:text-sm font-semibold text-slate-500">{activeBuilding.topik}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-red-600 font-bold text-xl">
                ✕
              </button>
            </div>

            <div className="bg-blue-50 p-3.5 rounded-xl mb-4 border border-blue-200">
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-bold text-blue-900 text-sm">📖 Ringkasan Materi</span>
                <button
                  onClick={() => speakText(activeBuilding.ringkasan_materi)}
                  className="bg-blue-600 text-white text-xs px-3 py-1 rounded-lg font-semibold hover:bg-blue-500"
                >
                  🔊 Bacakan Materi
                </button>
              </div>
              <p className="text-xs md:text-sm text-slate-700 leading-relaxed">{activeBuilding.ringkasan_materi}</p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs font-bold uppercase text-emerald-600">
                  Kuis PJOK ({quizIndex + 1} dari {activeQuizList.length})
                </p>
                <span className="text-[11px] font-bold text-amber-600">
                  Progres Naik Level Soal: {nextLevelProgress}/3 benar
                </span>
              </div>
              <h3 className="font-bold text-sm md:text-base mb-2.5">{activeQuizList[quizIndex].pertanyaan}</h3>
              <div className="grid grid-cols-1 gap-2">
                {activeQuizList[quizIndex].pilihan.map((opsi: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    disabled={feedback !== null}
                    className="text-left px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-amber-50 hover:border-amber-400 font-medium text-xs md:text-sm transition"
                  >
                    {String.fromCharCode(65 + i)}. {opsi}
                  </button>
                ))}
              </div>

              {feedback && (
                <div className="mt-3 p-3 rounded-xl bg-slate-100 border border-slate-300 flex justify-between items-center gap-3">
                  <p className="text-xs md:text-sm font-semibold">{feedback}</p>
                  <button
                    onClick={nextQuestion}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold shrink-0"
                  >
                    {quizIndex + 1 < activeQuizList.length ? "Soal Berikutnya →" : "Selesai"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Area 3D dengan dukungan Sentuh / Mouse Drag untuk Memutar Kamera */}
      <div
        onPointerDown={(e) => {
          cameraDragRef.current = {
            active: true,
            lastX: e.clientX,
            lastY: e.clientY,
            pointerId: e.pointerId,
          };
        }}
        onPointerMove={(e) => {
          if (!cameraDragRef.current.active) return;
          const dx = e.clientX - cameraDragRef.current.lastX;
          const dy = e.clientY - cameraDragRef.current.lastY;
          cameraDragRef.current.lastX = e.clientX;
          cameraDragRef.current.lastY = e.clientY;
          adjustCameraOrbit(-dx * 0.008, dy * 0.006, 0);
        }}
        onPointerUp={() => {
          cameraDragRef.current.active = false;
        }}
        onPointerCancel={() => {
          cameraDragRef.current.active = false;
        }}
        className="w-full h-full touch-none cursor-grab active:cursor-grabbing"
      >
        <Canvas shadows camera={{ position: [0, 18, 26], fov: 60 }}>
          <Sky sunPosition={worldMap === "explore" ? [60, 50, 80] : [100, 30, 100]} />
          <ambientLight intensity={0.65} />
          <directionalLight position={[15, 25, 15]} intensity={1.2} castShadow />
          <Environment preset="park" />

          {worldMap === "stadium" || isSpectator ? (
            <>
              <SportsEnvironment faseId={faseData.id} nearPakLukman={nearPakLukman} />

              {ARENA_TILES.map((tile) => (
                <ArenaFloorTile key={tile.id} tile={tile} isFallen={isTileFallen(tile.id)} />
              ))}

              <group position={[0, 0, -4]}>
                <VoxelCharacter shirtColor="#2563eb" pantsColor="#0f172a" isMoving={false} isCoach={true} />
                <Text position={[0, 3.45, 0]} fontSize={0.45} color="#facc15" outlineWidth={0.06} outlineColor="black">
                  {nearCoach ? "💬 Coach Resky" : "❗ Coach Resky"}
                </Text>
              </group>

              {faseData.gedung_materi.map((gedung: any, index: number) => (
                <group key={gedung.id} position={gedung.posisi_3d}>
                  <mesh position={[0, 2.5, 0]} castShadow>
                    <boxGeometry args={[5.5, 5, 5.5]} />
                    <meshStandardMaterial color={BUILDING_COLORS[index % BUILDING_COLORS.length]} />
                  </mesh>
                  <mesh position={[0, 5.3, 0]} castShadow>
                    <boxGeometry args={[6.1, 0.6, 6.1]} />
                    <meshStandardMaterial color="#1e293b" />
                  </mesh>
                  <mesh position={[0, 1.3, 2.8]}>
                    <boxGeometry args={[1.6, 2.6, 0.2]} />
                    <meshStandardMaterial color="#facc15" />
                  </mesh>
                  <Text position={[0, 6.3, 0]} fontSize={0.55} color="white" outlineWidth={0.07} outlineColor="black">
                    {gedung.nama_gedung}
                  </Text>
                </group>
              ))}
            </>
          ) : worldMap === "explore" ? (
            <ExploreWorldEnvironment readIds={readExploreIds} />
          ) : worldMap === "school" ? (
            <SchoolInteriorEnvironment completedClassIds={completedClassIds} />
          ) : (
            <ChampionBridgeEnvironment raceStarted={bridgeRaceStarted} />
          )}

          {isSpectator ? (
            <SpectatorCameraController
              preset={cameraPreset}
              followedPlayer={followedPlayer}
              cameraOrbitRef={cameraOrbitRef}
            />
          ) : (
            <Player
              playerName={playerName}
              avatarPreset={avatarPreset}
              characterLevel={characterLevel}
              questionLevel={questionLevel}
              score={score}
              correctCount={correctCount}
              readExploreCount={readExploreIds.length}
              completedSchoolCount={completedClassIds.length}
              isEliminated={isEliminated}
              bridgeRaceStarted={bridgeRaceStarted}
              worldMap={worldMap}
              socketRef={socketRef}
              joyVector={joyVector}
              jumpTrigger={jumpTrigger}
              teleportTrigger={teleportTrigger}
              cameraOrbitRef={cameraOrbitRef}
              onInteractBuilding={setActiveBuilding}
              onNearCoach={setNearCoach}
              onNearPakLukman={setNearPakLukman}
              onNearSchoolDoor={setNearSchoolDoor}
              onNearPortal={setNearPortal}
              onNearAdventurePortal={setNearAdventurePortal}
              onNearExplorePortal={setNearExplorePortal}
              onNearBridgePortal={setNearBridgePortal}
              onNearReturnPortal={setNearReturnPortal}
              onNearExploreObject={setNearbyExploreObj}
              onNearClassroom={setNearbyClassroom}
              onBridgeLevelChange={setBridgeLevel}
              onBridgeFall={handleBridgeFall}
              onBridgeFinish={handleBridgeFinish}
              onStandingTileChange={setStandingTile}
              gedungList={faseData.gedung_materi}
              isTileFallen={isTileFallen}
              isMiniGame={miniGameActive}
            />
          )}

          {visibleRemotePlayers.map((p: any) => (
            <RemotePlayer
              key={p.id}
              data={p}
              isHighlighted={isSpectator && followedPlayerId === p.id}
            />
          ))}
        </Canvas>
      </div>
    </div>
  );
}