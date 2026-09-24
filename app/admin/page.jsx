"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DEFAULT_CONFIG } from "../../lib/default-config";
import { getSupabase } from "../../lib/supabase";

export default function AdminPage() {
  const db = getSupabase();
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [draft, setDraft] = useState(JSON.stringify(DEFAULT_CONFIG, null, 2));
  const [responses, setResponses] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!db) return;
    let alive = true;
    db.auth.getSession().then(({ data }) => alive && setSession(data.session));
    const { data: listener } = db.auth.onAuthStateChange((_event, value) => setSession(value));
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (session && db) load();
  }, [session]);

  async function load() {
    setBusy(true); setError(false);
    const [configResult, responseResult] = await Promise.all([
      db.from("survey_config").select("config").eq("id", "main").maybeSingle(),
      db.from("survey_responses").select("id,created_at,response").order("created_at", { ascending: false }).limit(5000),
    ]);
    setBusy(false);
    const issue = configResult.error || responseResult.error;
    if (issue) { notify(issue.message, true); return; }
    const next = configResult.data?.config?.developmentFormats?.length && configResult.data?.config?.competencies?.length ? { ...DEFAULT_CONFIG, ...configResult.data.config } : DEFAULT_CONFIG;
    setConfig(next); setDraft(JSON.stringify(next, null, 2)); setResponses(responseResult.data || []);
  }

  function notify(text, isError = false) { setMessage(text); setError(isError); }
  async function signIn(e) {
    e.preventDefault(); if (!db) return notify("Tambahkan kredensial Supabase melalui environment variables.", true);
    const { error: issue } = await db.auth.signInWithPassword({ email, password });
    if (issue) notify(issue.message, true); else { setPassword(""); notify("Login berhasil."); }
  }
  async function saveConfig() {
    try {
      const next = JSON.parse(draft);
      if (!next.surveyTitle || !next.intro || !Array.isArray(next.competencies) || !next.competencies.length || !Array.isArray(next.developmentFormats) || !next.developmentFormats.length || !Array.isArray(next.priorityTopics) || !Array.isArray(next.learningMethods)) throw new Error("Pastikan judul, pengantar, competencies, developmentFormats, priorityTopics, dan learningMethods tersedia.");
      if (next.competencies.some(x => !x.id || !x.title || !x.pilar) || next.developmentFormats.some(x => typeof x !== "string") || next.priorityTopics.some(x => typeof x !== "string") || next.learningMethods.some(x => typeof x !== "string")) throw new Error("Kompetensi perlu memiliki id, title, dan pilar. Pilihan pengembangan ditulis sebagai teks.");
      const { data: { user } } = await db.auth.getUser();
      const { error: issue } = await db.from("survey_config").upsert({ id: "main", config: next, updated_at: new Date().toISOString(), updated_by: user.id });
      if (issue) throw issue;
      setConfig(next); notify("Konfigurasi tersimpan dan berlaku untuk survei berikutnya.");
    } catch (e) { notify(e.message, true); }
  }

  const priorities = config.competencies.map(c => {
    const values = responses.map(row => (row.response?.scores || []).find(s => s.id === c.id)).filter(Boolean);
    const need = values.length ? values.reduce((n, x) => n + Number(x.kebutuhan || 0), 0) / values.length : 0;
    const gap = values.length ? values.reduce((n, x) => n + Number(x.gap || 0), 0) / values.length : 0;
    return { title: c.title, need, gap, priority: need + Math.max(0, gap) };
  }).sort((a, b) => b.priority - a.priority);

  function exportCsv() {
    const fields = ["created_at", "nama", "unit", "jabatan", "jenjang", "masa_kerja", "bentuk_pengembangan", "topik_prioritas", "metode_pembelajaran", "kompetensi_lain", "hari", "waktu", "sme_kegiatan", "sme_topik", "kendala", "kontribusi", "topik_kontribusi", "saran", ...config.competencies.flatMap(c => [`${c.code || c.id} ${c.title} - kemampuan`, `${c.code || c.id} ${c.title} - kebutuhan`, `${c.code || c.id} ${c.title} - gap`])];
    const cell = x => {
      let value = String(Array.isArray(x) ? x.join("; ") : x ?? "");
      if (/^[=+@\-\t\r]/.test(value)) value = `'${value}`;
      return `"${value.replaceAll('"', '""')}"`;
    };
    const lines = [fields.map(cell).join(",")];
    responses.forEach(row => {
      const r = row.response || {}; const score = Object.fromEntries((r.scores || []).map(s => [s.id, s]));
      const values = [row.created_at, r.nama, r.unit, r.jabatan, r.jenjang, r.masa_kerja, r.bentuk_pengembangan, r.topik_prioritas, r.metode_pembelajaran, r.kompetensi_lain, r.hari, r.waktu, r.sme_kegiatan, r.sme_topik, r.kendala, r.kontribusi, r.topik_kontribusi, r.saran];
      config.competencies.forEach(c => { const s = score[c.id] || {}; values.push(s.penguasaan, s.kebutuhan, s.gap); });
      lines.push(values.map(cell).join(","));
    });
    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `rekap-bangkom-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
  }

  return <div className="site-shell"><header className="topbar"><div className="brand"><span className="brand-mark">LAN RI</span><span><b>Administrator Survei Bangkom</b><small>Deputi I · LAN RI</small></span></div><Link href="/" className="admin-link">Ke survei</Link></header><main className="container admin-container">
    {message && <div className={`notice ${error ? "error" : ""}`} role="status">{message}</div>}
    {!session ? <section className="card login-card"><div className="section-heading"><span>Area administrator</span><h1>Masuk ke dashboard</h1><p>Gunakan akun admin yang dibuat dari Supabase Authentication.</p></div><form onSubmit={signIn} className="stack"><label className="field"><span>Email</span><input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></label><label className="field"><span>Kata sandi</span><input type="password" required value={password} onChange={e => setPassword(e.target.value)} /></label><button className="button primary" disabled={busy}>Masuk</button></form></section> : <>
      <div className="admin-title"><div><span className="eyebrow dark">PENGELOLAAN DATA</span><h1>Dashboard survei</h1></div><div className="actions"><button className="button secondary" onClick={load} disabled={busy}>{busy ? "Memuat…" : "Muat ulang"}</button><button className="button secondary" onClick={() => db.auth.signOut()}>Keluar</button></div></div>
      <section className="stats-grid"><article className="stat-card"><span>Total respons</span><b>{responses.length}</b></article><article className="stat-card"><span>Kompetensi dianalisis</span><b>{config.competencies.length}</b></article><article className="stat-card"><span>Respons terbaru</span><b className="stat-small">{responses[0] ? new Date(responses[0].created_at).toLocaleDateString("id-ID") : "Belum ada"}</b></article></section>
      <section className="card"><div className="section-heading"><span>Analisis kebutuhan</span><h2>Prioritas kompetensi</h2><p>Urutan praktis memakai rata-rata kebutuhan ditambah gap positif.</p></div><div className="table-wrap"><table><thead><tr><th>#</th><th>Kompetensi</th><th>Rata-rata kebutuhan</th><th>Rata-rata gap</th></tr></thead><tbody>{priorities.map((x, i) => <tr key={x.title}><td>{i + 1}</td><td>{x.title}</td><td>{x.need.toFixed(2)}</td><td>{x.gap > 0 ? "+" : ""}{x.gap.toFixed(2)}</td></tr>)}</tbody></table></div></section>
      <section className="card"><div className="section-heading"><span>Data mentah</span><h2>Respons masuk</h2><p>Ekspor memuat jawaban lengkap. Lindungi file hasil unduhan.</p></div><div className="actions"><button className="button primary" onClick={exportCsv} disabled={!responses.length}>Unduh CSV</button></div><div className="table-wrap"><table><thead><tr><th>Waktu</th><th>Unit</th><th>Jabatan</th><th>Gap tertinggi</th></tr></thead><tbody>{responses.slice(0, 50).map(row => { const r = row.response || {}; const top = [...(r.scores || [])].sort((a, b) => Number(b.gap) - Number(a.gap))[0]; return <tr key={row.id}><td>{new Date(row.created_at).toLocaleString("id-ID")}</td><td>{r.unit || "—"}</td><td>{r.jabatan || "—"}</td><td>{top ? `${top.kompetensi} (+${top.gap})` : "—"}</td></tr>; })}{!responses.length && <tr><td colSpan="4">Belum ada respons.</td></tr>}</tbody></table></div></section>
      <section className="card"><div className="section-heading"><span>Konfigurasi aktif</span><h2>Editor kuesioner</h2><p>Perbarui judul, pengantar, pernyataan kompetensi per kelompok, bentuk pengembangan, topik prioritas, dan metode belajar. Gunakan JSON yang valid. Respons lama tetap tersimpan dengan struktur sebelumnya.</p></div><textarea className="json-editor" spellCheck="false" value={draft} onChange={e => setDraft(e.target.value)} /><div className="actions"><button className="button primary" onClick={saveConfig}>Simpan perubahan</button></div></section>
    </>}
  </main><footer className="footer">Akses dashboard hanya untuk akun administrator.</footer></div>;
}
