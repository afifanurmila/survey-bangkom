const aspects = [
  ["A", "Kelembagaan Organisasi Pemerintah", "Kemampuan merancang, mengevaluasi, dan mengelola kelembagaan organisasi pemerintah yang adaptif.", [
    "Mampu menerjemahkan strategi instansi ke dalam tata kerja dan struktur organisasi yang modern dan lincah (adaptive governance).",
    "Mampu mengintegrasikan pemanfaatan ruang kerja dan teknologi digital ke dalam pengembangan kelembagaan (digital organization development).",
    "Mampu merencanakan dan memandu proses manajemen perubahan (change management) untuk memastikan inisiatif reformasi birokrasi berjalan dengan baik.",
    "Mampu menyusun instrumen dan melakukan pemantauan serta evaluasi terhadap efektivitas kelembagaan.",
    "Mampu menyusun rekomendasi penataan kelembagaan atau penyempurnaan struktur berdasarkan hasil evaluasi dan kebutuhan instansi.",
  ]],
  ["B", "Manajemen Kebijakan", "Kemampuan melakukan riset, merumuskan, mengevaluasi, serta mengomunikasikan kebijakan publik secara efektif.", [
    "Mampu melakukan riset, mengumpulkan data berbasis bukti, dan menyusun rumusan/naskah kebijakan (seperti policy brief atau policy paper).",
    "Mampu merancang instrumen dan melakukan penilaian dampak (policy impact assessment) serta monitoring dan evaluasi terhadap suatu kebijakan.",
    "Mampu mengevaluasi kualitas produk kebijakan, termasuk menggunakan instrumen seperti Indeks Kualitas Kebijakan (IKK) untuk perbaikan berkelanjutan.",
    "Mampu merancang dan memfasilitasi proses konsultasi publik serta pelibatan pemangku kepentingan (stakeholder engagement) dalam siklus kebijakan.",
    "Mampu menyusun strategi komunikasi dan melakukan advokasi kebijakan kepada berbagai pihak agar kebijakan dapat dipahami dan didukung.",
  ]],
  ["C", "Manajemen ASN", "Kemampuan menganalisis kebijakan SDM, mengelola talenta, dan merencanakan pengembangan kompetensi ASN.", [
    "Mampu melakukan riset dan analisis kebijakan yang secara khusus berfokus pada isu-isu manajemen Aparatur Sipil Negara (ASN).",
    "Mampu memetakan profil pegawai dan merancang sistem manajemen talenta (talent management) untuk mendukung pengembangan karier.",
    "Mampu menyusun dokumen perencanaan strategis pengembangan SDM, seperti Human Capital Development Plan (HCDP).",
    "Mampu melakukan analisis kebutuhan pengembangan kompetensi (Training Needs Assessment) berdasarkan identifikasi gap kinerja pegawai.",
    "Mampu memberikan rekomendasi penyelesaian masalah terkait pengelolaan SDM dan peningkatan profesionalisme ASN berbasis data.",
  ]],
  ["D", "Kepemimpinan", "Kemampuan merancang program pelatihan kepemimpinan serta menerapkan gaya kepemimpinan yang adaptif, transformasional, dan memberdayakan.", [
    "Mampu merancang kurikulum dan materi pelatihan kepemimpinan sektor publik yang relevan dengan tantangan birokrasi saat ini.",
    "Mampu mengevaluasi tingkat keberhasilan, efektivitas, dan dampak dari pelaksanaan suatu program pelatihan kepemimpinan.",
    "Mampu menerapkan prinsip kepemimpinan transformasional dan memimpin tim kerja secara efektif di era digital (digital leadership).",
    "Mampu melakukan praktik bimbingan (coaching) dan pendampingan (mentoring) untuk membantu pengembangan karier dan kinerja bawahan atau rekan kerja.",
    "Mampu mengidentifikasi isu-isu strategis terkait kepemimpinan sektor publik dan menyusun rekomendasi kebijakan untuk pengembangannya.",
  ]],
  ["E", "Pengembangan Kompetensi (Bangkom)", "Kemampuan merancang kurikulum pembelajaran, mengembangkan Corporate University, dan mengelola pengetahuan organisasi (Knowledge Management).", [
    "Mampu merancang desain kurikulum dan metode pembelajaran yang sesuai dengan kebutuhan pengembangan kompetensi pegawai.",
    "Mampu menyusun dan memproduksi materi pembelajaran (termasuk modul digital, infografis, atau microlearning) yang menarik dan mudah dipahami.",
    "Mampu mendokumentasikan, mengelola, dan memfasilitasi proses berbagi pengetahuan (knowledge sharing) antardepartemen atau antarpegawai.",
    "Mampu memahami konsep dan mendukung implementasi Corporate University sebagai strategi pembelajaran yang selaras dengan tujuan instansi.",
    "Mampu mengevaluasi efektivitas pelaksanaan program pengembangan kompetensi terhadap peningkatan kinerja dan pencapaian target organisasi.",
  ]],
  ["F", "Hukum Administrasi Negara", "Kemampuan menyusun, menganalisis dampak regulasi, dan memanfaatkan teknologi untuk kajian Hukum Administrasi Negara.", [
    "Mampu menyusun naskah akademik, draf peraturan, atau instrumen hukum lainnya (Legal Drafting) sesuai dengan kaidah perundang-undangan.",
    "Mampu menggunakan metode analisis (seperti RIA, ROCCIPI, atau AHP) untuk memproyeksikan dan menilai dampak dari suatu draf regulasi sebelum disahkan.",
    "Mampu menelaah, melakukan riset kebijakan, dan menyusun rekomendasi penyelesaian yang berkaitan dengan sengketa administrasi negara.",
    "Mampu menggunakan Artificial Intelligence (AI) generatif atau analisis data untuk mencari, membandingkan, dan merangkum keterkaitan antarregulasi secara cepat dan tepat.",
    "Mampu mengevaluasi keandalan informasi regulasi yang dihasilkan oleh AI serta memanfaatkannya dengan aman dan bertanggung jawab.",
  ]],
  ["G", "Inovasi Administrasi Negara", "Kemampuan merancang, menguji, dan memfasilitasi inovasi pelayanan publik melalui pendekatan kolaboratif (Co-creation dan Design Thinking).", [
    "Mampu mengidentifikasi akar permasalahan dalam tata kelola pemerintahan yang membutuhkan pemecahan masalah secara kreatif dan inovatif.",
    "Mampu menerapkan metode Design Thinking untuk memetakan kebutuhan pengguna dan merancang solusi inovatif yang tepat sasaran.",
    "Mampu membangun kerja sama kolaboratif (co-creation) dengan instansi atau pihak eksternal untuk mengembangkan program inovasi bersama.",
    "Mampu merancang strategi komunikasi atau pemasaran program inovasi sektor publik agar dapat diterima dan dirasakan manfaatnya oleh masyarakat luas.",
    "Mampu mengevaluasi hasil, efektivitas, dan dampak jangka panjang dari penerapan suatu program atau kebijakan inovatif.",
  ]],
  ["H", "Tata Kelola Organisasi, Manajemen Kinerja, Pengadaan Barang dan Jasa, serta Perencanaan Anggaran", "Kemampuan mengelola tata kelola organisasi, perencanaan anggaran berbasis kinerja, manajemen risiko, dan tata kelola data (Data Governance).", [
    "Mampu menyusun rencana program dan penganggaran yang selaras dengan pencapaian target kinerja organisasi.",
    "Mampu memahami dan mengikuti aturan serta proses pengadaan barang dan jasa pemerintah secara transparan dan akuntabel.",
    "Mampu mengidentifikasi, memetakan, dan menyusun mitigasi risiko terhadap pelaksanaan program atau kegiatan instansi.",
    "Mampu mengelola, mengolah, dan menjaga tata kelola data (data governance) untuk memastikan validitas informasi pendukung kebijakan.",
    "Mampu menerapkan prinsip-prinsip manajemen strategis untuk mengoptimalkan kinerja unit kerja secara keseluruhan.",
  ]],
];

