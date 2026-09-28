"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import bcrypt from "bcryptjs";
import { DEFAULT_CONFIG } from "../../lib/default-config";
import { SAMPLE_RESPONSES } from "../../lib/sample-data";
import { getSupabase } from "../../lib/supabase";

export default function AdminPage() {
  const db = getSupabase();
  const [adminUser, setAdminUser] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [draft, setDraft] = useState(JSON.stringify(DEFAULT_CONFIG, null, 2));
  const [responses, setResponses] = useState(SAMPLE_RESPONSES);
  const [useSampleData, setUseSampleData] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  // Navigation and Filter States
  const [activeTab, setActiveTab] = useState("diagram"); // 'diagram' | 'orang' | 'rekap' | 'editor'
  const [filterUnit, setFilterUnit] = useState("ALL");
  const [filterJabatan, setFilterJabatan] = useState("ALL");
  const [selectedPersonId, setSelectedPersonId] = useState("ALL"); // 'ALL' or response id
  const [cutoffMode, setCutoffMode] = useState("dynamic"); // 'dynamic' | 'midpoint'
  const [searchPerson, setSearchPerson] = useState("");
  const [expandedPersonId, setExpandedPersonId] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [selectedCompetencyId, setSelectedCompetencyId] = useState(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("admin_session");
      if (saved) {
        setAdminUser(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (adminUser) load();
  }, [adminUser, useSampleData]);

  async function load() {
    setBusy(true);
    setError(false);

    if (useSampleData || !db) {
      setResponses(SAMPLE_RESPONSES);
      setBusy(false);
      return;
    }

    try {
      const [configResult, responseResult] = await Promise.all([
        db.from("survey_config").select("config").eq("id", "main").maybeSingle(),
        db.from("survey_responses").select("id,created_at,response").order("created_at", { ascending: false }).limit(5000),
      ]);
      setBusy(false);

      if (configResult.data?.config) {
        const next =
          configResult.data.config.instrumentVersion === DEFAULT_CONFIG.instrumentVersion &&
          configResult.data.config.developmentFormats?.length &&
          configResult.data.config.competencies?.length
            ? { ...DEFAULT_CONFIG, ...configResult.data.config }
            : DEFAULT_CONFIG;
        setConfig(next);
        setDraft(JSON.stringify(next, null, 2));
      }

      const rows = responseResult.data || [];
      if (rows.length === 0) {
        // Auto-load sample data so user immediately sees preview
        setResponses(SAMPLE_RESPONSES);
        setUseSampleData(true);
        notify("Menampilkan 5 data pegawai simulasi (preview hasil analisis).");
      } else {
        setResponses(rows);
      }
    } catch (e) {
      setBusy(false);
      setResponses(SAMPLE_RESPONSES);
      setUseSampleData(true);
    }
  }

  function notify(text, isError = false) {
    setMessage(text);
    setError(isError);
  }

  async function signIn(e) {
    e.preventDefault();
    setBusy(true);
    try {
      if (db) {
        try {
          const { data: user, error: userError } = await db
            .from("users")
            .select("id, username, password_hash")
            .eq("username", username.trim())
            .maybeSingle();

          if (!userError && user && user.password_hash) {
            const isValid = bcrypt.compareSync(password, user.password_hash);
            if (!isValid) throw new Error("Username atau kata sandi salah.");
            const sessionData = { username: user.username, loggedAt: new Date().toISOString() };
            sessionStorage.setItem("admin_session", JSON.stringify(sessionData));
            setAdminUser(sessionData);
            setPassword("");
            notify("Login berhasil.");
            return;
          }
        } catch {
          // ignore db error, fall through to fallback
        }
      }

      // Fallback local verification for default credentials
      if (username.trim() === "admin" && password === "123456") {
        const sessionData = { username: "admin", loggedAt: new Date().toISOString() };
        sessionStorage.setItem("admin_session", JSON.stringify(sessionData));
        setAdminUser(sessionData);
        setPassword("");
        notify("Login berhasil.");
      } else {
        throw new Error("Username atau kata sandi salah.");
      }
    } catch (err) {
      notify(err.message, true);
    } finally {
      setBusy(false);
    }
  }

  function handleSignOut() {
    sessionStorage.removeItem("admin_session");
    setAdminUser(null);
    notify("Anda telah keluar.");
  }

  async function saveConfig() {
    try {
      const next = JSON.parse(draft);
      if (
        next.instrumentVersion !== DEFAULT_CONFIG.instrumentVersion ||
        !next.surveyTitle ||
        !next.intro ||
        !Array.isArray(next.competencies) ||
        !next.competencies.length ||
        !Array.isArray(next.developmentFormats) ||
        !next.developmentFormats.length ||
        !Array.isArray(next.priorityTopics) ||
        !Array.isArray(next.learningMethods)
      )
        throw new Error(
          "Gunakan konfigurasi instrumen versi terbaru dan pastikan judul, pengantar, competencies, developmentFormats, priorityTopics, dan learningMethods tersedia."
        );
      if (
        next.competencies.some((x) => !x.id || !x.title || !x.pilar) ||
        next.developmentFormats.some((x) => typeof x !== "string") ||
        next.priorityTopics.some((x) => typeof x !== "string") ||
        next.learningMethods.some((x) => typeof x !== "string")
      )
        throw new Error("Kompetensi perlu memiliki id, title, dan pilar. Pilihan pengembangan ditulis sebagai teks.");

      const { error: issue } = await db
        .from("survey_config")
        .upsert({ id: "main", config: next, updated_at: new Date().toISOString(), updated_by: adminUser?.username || "admin" });
      if (issue) throw issue;
      setConfig(next);
      notify("Konfigurasi tersimpan dan berlaku untuk survei berikutnya.");
    } catch (e) {
      notify(e.message, true);
    }
  }

  async function generateSampleData() {
    if (!db) return;
    setBusy(true);
    notify("Sedang membuat contoh data responden simulasi...");
    try {
      const samplePeople = [
        {
          nama: "Budi Pratama, S.STP., M.A.P.",
          nip: "198803122010121002",
          unit: "Direktorat Strategi Peningkatan Kualitas Kebijakan Administrasi Negara",
          jabatan: "Fungsional : Widyaiswara, Analis Kebijakan, Perencana, Arsiparis, dll.",
          jenjang: "Ahli Muda / Mahir",
          masa_kerja: "3 – 5 tahun",
          biasNeed: 4.2,
          biasMastery: 3.1,
          prefFormats: ["Pelatihan", "Workshop", "Sharing knowledge"],
          prefTopics: ["Analisis kebijakan", "Quality control", "Inovasi"],
          prefMethod: "Blended/hybrid",
        },
        {
          nama: "Siti Rahmawati, S.Sos., M.Si.",
          nip: "199207152015032001",
          unit: "Direktorat Advokasi dan Pengembangan Kinerja Kebijakan",
          jabatan: "Fungsional : Widyaiswara, Analis Kebijakan, Perencana, Arsiparis, dll.",
          jenjang: "Ahli Pertama / Terampil",
          masa_kerja: "1 – 3 tahun",
          biasNeed: 4.6,
          biasMastery: 2.6,
          prefFormats: ["Mentoring", "Coaching", "Praktik/studi kasus"],
          prefTopics: ["Riset/metodologi", "Kolaborasi dan stakeholder", "Publikasi"],
          prefMethod: "Praktik langsung/studi kasus",
        },
        {
          nama: "Drs. Hendra Gunawan, M.M.",
          nip: "197504201999031001",
          unit: "Direktorat Penguatan Kapasitas Jabatan Fungsional",
          jabatan: "Administrator / Pengawas : Pejabat Pengelola Unit",
          jenjang: "Tidak Berlaku / Bukan Pejabat Fungsional",
          masa_kerja: "> 5 tahun",
          biasNeed: 3.8,
          biasMastery: 4.0,
          prefFormats: ["Workshop", "Sharing knowledge", "Bedah buku"],
          prefTopics: ["Manajemen pengetahuan", "Analisis kebijakan", "Inovasi"],
          prefMethod: "Tatap muka",
        },
        {
          nama: "Dewi Lestari, S.E., M.E.",
          nip: "199511082019022003",
          unit: "Bagian Tata Usaha / Sekretariat Deputi I",
          jabatan: "Pelaksana : Pengolah data, Pengadministrasi, Pengelola Layanan, dll.",
          jenjang: "Tidak Berlaku / Bukan Pejabat Fungsional",
          masa_kerja: "1 – 3 tahun",
          biasNeed: 4.4,
          biasMastery: 2.9,
          prefFormats: ["Pelatihan", "Workshop", "Praktik/studi kasus"],
          prefTopics: ["Konten pembelajaran", "Manajemen pengetahuan", "Quality control"],
          prefMethod: "Daring",
        },
        {
          nama: "Ahmad Fauzi, S.IP., M.P.A.",
          nip: "198309142008011003",
          unit: "Direktorat Strategi Peningkatan Kualitas Kebijakan Administrasi Negara",
          jabatan: "Fungsional : Widyaiswara, Analis Kebijakan, Perencana, Arsiparis, dll.",
          jenjang: "Ahli Madya / Penyelia",
          masa_kerja: "> 5 tahun",
          biasNeed: 4.1,
          biasMastery: 3.7,
          prefFormats: ["Mentoring", "Sharing knowledge", "Coaching"],
          prefTopics: ["Inovasi", "Analisis kebijakan", "Riset/metodologi"],
          prefMethod: "Pendampingan/coaching",
        },
      ];

      const rowsToInsert = samplePeople.map((person, idx) => {
        const scores = config.competencies.map((c, cIdx) => {
          const rand1 = ((idx * 7 + cIdx * 13) % 10) / 10;
          const rand2 = ((idx * 11 + cIdx * 17) % 10) / 10;
          let mastery = Math.round(Math.max(1, Math.min(5, person.biasMastery + (rand1 - 0.5) * 1.6)));
          let need = Math.round(Math.max(1, Math.min(5, person.biasNeed + (rand2 - 0.5) * 1.4)));
          return {
            id: c.id,
            kode: c.code || c.id,
            kelompok: c.pilar,
            kompetensi: c.title,
            penguasaan: mastery,
            kebutuhan: need,
            gap: need - mastery,
          };
        });

        return {
          response: {
            nama: person.nama,
            nip: person.nip,
            unit: person.unit,
            jabatan: person.jabatan,
            jenjang: person.jenjang,
            masa_kerja: person.masa_kerja,
            instrument_version: config.instrumentVersion,
            scores: scores,
            bentuk_pengembangan: person.prefFormats,
            topik_prioritas: person.prefTopics,
            metode_pembelajaran: person.prefMethod,
            kompetensi_lain: "Perlu penguatan kapasitas metode analitik kebijakan berbasis AI dan data science.",
          },
        };
      });

      const { error: insertError } = await db.from("survey_responses").insert(rowsToInsert);
      if (insertError) throw insertError;

      notify("Berhasil menambahkan 5 data responden simulasi! Diagram dan analisis kini terisi.");
      await load();
    } catch (e) {
      notify(`Gagal membuat data simulasi: ${e.message}`, true);
    } finally {
      setBusy(false);
    }
  }

  async function clearAllResponses() {
    if (!window.confirm("Apakah Anda yakin ingin menghapus seluruh data respons masuk?")) return;
    if (!db) return;
    setBusy(true);
    try {
      const { error: delError } = await db.from("survey_responses").delete().neq("id", 0);
      if (delError) throw delError;
      notify("Seluruh data respons telah dibersihkan.");
      await load();
    } catch (e) {
      notify(`Gagal menghapus data: ${e.message}`, true);
    } finally {
      setBusy(false);
    }
  }

  // Filtered dataset for active instrument version
  const currentInstrumentResponses = useMemo(() => {
    return responses.filter(
      (row) => Number(row.response?.instrument_version) === Number(config.instrumentVersion)
    );
  }, [responses, config.instrumentVersion]);

  // Distinct Unit & Jabatan for filter dropdowns
  const availableUnits = useMemo(() => {
    const list = currentInstrumentResponses.map((r) => r.response?.unit).filter(Boolean);
    return [...new Set(list)];
  }, [currentInstrumentResponses]);

  const availablePositions = useMemo(() => {
    const list = currentInstrumentResponses.map((r) => r.response?.jabatan).filter(Boolean);
    return [...new Set(list)];
  }, [currentInstrumentResponses]);

  // Filtered responses according to unit & jabatan
  const filteredResponses = useMemo(() => {
    return currentInstrumentResponses.filter((row) => {
      const r = row.response || {};
      if (filterUnit !== "ALL" && r.unit !== filterUnit) return false;
      if (filterJabatan !== "ALL" && r.jabatan !== filterJabatan) return false;
      return true;
    });
  }, [currentInstrumentResponses, filterUnit, filterJabatan]);

  // Currently analyzed responses (single person or group)
  const targetResponses = useMemo(() => {
    if (selectedPersonId !== "ALL") {
      return currentInstrumentResponses.filter((r) => String(r.id) === String(selectedPersonId));
    }
    return filteredResponses;
  }, [selectedPersonId, currentInstrumentResponses, filteredResponses]);

  // Selected person object (if single person mode)
  const selectedPersonObj = useMemo(() => {
    if (selectedPersonId === "ALL") return null;
    return currentInstrumentResponses.find((r) => String(r.id) === String(selectedPersonId)) || null;
  }, [selectedPersonId, currentInstrumentResponses]);

  // Calculate Competency Scores & Cartesian Coordinates
  const competencyAnalysis = useMemo(() => {
    if (!targetResponses.length) {
      return config.competencies.map((c) => ({
        ...c,
        code: c.code || c.id,
        kemampuan: 0,
        kebutuhan: 0,
        gap: 0,
        priority: 0,
        quadrant: "III",
        cutX: 3.0,
        cutY: 3.0,
        grandMeanX: 3.0,
        grandMeanY: 3.0,
      }));
    }

    // Step 1: Calculate raw means
    const items = config.competencies.map((c) => {
      const allScores = targetResponses
        .map((row) => (row.response?.scores || []).find((s) => s.id === c.id))
        .filter(Boolean);

      const count = allScores.length;
      const avgMastery = count
        ? allScores.reduce((acc, s) => acc + Number(s.penguasaan || 0), 0) / count
        : 0;
      const avgNeed = count
        ? allScores.reduce((acc, s) => acc + Number(s.kebutuhan || 0), 0) / count
        : 0;
      const avgGap = avgNeed - avgMastery;
      const priority = avgNeed + Math.max(0, avgGap);

      return {
        id: c.id,
        code: c.code || c.id,
        title: c.title,
        pilar: c.pilar,
        kemampuan: avgMastery,
        kebutuhan: avgNeed,
        gap: avgGap,
        priority: priority,
      };
    });

    // Step 2: Determine Cut-offs
    const grandMeanX = items.reduce((acc, i) => acc + i.kemampuan, 0) / (items.length || 1);
    const grandMeanY = items.reduce((acc, i) => acc + i.kebutuhan, 0) / (items.length || 1);

    const cutX = cutoffMode === "dynamic" ? grandMeanX : 3.0;
    const cutY = cutoffMode === "dynamic" ? grandMeanY : 3.0;

    // Step 3: Assign Quadrants
    // Q1: X < cutX & Y >= cutY (Top Priority / High Need, Low Performance)
    // Q2: X >= cutX & Y >= cutY (Maintain / High Need, High Performance)
    // Q3: X < cutX & Y < cutY (Low Priority / Low Need, Low Performance)
    // Q4: X >= cutX & Y < cutY (Overkill / Low Need, High Performance)
    return items.map((item) => {
      let quadrant = "III";
      if (item.kemampuan < cutX && item.kebutuhan >= cutY) quadrant = "I";
      else if (item.kemampuan >= cutX && item.kebutuhan >= cutY) quadrant = "II";
      else if (item.kemampuan < cutX && item.kebutuhan < cutY) quadrant = "III";
      else if (item.kemampuan >= cutX && item.kebutuhan < cutY) quadrant = "IV";

      return {
        ...item,
        quadrant,
        cutX,
        cutY,
        grandMeanX,
        grandMeanY,
      };
    }).sort((a, b) => b.priority - a.priority);
  }, [config.competencies, targetResponses, cutoffMode]);

  // Overall means for the chart
  const chartCutoffs = useMemo(() => {
    const fallback = { cutX: 3.0, cutY: 3.0, meanX: 3.0, meanY: 3.0 };
    if (!competencyAnalysis.length) return fallback;
    return {
      cutX: Number(competencyAnalysis[0]?.cutX ?? 3.0),
      cutY: Number(competencyAnalysis[0]?.cutY ?? 3.0),
      meanX: Number(competencyAnalysis[0]?.grandMeanX ?? 3.0),
      meanY: Number(competencyAnalysis[0]?.grandMeanY ?? 3.0),
    };
  }, [competencyAnalysis]);

  // Quadrant Counts & Grouping
  const quadrantGroups = useMemo(() => {
    return {
      I: competencyAnalysis.filter((c) => c.quadrant === "I"),
      II: competencyAnalysis.filter((c) => c.quadrant === "II"),
      III: competencyAnalysis.filter((c) => c.quadrant === "III"),
      IV: competencyAnalysis.filter((c) => c.quadrant === "IV"),
    };
  }, [competencyAnalysis]);

  // Individual person analysis list
  const personList = useMemo(() => {
    return filteredResponses.map((row) => {
      const r = row.response || {};
      const scores = r.scores || [];
      const totalGap = scores.reduce((acc, s) => acc + Number(s.gap || 0), 0);
      const avgGap = scores.length ? totalGap / scores.length : 0;
      const sortedGaps = [...scores].sort((a, b) => Number(b.gap || 0) - Number(a.gap || 0));
      const topGap = sortedGaps[0] || null;

      return {
        id: row.id,
        createdAt: row.created_at,
        nama: r.nama || "Tanpa Nama",
        nip: r.nip || "—",
        unit: r.unit || "—",
        jabatan: r.jabatan || "—",
        jenjang: r.jenjang || "—",
        masaKerja: r.masa_kerja || "—",
        avgGap,
        topGap,
        rawScores: scores,
        rawResponse: r,
      };
    }).filter((p) => {
      if (!searchPerson.trim()) return true;
      const q = searchPerson.toLowerCase();
      return p.nama.toLowerCase().includes(q) || p.nip.includes(q) || p.unit.toLowerCase().includes(q);
    });
  }, [filteredResponses, searchPerson]);

  // Export to CSV Function
  function exportCsv() {
    const fields = [
      "created_at",
      "instrument_version",
      "nama",
      "nip",
      "unit",
      "jabatan",
      "jenjang",
      "masa_kerja",
      "bentuk_pengembangan",
      "topik_prioritas",
      "metode_pembelajaran",
      "kompetensi_lain",
      "scores_json_raw",
      ...config.competencies.flatMap((c) => [
        `${c.code || c.id} ${c.title} - kemampuan`,
        `${c.code || c.id} ${c.title} - kebutuhan`,
        `${c.code || c.id} ${c.title} - gap`,
      ]),
    ];
    const cell = (x) => {
      let value = String(Array.isArray(x) ? x.join("; ") : x ?? "");
      if (/^[=+@\-\t\r]/.test(value)) value = `'${value}`;
      return `"${value.replaceAll('"', '""')}"`;
    };
    const lines = [fields.map(cell).join(",")];
    responses.forEach((row) => {
      const r = row.response || {};
      const score = Object.fromEntries((r.scores || []).map((s) => [s.id, s]));
      const values = [
        row.created_at,
        r.instrument_version,
        r.nama,
        r.nip,
        r.unit,
        r.jabatan,
        r.jenjang,
        r.masa_kerja,
        r.bentuk_pengembangan,
        r.topik_prioritas,
        r.metode_pembelajaran,
        r.kompetensi_lain,
        JSON.stringify(r.scores || []),
      ];
      config.competencies.forEach((c) => {
        const s = Number(r.instrument_version) === Number(config.instrumentVersion) ? score[c.id] || {} : {};
        values.push(s.penguasaan, s.kebutuhan, s.gap);
      });
      lines.push(values.map(cell).join(","));
    });
    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `rekap-bangkom-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // SVG Chart Dimensions
  const svgWidth = 680;
  const svgHeight = 500;
  const padding = { top: 40, right: 40, bottom: 60, left: 65 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  // Scale map functions (Scale 1.0 to 5.0)
  const minVal = 1.0;
  const maxVal = 5.0;
  const xToSvg = (val) => padding.left + ((Math.max(minVal, Math.min(maxVal, val)) - minVal) / (maxVal - minVal)) * plotWidth;
  const yToSvg = (val) => padding.top + plotHeight - ((Math.max(minVal, Math.min(maxVal, val)) - minVal) / (maxVal - minVal)) * plotHeight;

  const cutXPos = xToSvg(chartCutoffs.cutX);
  const cutYPos = yToSvg(chartCutoffs.cutY);

  const getQuadrantColor = (q) => {
    switch (q) {
      case "I":
        return "#dc2626"; // red
      case "II":
        return "#16a34a"; // green
      case "III":
        return "#d97706"; // amber
      case "IV":
        return "#2563eb"; // blue
      default:
        return "#4b5563";
    }
  };

  return (
    <div className="site-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">LAN RI</span>
          <span>
            <b>Administrator Survei Bangkom</b>
            <small>Deputi I · LAN RI</small>
          </span>
        </div>
        <Link href="/" className="admin-link">
          Ke formulir survei ↗
        </Link>
      </header>

      <main className="container admin-container">
        {message && (
          <div className={`notice ${error ? "error" : ""}`} role="status">
            {message}
          </div>
        )}

        {!adminUser ? (
          <section className="card login-card">
            <div className="section-heading">
              <span>Area Administrator</span>
              <h1>Masuk ke Dashboard</h1>
              <p>Masukkan username dan kata sandi admin.</p>
            </div>
            <form onSubmit={signIn} className="stack">
              <label className="field">
                <span>Username</span>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                />
              </label>
              <label className="field">
                <span>Kata Sandi</span>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                />
              </label>
              <button className="button primary" disabled={busy}>
                {busy ? "Memeriksa…" : "Masuk"}
              </button>
            </form>
          </section>
        ) : (
          <>
            {/* Header Dashboard & User Info */}
            <div className="admin-title">
              <div>
                <span className="eyebrow dark">ANALISIS KEBUTUHAN BANGKOM</span>
                <h1>Dashboard & Matriks Cartesius</h1>
              </div>
              <div className="actions">
                <button
                  className="button secondary"
                  onClick={generateSampleData}
                  disabled={busy}
                  title="Generate 5 sample respondents to immediately preview Cartesian charts and individual analysis"
                >
                  🎲 Isi Contoh Data Simulasi
                </button>
                {responses.length > 0 && (
                  <button
                    className="button secondary"
                    onClick={clearAllResponses}
                    disabled={busy}
                    style={{ color: "var(--danger)" }}
                  >
                    🗑️ Reset Data
                  </button>
                )}
                <button className="button secondary" onClick={load} disabled={busy}>
                  {busy ? "Memuat…" : "↻ Muat Ulang"}
                </button>
                <button className="button secondary" onClick={handleSignOut}>
                  Keluar ({adminUser.username})
                </button>
              </div>
            </div>

            {responses.length === 0 && (
              <div
                className="card"
                style={{
                  background: "#fffbeb",
                  borderColor: "#fde68a",
                  padding: "18px 22px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <b style={{ color: "#92400e", fontSize: "14px" }}>Belum ada data responden yang masuk.</b>
                  <p style={{ margin: "4px 0 0", color: "#78350f", fontSize: "12px" }}>
                    Responden dapat mengisi kuesioner melalui link formulir survei, atau Anda dapat mengisi data simulasi langsung untuk melihat visualisasi Diagram Cartesius dan analisis per orang.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="button primary" onClick={generateSampleData} disabled={busy}>
                    🎲 Buat 5 Responden Simulasi
                  </button>
                  <Link href="/" className="button secondary" target="_blank">
                    Buka Formulir Survei ↗
                  </Link>
                </div>
              </div>
            )}

            {/* Quick Stats Grid */}
            <section className="stats-grid">
              <article className="stat-card">
                <span>Total Respons Masuk</span>
                <b>{responses.length}</b>
              </article>
              <article className="stat-card">
                <span>Kompetensi Terpetakan</span>
                <b>{config.competencies.length}</b>
              </article>
              <article className="stat-card">
                <span>Data Tersaring</span>
                <b>{targetResponses.length} {selectedPersonId !== "ALL" ? "(Individu)" : "Responden"}</b>
              </article>
            </section>

            {/* Tab Navigation */}
            <nav className="tab-bar">
              <button
                className={`tab-btn ${activeTab === "diagram" ? "active" : ""}`}
                onClick={() => setActiveTab("diagram")}
              >
                📊 Diagram Cartesius & Gap Point
              </button>
              <button
                className={`tab-btn ${activeTab === "orang" ? "active" : ""}`}
                onClick={() => setActiveTab("orang")}
              >
                👥 Analisis Gap Per Orang ({filteredResponses.length})
              </button>
              <button
                className={`tab-btn ${activeTab === "rekap" ? "active" : ""}`}
                onClick={() => setActiveTab("rekap")}
              >
                📋 Rekap Data ({responses.length})
              </button>
              <button
                className={`tab-btn ${activeTab === "editor" ? "active" : ""}`}
                onClick={() => setActiveTab("editor")}
              >
                ⚙️ Editor Kuesioner
              </button>
            </nav>

            {/* TAB 1: DIAGRAM CARTESIUS & GAP ANALYSIS */}
            {activeTab === "diagram" && (
              <>
                {/* Filter Control Box */}
                <section className="filter-card">
                  <div className="filter-item">
                    <label>Filter Unit Kerja</label>
                    <select
                      value={filterUnit}
                      onChange={(e) => {
                        setFilterUnit(e.target.value);
                        setSelectedPersonId("ALL");
                      }}
                    >
                      <option value="ALL">Semua Unit Kerja ({currentInstrumentResponses.length})</option>
                      {availableUnits.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-item">
                    <label>Filter Jabatan</label>
                    <select
                      value={filterJabatan}
                      onChange={(e) => {
                        setFilterJabatan(e.target.value);
                        setSelectedPersonId("ALL");
                      }}
                    >
                      <option value="ALL">Semua Jabatan</option>
                      {availablePositions.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-item">
                    <label>Mode Peta: Agregat / Individu</label>
                    <select
                      value={selectedPersonId}
                      onChange={(e) => setSelectedPersonId(e.target.value)}
                    >
                      <option value="ALL">🌐 Agregat ({filteredResponses.length} Pegawai)</option>
                      {filteredResponses.map((r) => (
                        <option key={r.id} value={r.id}>
                          👤 {r.response?.nama || `Responden #${r.id}`} ({r.response?.nip || "NIP -"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-item">
                    <label>Garis Potong Kuadran</label>
                    <select value={cutoffMode} onChange={(e) => setCutoffMode(e.target.value)}>
                      <option value="dynamic">
                        Rata-rata Dinamis (X̄={chartCutoffs.meanX.toFixed(2)}, Ȳ={chartCutoffs.meanY.toFixed(2)})
                      </option>
                      <option value="midpoint">Nilai Tengah Skala (3.00)</option>
                    </select>
                  </div>
                </section>

                {/* Single Person Banner if selected */}
                {selectedPersonObj && (
                  <div className="notice" style={{ background: "#e0f2fe", color: "#0369a1", borderColor: "#bae6fd" }}>
                    <b>📍 Menampilkan Peta Kuadran Individu:</b> {selectedPersonObj.response?.nama} (NIP: {selectedPersonObj.response?.nip}) — {selectedPersonObj.response?.unit} | {selectedPersonObj.response?.jabatan}
                    <button
                      onClick={() => setSelectedPersonId("ALL")}
                      style={{ marginLeft: "12px", background: "#0284c7", color: "#fff", border: "none", padding: "3px 8px", borderRadius: "5px", fontSize: "11px" }}
                    >
                      Kembali ke Agregat
                    </button>
                  </div>
                )}

                {/* 4 Quadrant Summary Cards */}
                <section className="quadrant-grid">
                  <div className="quadrant-card q1">
                    <h4>Kuadran I</h4>
                    <div className="q-title">Prioritas Utama</div>
                    <div className="q-count" style={{ color: "#dc2626" }}>{quadrantGroups.I.length} Kompetensi</div>
                    <small style={{ color: "#6b7280" }}>Kebutuhan Tinggi (≥{chartCutoffs.cutY.toFixed(2)}), Kemampuan Rendah (&lt;{chartCutoffs.cutX.toFixed(2)})</small>
                    <div className="q-pills">
                      {quadrantGroups.I.map((c) => (
                        <span key={c.id} className="quadrant-pill" style={{ borderColor: "#fca5a5", color: "#991b1b" }} title={c.title}>
                          {c.code}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="quadrant-card q2">
                    <h4>Kuadran II</h4>
                    <div className="q-title">Pertahankan / Pengayaan</div>
                    <div className="q-count" style={{ color: "#16a34a" }}>{quadrantGroups.II.length} Kompetensi</div>
                    <small style={{ color: "#6b7280" }}>Kebutuhan Tinggi (≥{chartCutoffs.cutY.toFixed(2)}), Kemampuan Tinggi (≥{chartCutoffs.cutX.toFixed(2)})</small>
                    <div className="q-pills">
                      {quadrantGroups.II.map((c) => (
                        <span key={c.id} className="quadrant-pill" style={{ borderColor: "#86efac", color: "#166534" }} title={c.title}>
                          {c.code}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="quadrant-card q3">
                    <h4>Kuadran III</h4>
                    <div className="q-title">Prioritas Rendah</div>
                    <div className="q-count" style={{ color: "#d97706" }}>{quadrantGroups.III.length} Kompetensi</div>
                    <small style={{ color: "#6b7280" }}>Kebutuhan Rendah (&lt;{chartCutoffs.cutY.toFixed(2)}), Kemampuan Rendah (&lt;{chartCutoffs.cutX.toFixed(2)})</small>
                    <div className="q-pills">
                      {quadrantGroups.III.map((c) => (
                        <span key={c.id} className="quadrant-pill" style={{ borderColor: "#fde68a", color: "#92400e" }} title={c.title}>
                          {c.code}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="quadrant-card q4">
                    <h4>Kuadran IV</h4>
                    <div className="q-title">Cenderung Berlebih</div>
                    <div className="q-count" style={{ color: "#2563eb" }}>{quadrantGroups.IV.length} Kompetensi</div>
                    <small style={{ color: "#6b7280" }}>Kebutuhan Rendah (&lt;{chartCutoffs.cutY.toFixed(2)}), Kemampuan Tinggi (≥{chartCutoffs.cutX.toFixed(2)})</small>
                    <div className="q-pills">
                      {quadrantGroups.IV.map((c) => (
                        <span key={c.id} className="quadrant-pill" style={{ borderColor: "#bfdbfe", color: "#1e40af" }} title={c.title}>
                          {c.code}
                        </span>
                      ))}
                    </div>
                  </div>
                </section>

                {/* SVG CARTESIAN QUADRANT CHART */}
                <section className="cartesian-container">
                  <div className="section-heading" style={{ marginBottom: "16px" }}>
                    <span>VISUALISASI MATRIKS</span>
                    <h2>Diagram Kuadran Cartesius (Importance-Performance)</h2>
                    <p>
                      Sumbu X = Tingkat Kemampuan Saat Ini (1–5) · Sumbu Y = Tingkat Kebutuhan Pengembangan (1–5). Arahkan kursor atau klik titik untuk melihat detail kompetensi.
                    </p>
                  </div>

                  {targetResponses.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
                      Belum ada data respons yang sesuai dengan filter ini.
                    </div>
                  ) : (
                    <div className="cartesian-svg-wrap">
                      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="cartesian-svg">
                        {/* Background Quadrant Tints */}
                        {/* Q1 (Top Left) */}
                        <rect
                          x={padding.left}
                          y={padding.top}
                          width={Math.max(0, cutXPos - padding.left)}
                          height={Math.max(0, cutYPos - padding.top)}
                          fill="#fef2f2"
                          opacity="0.85"
                        />
                        {/* Q2 (Top Right) */}
                        <rect
                          x={cutXPos}
                          y={padding.top}
                          width={Math.max(0, padding.left + plotWidth - cutXPos)}
                          height={Math.max(0, cutYPos - padding.top)}
                          fill="#f0fdf4"
                          opacity="0.85"
                        />
                        {/* Q3 (Bottom Left) */}
                        <rect
                          x={padding.left}
                          y={cutYPos}
                          width={Math.max(0, cutXPos - padding.left)}
                          height={Math.max(0, padding.top + plotHeight - cutYPos)}
                          fill="#fffbeb"
                          opacity="0.85"
                        />
                        {/* Q4 (Bottom Right) */}
                        <rect
                          x={cutXPos}
                          y={cutYPos}
                          width={Math.max(0, padding.left + plotWidth - cutXPos)}
                          height={Math.max(0, padding.top + plotHeight - cutYPos)}
                          fill="#eff6ff"
                          opacity="0.85"
                        />

                        {/* Quadrant Watermark Labels */}
                        <text
                          x={padding.left + 14}
                          y={padding.top + 20}
                          fill="#dc2626"
                          fontSize="11"
                          fontWeight="bold"
                          opacity="0.75"
                        >
                          KUADRAN I: PRIORITAS UTAMA (Kebutuhan ↑, Kemampuan ↓)
                        </text>
                        <text
                          x={padding.left + plotWidth - 14}
                          y={padding.top + 20}
                          textAnchor="end"
                          fill="#16a34a"
                          fontSize="11"
                          fontWeight="bold"
                          opacity="0.75"
                        >
                          KUADRAN II: PERTAHANKAN (Kebutuhan ↑, Kemampuan ↑)
                        </text>
                        <text
                          x={padding.left + 14}
                          y={padding.top + plotHeight - 12}
                          fill="#d97706"
                          fontSize="11"
                          fontWeight="bold"
                          opacity="0.75"
                        >
                          KUADRAN III: PRIORITAS RENDAH (Kebutuhan ↓, Kemampuan ↓)
                        </text>
                        <text
                          x={padding.left + plotWidth - 14}
                          y={padding.top + plotHeight - 12}
                          textAnchor="end"
                          fill="#2563eb"
                          fontSize="11"
                          fontWeight="bold"
                          opacity="0.75"
                        >
                          KUADRAN IV: CENDERUNG BERLEBIH (Kebutuhan ↓, Kemampuan ↑)
                        </text>

                        {/* Grid Lines & Axis Ticks */}
                        {[1, 2, 3, 4, 5].map((val) => {
                          const x = xToSvg(val);
                          const y = yToSvg(val);
                          return (
                            <g key={`grid-${val}`}>
                              {/* Vertical Grid Line */}
                              <line
                                x1={x}
                                y1={padding.top}
                                x2={x}
                                y2={padding.top + plotHeight}
                                stroke="#e5e7eb"
                                strokeDasharray="3 3"
                              />
                              {/* Horizontal Grid Line */}
                              <line
                                x1={padding.left}
                                y1={y}
                                x2={padding.left + plotWidth}
                                y2={y}
                                stroke="#e5e7eb"
                                strokeDasharray="3 3"
                              />
                              {/* X Tick Label */}
                              <text
                                x={x}
                                y={padding.top + plotHeight + 18}
                                textAnchor="middle"
                                fontSize="11"
                                fill="#6b7280"
                                fontWeight="600"
                              >
                                {val.toFixed(1)}
                              </text>
                              {/* Y Tick Label */}
                              <text
                                x={padding.left - 12}
                                y={y + 4}
                                textAnchor="end"
                                fontSize="11"
                                fill="#6b7280"
                                fontWeight="600"
                              >
                                {val.toFixed(1)}
                              </text>
                            </g>
                          );
                        })}

                        {/* Cut-off Threshold Lines */}
                        {/* Vertical Cut-off Line (X) */}
                        <line
                          x1={cutXPos}
                          y1={padding.top}
                          x2={cutXPos}
                          y2={padding.top + plotHeight}
                          stroke="#1e293b"
                          strokeWidth="2"
                          strokeDasharray="5 4"
                        />
                        {/* Horizontal Cut-off Line (Y) */}
                        <line
                          x1={padding.left}
                          y1={cutYPos}
                          x2={padding.left + plotWidth}
                          y2={cutYPos}
                          stroke="#1e293b"
                          strokeWidth="2"
                          strokeDasharray="5 4"
                        />

                        {/* Cut-off Badges */}
                        <rect
                          x={cutXPos - 28}
                          y={padding.top - 24}
                          width="56"
                          height="18"
                          rx="4"
                          fill="#1e293b"
                        />
                        <text
                          x={cutXPos}
                          y={padding.top - 12}
                          textAnchor="middle"
                          fill="#fff"
                          fontSize="9"
                          fontWeight="bold"
                        >
                          X̄ = {chartCutoffs.cutX.toFixed(2)}
                        </text>

                        <rect
                          x={padding.left + plotWidth + 6}
                          y={cutYPos - 9}
                          width="54"
                          height="18"
                          rx="4"
                          fill="#1e293b"
                        />
                        <text
                          x={padding.left + plotWidth + 33}
                          y={cutYPos + 3}
                          textAnchor="middle"
                          fill="#fff"
                          fontSize="9"
                          fontWeight="bold"
                        >
                          Ȳ = {chartCutoffs.cutY.toFixed(2)}
                        </text>

                        {/* Main Axis Borders */}
                        <line
                          x1={padding.left}
                          y1={padding.top + plotHeight}
                          x2={padding.left + plotWidth}
                          y2={padding.top + plotHeight}
                          stroke="#374151"
                          strokeWidth="2"
                        />
                        <line
                          x1={padding.left}
                          y1={padding.top}
                          x2={padding.left}
                          y2={padding.top + plotHeight}
                          stroke="#374151"
                          strokeWidth="2"
                        />

                        {/* Axis Title Labels */}
                        <text
                          x={padding.left + plotWidth / 2}
                          y={padding.top + plotHeight + 42}
                          textAnchor="middle"
                          fontSize="12"
                          fontWeight="bold"
                          fill="#1f2937"
                        >
                          Tingkat Kemampuan / Penguasaan Saat Ini (X) →
                        </text>
                        <text
                          x={-padding.top - plotHeight / 2}
                          y={16}
                          transform="rotate(-90)"
                          textAnchor="middle"
                          fontSize="12"
                          fontWeight="bold"
                          fill="#1f2937"
                        >
                          Tingkat Kebutuhan Pengembangan (Y) →
                        </text>

                        {/* Plotted Competency Points */}
                        {competencyAnalysis.map((c) => {
                          const cx = xToSvg(c.kemampuan);
                          const cy = yToSvg(c.kebutuhan);
                          const isHovered = hoveredPoint?.id === c.id;
                          const isSelected = selectedCompetencyId === c.id;
                          const color = getQuadrantColor(c.quadrant);

                          return (
                            <g
                              key={c.id}
                              style={{ cursor: "pointer", transition: "transform .15s" }}
                              onMouseEnter={() => setHoveredPoint(c)}
                              onMouseLeave={() => setHoveredPoint(null)}
                              onClick={() =>
                                setSelectedCompetencyId(selectedCompetencyId === c.id ? null : c.id)
                              }
                            >
                              {/* Pulse / halo if selected or hovered */}
                              {(isHovered || isSelected) && (
                                <circle
                                  cx={cx}
                                  cy={cy}
                                  r="16"
                                  fill={color}
                                  opacity="0.25"
                                />
                              )}
                              {/* Main point circle */}
                              <circle
                                cx={cx}
                                cy={cy}
                                r={isHovered || isSelected ? "10" : "8"}
                                fill={color}
                                stroke="#fff"
                                strokeWidth="2.5"
                                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
                              />
                              {/* Code Label beside point */}
                              <text
                                x={cx + 12}
                                y={cy + 4}
                                fontSize="11"
                                fontWeight="800"
                                fill="#111827"
                                stroke="#ffffff"
                                strokeWidth="3"
                                paintOrder="stroke"
                              >
                                {c.code}
                              </text>
                            </g>
                          );
                        })}
                      </svg>

                      {/* Floating Interactive Tooltip */}
                      {hoveredPoint && (
                        <div
                          style={{
                            position: "absolute",
                            left: `${Math.min(75, Math.max(20, ((xToSvg(hoveredPoint.kemampuan) / svgWidth) * 100)))}%`,
                            top: `${Math.max(10, ((yToSvg(hoveredPoint.kebutuhan) / svgHeight) * 100) - 18)}%`,
                            transform: "translate(-50%, -100%)",
                            background: "#0f172a",
                            color: "#fff",
                            padding: "10px 14px",
                            borderRadius: "10px",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                            pointerEvents: "none",
                            zIndex: 10,
                            minWidth: "220px",
                            fontSize: "11px",
                          }}
                        >
                          <div style={{ fontWeight: 800, fontSize: "12px", color: "#38bdf8", marginBottom: "4px" }}>
                            [{hoveredPoint.code}] {hoveredPoint.title}
                          </div>
                          <div style={{ color: "#94a3b8", fontSize: "10px", marginBottom: "6px" }}>
                            Pilar: {hoveredPoint.pilar}
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", borderTop: "1px solid #334155", paddingTop: "6px" }}>
                            <div>Kemampuan: <b>{hoveredPoint.kemampuan.toFixed(2)}</b></div>
                            <div>Kebutuhan: <b>{hoveredPoint.kebutuhan.toFixed(2)}</b></div>
                          </div>
                          <div style={{ marginTop: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span>Gap (K - M):</span>
                            <b style={{ color: hoveredPoint.gap > 0 ? "#f87171" : "#4ade80" }}>
                              {hoveredPoint.gap > 0 ? `+${hoveredPoint.gap.toFixed(2)}` : hoveredPoint.gap.toFixed(2)}
                            </b>
                          </div>
                          <div style={{ marginTop: "4px", fontSize: "10px", fontWeight: "bold", color: getQuadrantColor(hoveredPoint.quadrant) }}>
                            Posisi: Kuadran {hoveredPoint.quadrant}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </section>

                {/* TABEL ANALISIS GAP PER POINT / KOMPETENSI */}
                <section className="card">
                  <div className="section-heading">
                    <span>RINCIAN SKOR & GAP</span>
                    <h2>Tabel Analisis Gap Per Poin Kompetensi</h2>
                    <p>
                      Daftar seluruh aspek kompetensi diurutkan dari skor prioritas tertinggi (Kebutuhan + Gap Positif). Nilai Gap = Tingkat Kebutuhan dikurangi Kemampuan saat ini.
                    </p>
                  </div>

                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Kode</th>
                          <th>Nama Kompetensi</th>
                          <th>Pilar / Kelompok</th>
                          <th>Kemampuan (X)</th>
                          <th>Kebutuhan (Y)</th>
                          <th>Nilai Gap</th>
                          <th>Posisi Kuadran</th>
                        </tr>
                      </thead>
                      <tbody>
                        {competencyAnalysis.map((c, index) => {
                          const isSelected = selectedCompetencyId === c.id;
                          return (
                            <tr
                              key={c.id}
                              style={{
                                background: isSelected ? "#f0fdf4" : undefined,
                                cursor: "pointer",
                              }}
                              onClick={() =>
                                setSelectedCompetencyId(selectedCompetencyId === c.id ? null : c.id)
                              }
                            >
                              <td><b>#{index + 1}</b></td>
                              <td><b>{c.code}</b></td>
                              <td>
                                <b>{c.title}</b>
                              </td>
                              <td style={{ color: "var(--muted)", fontSize: "10px" }}>{c.pilar}</td>
                              <td>
                                <b>{c.kemampuan.toFixed(2)}</b>
                              </td>
                              <td>
                                <b>{c.kebutuhan.toFixed(2)}</b>
                              </td>
                              <td>
                                <span
                                  className={`gap-tag ${
                                    c.gap >= 1.0
                                      ? "gap-pos-high"
                                      : c.gap > 0
                                      ? "gap-pos-med"
                                      : c.gap === 0
                                      ? "gap-zero"
                                      : "gap-neg"
                                  }`}
                                >
                                  {c.gap > 0 ? `+${c.gap.toFixed(2)}` : c.gap.toFixed(2)}
                                </span>
                              </td>
                              <td>
                                <span className={`badge-q badge-q${c.quadrant.toLowerCase()}`}>
                                  Kuadran {c.quadrant}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}

            {/* TAB 2: ANALISIS GAP PER ORANG (INDIVIDU) */}
            {activeTab === "orang" && (
              <>
                <section className="card">
                  <div className="section-heading">
                    <span>PROFIL INDIVIDU</span>
                    <h2>Analisis Kebutuhan & Gap Per Pegawai</h2>
                    <p>
                      Lihat rincian nilai kemampuan, kebutuhan, dan gap kompetensi untuk setiap pegawai/responden. Klik tombol "Plot ke Cartesius" untuk melihat diagram koordinat khusus pegawai tersebut.
                    </p>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="filter-card" style={{ marginTop: "16px" }}>
                    <div className="filter-item">
                      <label>Cari Nama / NIP</label>
                      <input
                        type="text"
                        placeholder="Ketik nama atau NIP..."
                        value={searchPerson}
                        onChange={(e) => setSearchPerson(e.target.value)}
                      />
                    </div>
                    <div className="filter-item">
                      <label>Filter Unit Kerja</label>
                      <select value={filterUnit} onChange={(e) => setFilterUnit(e.target.value)}>
                        <option value="ALL">Semua Unit Kerja</option>
                        {availableUnits.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="filter-item">
                      <label>Filter Jabatan</label>
                      <select value={filterJabatan} onChange={(e) => setFilterJabatan(e.target.value)}>
                        <option value="ALL">Semua Jabatan</option>
                        {availablePositions.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Person Cards List */}
                  {personList.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
                      Tidak ditemukan data pegawai yang sesuai dengan pencarian atau filter.
                    </div>
                  ) : (
                    <div>
                      {personList.map((p) => {
                        const isExpanded = expandedPersonId === p.id;
                        return (
                          <article key={p.id} className="person-card">
                            <div
                              className="person-header"
                              onClick={() => setExpandedPersonId(isExpanded ? null : p.id)}
                            >
                              <div className="person-info">
                                <h3>{p.nama}</h3>
                                <p>
                                  <b>NIP:</b> {p.nip} · <b>Unit:</b> {p.unit} · <b>Jabatan:</b> {p.jabatan} ({p.jenjang})
                                </p>
                              </div>
                              <div className="person-stats">
                                <div>
                                  <small style={{ display: "block", color: "var(--muted)", fontSize: "10px" }}>Rata-rata Gap</small>
                                  <span
                                    className={`gap-tag ${
                                      p.avgGap >= 1.0
                                        ? "gap-pos-high"
                                        : p.avgGap > 0
                                        ? "gap-pos-med"
                                        : p.avgGap === 0
                                        ? "gap-zero"
                                        : "gap-neg"
                                    }`}
                                  >
                                    {p.avgGap > 0 ? `+${p.avgGap.toFixed(2)}` : p.avgGap.toFixed(2)}
                                  </span>
                                </div>
                                {p.topGap && (
                                  <div style={{ maxWidth: "200px" }}>
                                    <small style={{ display: "block", color: "var(--muted)", fontSize: "10px" }}>Gap Tertinggi</small>
                                    <span style={{ fontSize: "11px", fontWeight: "bold", color: "#dc2626" }}>
                                      {p.topGap.kompetensi || p.topGap.id} (+{p.topGap.gap})
                                    </span>
                                  </div>
                                )}
                                <button
                                  className="button secondary"
                                  style={{ padding: "6px 12px", fontSize: "11px" }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPersonId(p.id);
                                    setActiveTab("diagram");
                                  }}
                                >
                                  🎯 Plot ke Cartesius
                                </button>
                                <span style={{ color: "var(--muted)", fontSize: "12px" }}>
                                  {isExpanded ? "▲ Tutup" : "▼ Detail"}
                                </span>
                              </div>
                            </div>

                            {/* Expanded Breakdown per Competency for this Person */}
                            {isExpanded && (
                              <div className="person-expanded">
                                <h4 style={{ margin: "0 0 10px", fontSize: "12px", color: "var(--navy)" }}>
                                  📊 Rincian Penilaian Kompetensi {p.nama}
                                </h4>
                                <div className="table-wrap">
                                  <table>
                                    <thead>
                                      <tr>
                                        <th>Kode</th>
                                        <th>Kompetensi</th>
                                        <th>Pilar</th>
                                        <th>Kemampuan</th>
                                        <th>Kebutuhan</th>
                                        <th>Nilai Gap</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {p.rawScores.map((s) => (
                                        <tr key={s.id}>
                                          <td><b>{s.kode || s.id}</b></td>
                                          <td>{s.kompetensi}</td>
                                          <td style={{ color: "var(--muted)", fontSize: "10px" }}>{s.kelompok}</td>
                                          <td>{s.penguasaan} / 5</td>
                                          <td>{s.kebutuhan} / 5</td>
                                          <td>
                                            <span
                                              className={`gap-tag ${
                                                Number(s.gap) >= 1.0
                                                  ? "gap-pos-high"
                                                  : Number(s.gap) > 0
                                                  ? "gap-pos-med"
                                                  : Number(s.gap) === 0
                                                  ? "gap-zero"
                                                  : "gap-neg"
                                              }`}
                                            >
                                              {Number(s.gap) > 0 ? `+${s.gap}` : s.gap}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "14px", fontSize: "11px" }}>
                                  <div style={{ background: "#f8fafb", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8ec" }}>
                                    <b>Bentuk Pengembangan yang Diminati:</b>
                                    <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                                      {Array.isArray(p.rawResponse.bentuk_pengembangan)
                                        ? p.rawResponse.bentuk_pengembangan.join(", ")
                                        : p.rawResponse.bentuk_pengembangan || "—"}
                                    </p>
                                  </div>
                                  <div style={{ background: "#f8fafb", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8ec" }}>
                                    <b>Topik Prioritas & Metode:</b>
                                    <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                                      {Array.isArray(p.rawResponse.topik_prioritas)
                                        ? p.rawResponse.topik_prioritas.join(", ")
                                        : p.rawResponse.topik_prioritas || "—"} · <i>Metode: {p.rawResponse.metode_pembelajaran || "—"}</i>
                                    </p>
                                  </div>
                                </div>
                                {p.rawResponse.kompetensi_lain && (
                                  <div style={{ marginTop: "10px", background: "#fffbeb", padding: "10px", borderRadius: "8px", border: "1px solid #fde68a", fontSize: "11px" }}>
                                    <b>Masukan Tambahan:</b> {p.rawResponse.kompetensi_lain}
                                  </div>
                                )}
                              </div>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              </>
            )}

            {/* TAB 3: REKAP DATA & CSV EXPORT */}
            {activeTab === "rekap" && (
              <section className="card">
                <div className="section-heading">
                  <span>DATA MENTAH SURVEI</span>
                  <h2>Daftar Seluruh Respons Masuk</h2>
                  <p>Ekspor seluruh hasil kuesioner ke format CSV untuk analisis spreadsheet atau arsip.</p>
                </div>
                <div className="actions" style={{ margin: "14px 0" }}>
                  <button className="button primary" onClick={exportCsv} disabled={!responses.length}>
                    📥 Unduh Rekap Lengkap (CSV)
                  </button>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Waktu Masuk</th>
                        <th>Nama & NIP</th>
                        <th>Unit Kerja</th>
                        <th>Jabatan</th>
                        <th>Gap Tertinggi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {responses.slice(0, 100).map((row) => {
                        const r = row.response || {};
                        const top = [...(r.scores || [])].sort((a, b) => Number(b.gap) - Number(a.gap))[0];
                        return (
                          <tr key={row.id}>
                            <td>{new Date(row.created_at).toLocaleString("id-ID")}</td>
                            <td>
                              <b>{r.nama || "—"}</b>
                              <br />
                              <small style={{ color: "var(--muted)" }}>NIP: {r.nip || "—"}</small>
                            </td>
                            <td>{r.unit || "—"}</td>
                            <td>
                              {r.jabatan || "—"}
                              {r.jenjang && r.jenjang !== "Tidak Berlaku / Bukan Pejabat Fungsional" && (
                                <small style={{ display: "block", color: "var(--muted)" }}>{r.jenjang}</small>
                              )}
                            </td>
                            <td>{top ? `${top.kompetensi} (+${top.gap})` : "—"}</td>
                          </tr>
                        );
                      })}
                      {!responses.length && (
                        <tr>
                          <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>
                            Belum ada respons masuk.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* TAB 4: EDITOR KUESIONER JSON */}
            {activeTab === "editor" && (
              <section className="card">
                <div className="section-heading">
                  <span>KONFIGURASI INSTRUMEN</span>
                  <h2>Editor Kuesioner</h2>
                  <p>
                    Perbarui judul, pengantar, daftar kompetensi dan kodenya, bentuk pengembangan, topik prioritas,
                    serta metode belajar. Gunakan format JSON yang valid.
                  </p>
                </div>
                <textarea
                  className="json-editor"
                  spellCheck="false"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <div className="actions" style={{ marginTop: "14px" }}>
                  <button className="button primary" onClick={saveConfig}>
                    💾 Simpan Perubahan Konfigurasi
                  </button>
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <footer className="footer">
        Lembaga Administrasi Negara Republik Indonesia (LAN RI) · Deputi Bidang Peningkatan Kualitas Kebijakan
      </footer>
    </div>
  );
}
