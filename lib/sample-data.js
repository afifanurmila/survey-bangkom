import { DEFAULT_CONFIG } from "./default-config";

export const SAMPLE_RESPONSES = [
  {
    id: 1,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    response: {
      nama: "Budi Pratama, S.STP., M.A.P.",
      nip: "198803122010121002",
      unit: "Direktorat Strategi Peningkatan Kualitas Kebijakan Administrasi Negara",
      jabatan: "Fungsional : Widyaiswara, Analis Kebijakan, Perencana, Arsiparis, dll.",
      jenjang: "Ahli Muda / Mahir",
      masa_kerja: "3 – 5 tahun",
      instrument_version: 2,
      scores: DEFAULT_CONFIG.competencies.map((c, i) => {
        // High need in Policy & AI, medium mastery
        const isPolicyOrAI = c.pilar.includes("Kebijakan") || c.title.includes("AI") || c.pilar.includes("Bangkom");
        const penguasaan = isPolicyOrAI ? 2 + (i % 2) : 3 + (i % 3);
        const kebutuhan = isPolicyOrAI ? 5 : 3 + (i % 2);
        return {
          id: c.id,
          kode: c.code || c.id,
          kelompok: c.pilar,
          kompetensi: c.title,
          penguasaan,
          kebutuhan,
          gap: kebutuhan - penguasaan,
        };
      }),
      bentuk_pengembangan: ["Pelatihan", "Workshop", "Sharing knowledge"],
      topik_prioritas: ["Analisis kebijakan", "Quality control", "Inovasi"],
      metode_pembelajaran: "Blended/hybrid",
      kompetensi_lain: "Perlu pelatihan advanced policy analytics dan legal drafting berbasis AI.",
    },
  },
  {
    id: 2,
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    response: {
      nama: "Siti Rahmawati, S.Sos., M.Si.",
      nip: "199207152015032001",
      unit: "Direktorat Advokasi dan Pengembangan Kinerja Kebijakan",
      jabatan: "Fungsional : Widyaiswara, Analis Kebijakan, Perencana, Arsiparis, dll.",
      jenjang: "Ahli Pertama / Terampil",
      masa_kerja: "1 – 3 tahun",
      instrument_version: 2,
      scores: DEFAULT_CONFIG.competencies.map((c, i) => {
        // High need in Research, Stakeholder, Innovation
        const isHighNeed = c.pilar.includes("Inovasi") || c.pilar.includes("Hukum") || c.title.includes("riset");
        const penguasaan = isHighNeed ? 2 : 3 + (i % 2);
        const kebutuhan = isHighNeed ? 5 : 4;
        return {
          id: c.id,
          kode: c.code || c.id,
          kelompok: c.pilar,
          kompetensi: c.title,
          penguasaan,
          kebutuhan,
          gap: kebutuhan - penguasaan,
        };
      }),
      bentuk_pengembangan: ["Mentoring", "Praktik/studi kasus", "Coaching"],
      topik_prioritas: ["Riset/metodologi", "Kolaborasi dan stakeholder", "Publikasi"],
      metode_pembelajaran: "Praktik langsung/studi kasus",
      kompetensi_lain: "Pendampingan penyusunan policy paper untuk advokasi lintas K/L.",
    },
  },
  {
    id: 3,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    response: {
      nama: "Drs. Hendra Gunawan, M.M.",
      nip: "197504201999031001",
      unit: "Direktorat Penguatan Kapasitas Jabatan Fungsional",
      jabatan: "Administrator / Pengawas : Pejabat Pengelola Unit",
      jenjang: "Tidak Berlaku / Bukan Pejabat Fungsional",
      masa_kerja: "> 5 tahun",
      instrument_version: 2,
      scores: DEFAULT_CONFIG.competencies.map((c, i) => {
        // High mastery, focuses on Leadership and Corporate University
        const isLead = c.pilar.includes("Kepemimpinan") || c.pilar.includes("Tata Kelola");
        const penguasaan = isLead ? 4 + (i % 2) : 3 + (i % 2);
        const kebutuhan = isLead ? 5 : 3;
        return {
          id: c.id,
          kode: c.code || c.id,
          kelompok: c.pilar,
          kompetensi: c.title,
          penguasaan,
          kebutuhan,
          gap: kebutuhan - penguasaan,
        };
      }),
      bentuk_pengembangan: ["Sharing knowledge", "Bedah buku", "Workshop"],
      topik_prioritas: ["Manajemen pengetahuan", "Analisis kebijakan", "Inovasi"],
      metode_pembelajaran: "Tatap muka",
      kompetensi_lain: "Pengembangan ekosistem Corporate University LAN RI.",
    },
  },
  {
    id: 4,
    created_at: new Date(Date.now() - 3600000 * 30).toISOString(),
    response: {
      nama: "Dewi Lestari, S.E., M.E.",
      nip: "199511082019022003",
      unit: "Bagian Tata Usaha / Sekretariat Deputi I",
      jabatan: "Pelaksana : Pengolah data, Pengadministrasi, Pengelola Layanan, dll.",
      jenjang: "Tidak Berlaku / Bukan Pejabat Fungsional",
      masa_kerja: "1 – 3 tahun",
      instrument_version: 2,
      scores: DEFAULT_CONFIG.competencies.map((c, i) => {
        // Focus on Data governance, Budgeting, Digital
        const isData = c.pilar.includes("Tata Kelola") || c.title.includes("data") || c.title.includes("digital");
        const penguasaan = isData ? 2 + (i % 2) : 3;
        const kebutuhan = isData ? 5 : 4;
        return {
          id: c.id,
          kode: c.code || c.id,
          kelompok: c.pilar,
          kompetensi: c.title,
          penguasaan,
          kebutuhan,
          gap: kebutuhan - penguasaan,
        };
      }),
      bentuk_pengembangan: ["Pelatihan", "Workshop", "Praktik/studi kasus"],
      topik_prioritas: ["Quality control", "Konten pembelajaran", "Manajemen pengetahuan"],
      metode_pembelajaran: "Daring",
      kompetensi_lain: "Penguasaan dashboarding dan visualisasi data penganggaran.",
    },
  },
  {
    id: 5,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    response: {
      nama: "Ahmad Fauzi, S.IP., M.P.A.",
      nip: "198309142008011003",
      unit: "Direktorat Strategi Peningkatan Kualitas Kebijakan Administrasi Negara",
      jabatan: "Fungsional : Widyaiswara, Analis Kebijakan, Perencana, Arsiparis, dll.",
      jenjang: "Ahli Madya / Penyelia",
      masa_kerja: "> 5 tahun",
      instrument_version: 2,
      scores: DEFAULT_CONFIG.competencies.map((c, i) => {
        const isSpecial = c.pilar.includes("ASN") || c.pilar.includes("Inovasi");
        const penguasaan = isSpecial ? 3 + (i % 2) : 4;
        const kebutuhan = isSpecial ? 5 : 4;
        return {
          id: c.id,
          kode: c.code || c.id,
          kelompok: c.pilar,
          kompetensi: c.title,
          penguasaan,
          kebutuhan,
          gap: kebutuhan - penguasaan,
        };
      }),
      bentuk_pengembangan: ["Mentoring", "Coaching", "Sharing knowledge"],
      topik_prioritas: ["Inovasi", "Analisis kebijakan", "Riset/metodologi"],
      metode_pembelajaran: "Pendampingan/coaching",
      kompetensi_lain: "Penyusunan kurikulum bangkom jabatan fungsional.",
    },
  },
];