export const DEFAULT_CONFIG = {
  instrumentVersion: 2,
  surveyTitle: "Survei Kebutuhan Pengembangan Kompetensi Pegawai Deputi I LAN RI",
  intro: "Survei ini bertujuan memetakan kesenjangan kompetensi dan kebutuhan pengembangan pegawai Deputi I LAN RI pada delapan aspek kompetensi yang mendukung usulan Bangkom Subject Matter Expert (SME). Hasilnya digunakan untuk mengidentifikasi prioritas pengembangan kompetensi.",
  competencies: aspects.flatMap(([code, pilar, description, statements]) => statements.map((title, i) => ({ id: `${code}${i + 1}`, code: `${code}${i + 1}`, pilar, description, title }))),
  developmentFormats: [
    {
      value: "Sesi Sharing Knowledge & Diskusi Pakar",
      label: "Sesi Sharing Knowledge & Diskusi Pakar",
      description: "Diskusi santai untuk membedah isu aktual atau regulasi baru bersama SME internal.",
    },
    {
      value: "Bedah Buku / Literature Review Terkini",
      label: "Bedah Buku / Literature Review Terkini",
      description: "Membahas buku rujukan kebijakan dan administrasi negara terbaru.",
    },
    {
      value: "Klinik Coaching & Mentoring Intensif",
      label: "Klinik Coaching & Mentoring Intensif",
      description: "Pendampingan teknis intensif satu per satu atau tim kerja untuk topik spesifik.",
    },
    {
      value: "Klinik Quality Control (QC) & Review Naskah",
      label: "Klinik Quality Control (QC) & Review Naskah",
      description: "Praktik membedah draf policy paper atau brief untuk meningkatkan kualitasnya.",
    },
    {
      value: "Writing Camp & Co-Authoring Publikasi",
      label: "Writing Camp & Co-Authoring Publikasi",
      description: "Pendampingan menulis artikel jurnal terakreditasi atau opini di media massa.",
    },
    {
      value: "Workshop Pembuatan Konten Microlearning",
      label: "Workshop Pembuatan Konten Microlearning",
      description: "Praktik membuat modul ringkas, infografis, atau video edukasi kebijakan.",
    },
    {
      value: "Inovasi & Policy Hackathon",
      label: "Inovasi & Policy Hackathon",
      description: "Kolaborasi mencari solusi atas tantangan nyata dalam perumusan dan advokasi kebijakan publik.",
    },
    { value: "Lainnya", label: "Lainnya", description: "Usulkan bentuk kegiatan SME lain yang Anda butuhkan." },
  ],
  priorityTopics: ["Analisis kebijakan", "Riset/metodologi", "Quality control", "Manajemen pengetahuan", "Publikasi", "Konten pembelajaran", "Kolaborasi dan stakeholder", "Inovasi", "Lainnya"],
  learningMethods: ["Tatap muka", "Daring", "Blended/hybrid", "Praktik langsung/studi kasus", "Pendampingan/coaching", "Lainnya"],
};

