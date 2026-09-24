const statements = [
  ["A", "Analisis Kebijakan dan Riset Kebijakan", [
    "Mengidentifikasi dan merumuskan isu strategis yang relevan dengan tugas pemerintah/LAN.",
    "Merumuskan permasalahan kebijakan berdasarkan data dan informasi yang tersedia.",
    "Memilih dan menggunakan metode riset atau analisis kebijakan yang sesuai dengan permasalahan.",
    "Menganalisis dampak atau konsekuensi dari suatu kebijakan.",
    "Menyusun rekomendasi kebijakan berdasarkan hasil analisis dan data/bukti yang tersedia.",
  ]],
  ["B", "Quality Control dan Standardisasi Produk", [
    "Memahami standar dan kriteria kualitas produk kebijakan, survei, atau hasil analisis.",
    "Memeriksa kualitas produk kebijakan, survei, atau hasil analisis.",
    "Menilai kesesuaian metode yang digunakan dalam analisis atau survei.",
    "Mengidentifikasi kesalahan, kekurangan, atau ketidaksesuaian dalam suatu produk.",
    "Memberikan masukan untuk meningkatkan kualitas produk kebijakan, survei, atau hasil analisis.",
  ]],
  ["C", "Manajemen Pengetahuan dan Publikasi", [
    "Mengidentifikasi dan mengumpulkan informasi atau pengetahuan yang relevan dengan bidang kepakaran.",
    "Menyeleksi dan menilai relevansi informasi atau pengetahuan yang diperoleh.",
    "Mendokumentasikan hasil pemikiran, pengalaman, dan pengetahuan agar dapat dimanfaatkan oleh organisasi.",
    "Menyusun hasil analisis atau pengetahuan dalam bentuk publikasi yang sistematis.",
    "Menyajikan dan membagikan pengetahuan agar dapat dimanfaatkan oleh pegawai lain.",
  ]],
  ["D", "Pengembangan Kompetensi dan Konten Pembelajaran", [
    "Mengidentifikasi kebutuhan kompetensi pegawai sesuai dengan kebutuhan organisasi.",
    "Menyusun materi atau bahan pembelajaran sesuai dengan bidang kepakaran.",
    "Menyampaikan pengetahuan melalui pelatihan, sharing knowledge, atau bedah buku.",
    "Memberikan coaching atau mentoring untuk mendukung pengembangan kompetensi pegawai.",
    "Menyeleksi dan mengembangkan konten pembelajaran yang relevan dengan kebutuhan pegawai.",
  ]],
  ["E", "Kolaborasi, Inovasi, dan Pengembangan Organisasi", [
    "Membangun komunikasi dan kolaborasi dengan pihak terkait dalam pelaksanaan tugas SME.",
    "Mengidentifikasi kebutuhan dan kepentingan pihak terkait dalam suatu kegiatan atau kebijakan.",
    "Memfasilitasi berbagi gagasan dan pengetahuan antarpegawai atau antarunit.",
    "Menggunakan pendekatan inovasi untuk menyelesaikan permasalahan organisasi.",
    "Mengembangkan gagasan inovatif menjadi alternatif program atau kebijakan.",
  ]],
];

export const DEFAULT_CONFIG = {
  surveyTitle: "Kuesioner Pengembangan Kapasitas Subject Matter Expert (SME)",
  intro: "Kuesioner ini bertujuan mengetahui tingkat kemampuan pegawai saat ini dan kebutuhan pengembangan kompetensi dalam mendukung pelaksanaan tugas Subject Matter Expert (SME). Hasilnya digunakan untuk mengidentifikasi kompetensi prioritas pengembangan.",
  competencies: statements.flatMap(([code, pilar, items]) => items.map((title, i) => ({ id: `${code}${i + 1}`, code: `${code}${i + 1}`, pilar, title }))),
  developmentFormats: ["Pelatihan", "Workshop", "Coaching", "Mentoring", "Sharing knowledge", "Bedah buku", "Praktik/studi kasus", "Lainnya"],
  priorityTopics: ["Analisis kebijakan", "Riset/metodologi", "Quality control", "Manajemen pengetahuan", "Publikasi", "Konten pembelajaran", "Kolaborasi dan stakeholder", "Inovasi", "Lainnya"],
  learningMethods: ["Tatap muka", "Daring", "Blended/hybrid", "Praktik langsung/studi kasus", "Pendampingan/coaching", "Lainnya"],
};
