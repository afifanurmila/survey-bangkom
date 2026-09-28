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
      sme_domains: ["Manajemen Kebijakan", "Inovasi Administrasi Negara"],
      sme_domain_codes: ["B", "G"],
      sme_subtopics: [
        "Riset kebijakan / Analisis kebijakan",
        "Policy Impact assessment",
        "Design Thinking",
        "Public Sector Innovation"
      ],
      bentuk_pengembangan: ["Pelatihan", "Workshop", "Sharing knowledge"],
      topik_prioritas: ["Riset kebijakan / Analisis kebijakan", "Policy Impact assessment", "Design Thinking"],
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
      sme_domains: ["Manajemen Kebijakan", "Hukum Administrasi Negara"],
      sme_domain_codes: ["B", "F"],
      sme_subtopics: [
        "Perumusan kebijakan publik",
        "Legal Drafting",
        "Regulatory Impact Assessment (RIA, ROCCIPI, AHP, dll)"
      ],
      bentuk_pengembangan: ["Mentoring", "Praktik/studi kasus", "Coaching"],
      topik_prioritas: ["Perumusan kebijakan publik", "Legal Drafting", "Regulatory Impact Assessment (RIA, ROCCIPI, AHP, dll)"],
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
      unit: "Direktorat Penguatan Kapasitas Jabatan Fungsional Bidang Pengembangan Kapasitas dan Pembelajaran Aparatur Sipil Negara",
      jabatan: "Administrator / Pengawas : Pejabat Pengelola Unit",
      jenjang: "Tidak Berlaku / Bukan Pejabat Fungsional",
      masa_kerja: "> 5 tahun",
      instrument_version: 2,
      scores: DEFAULT_CONFIG.competencies.map((c, i) => {
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
      sme_domains: ["Kepemimpinan", "Tata Kelola Organisasi, Manajemen Kinerja, Pengadaan Barjas, Perencanaan Anggaran"],
      sme_domain_codes: ["D", "H"],
      sme_subtopics: [
        "Digital Leadership",
        "Kepemimpinan Transformasional",
        "Manajemen Risiko",
        "Data governance"
      ],
      bentuk_pengembangan: ["Sharing knowledge", "Bedah buku", "Workshop"],
      topik_prioritas: ["Digital Leadership", "Manajemen Risiko", "Data governance"],
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
      unit: "Kedeputian Bidang Peningkatan Kualitas Kebijakan Administrasi Negara",
      jabatan: "Pelaksana : Pengolah data, Pengadministrasi, Pengelola Layanan, dll.",
      jenjang: "Tidak Berlaku / Bukan Pejabat Fungsional",
      masa_kerja: "1 – 3 tahun",
      instrument_version: 2,
      scores: DEFAULT_CONFIG.competencies.map((c, i) => {
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
      sme_domains: ["Pengembangan Kompetensi", "Manajemen ASN"],
      sme_domain_codes: ["E", "C"],
      sme_subtopics: [
        "Corporate University",
        "Analisis Pengembangan Kompetensi",
        "Human Capital Development Plan (HCDP)"
      ],
      bentuk_pengembangan: ["Pelatihan", "Workshop", "Praktik/studi kasus"],
      topik_prioritas: ["Corporate University", "Analisis Pengembangan Kompetensi"],
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
      sme_domains: ["Kelembagaan Organisasi Pemerintah", "Inovasi Administrasi Negara"],
      sme_domain_codes: ["A", "G"],
      sme_subtopics: [
        "Desain organisasi modern & adaptive governance",
        "Public Sector Innovation",
        "Co-creation & collaborative innovation"
      ],
      bentuk_pengembangan: ["Mentoring", "Coaching", "Sharing knowledge"],
      topik_prioritas: ["Desain organisasi modern & adaptive governance", "Public Sector Innovation"],
      metode_pembelajaran: "Pendampingan/coaching",
      kompetensi_lain: "Penyusunan kurikulum bangkom jabatan fungsional.",
    },
  },
];