// Ignore legacy configs without an instrument version so an old questionnaire
// cannot silently replace the currently shipped instrument. The admin editor
// can still start from DEFAULT_CONFIG and save a versioned config explicitly.
export function normalizeSurveyConfig(savedConfig) {
  if (!savedConfig || typeof savedConfig !== "object" || Array.isArray(savedConfig)) return null;
  if (Number(savedConfig.instrumentVersion) !== Number(DEFAULT_CONFIG.instrumentVersion)) return null;
  if (
    !savedConfig.surveyTitle ||
    !savedConfig.intro ||
    !Array.isArray(savedConfig.competencies) ||
    !savedConfig.competencies.length ||
    !Array.isArray(savedConfig.developmentFormats) ||
    !savedConfig.developmentFormats.length ||
    savedConfig.developmentFormats.some((option) =>
      typeof option !== "string" && (!option || typeof option.value !== "string" || typeof option.label !== "string")
    ) ||
    !Array.isArray(savedConfig.priorityTopics) ||
    !Array.isArray(savedConfig.learningMethods) ||
    savedConfig.competencies.some((item) => !item?.id || !item?.title || !item?.pilar)
  ) return null;

  const savedFormatValues = savedConfig.developmentFormats.map((option) =>
    String(typeof option === "string" ? option : option.value).trim().toLocaleLowerCase("id")
  );
  // Replace the previously published generic activity list (Pelatihan,
  // Workshop, Coaching, Mentoring, etc.) with the agreed SME activity list.
  // Otherwise an older versioned Supabase row takes precedence over the new
  // defaults shipped with the site.
  const hasOldGenericActivityList = ["pelatihan", "workshop", "coaching", "mentoring"].every((value) =>
    savedFormatValues.includes(value)
  );
  const formatsToNormalize = hasOldGenericActivityList
    ? DEFAULT_CONFIG.developmentFormats
    : savedConfig.developmentFormats;
  const descriptionsByValue = new Map(DEFAULT_CONFIG.developmentFormats.map((option) => [option.value, option.description]));
  const developmentFormats = formatsToNormalize.map((option) => {
    const value = typeof option === "string" ? option : option.value;
    const label = typeof option === "string" ? option : option.label;
    return {
      value,
      label,
      description: (typeof option === "string" ? "" : option.description) || descriptionsByValue.get(value) || "",
    };
  });

  return {
    ...DEFAULT_CONFIG,
    ...savedConfig,
    developmentFormats,
    instrumentVersion: DEFAULT_CONFIG.instrumentVersion,
  };
}
