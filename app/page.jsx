"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DEFAULT_CONFIG } from "../lib/default-config";
import { getSupabase } from "../lib/supabase";

const units = ["Direktorat Strategi Peningkatan Kualitas Kebijakan Administrasi Negara", "Direktorat Advokasi dan Pengembangan Kinerja Kebijakan", "Direktorat Penguatan Kapasitas Jabatan Fungsional", "Bagian Tata Usaha / Sekretariat Deputi I"];
const positions = ["Pimpinan : Kepala / Deputi / Sekretaris / Kepala Pusat", "Administrator / Pengawas : Pejabat Pengelola Unit", "Fungsional : Widyaiswara, Analis Kebijakan, Perencana, Arsiparis, dll.", "Pelaksana : Pengolah data, Pengadministrasi, Pengelola Layanan, dll."];
const years = ["< 1 tahun", "1 – 3 tahun", "3 – 5 tahun", "> 5 tahun"];
const scale = ["Sangat tidak mampu", "Tidak mampu", "Cukup mampu", "Mampu", "Sangat mampu"];
const needScale = ["Sangat tidak membutuhkan", "Tidak membutuhkan", "Cukup membutuhkan", "Membutuhkan", "Sangat membutuhkan"];

function Field({ label, children }) { return <label className="field"><span>{label}</span>{children}</label>; }
function Select({ options, value, onChange, placeholder }) { return <select value={value} onChange={onChange} required><option value="">{placeholder}</option>{options.map(x => <option key={x}>{x}</option>)}</select>; }
function Checks({ name, options, value, onChange }) { return <div className="choice-grid">{options.map(x => <label className="choice" key={x}><input type="checkbox" name={name} checked={value.includes(x)} onChange={() => onChange(x)} /><span>{x}</span></label>)}</div>; }

export default function SurveyPage() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({ nama: "", nip: "", unit: "", jabatan: "", jenjang: "Tidak Berlaku / Bukan Pejabat Fungsional", masa_kerja: "" });
  const [scores, setScores] = useState({});
  const [formats, setFormats] = useState([]);
  const [formatOther, setFormatOther] = useState("");
  const [topics, setTopics] = useState([]);
  const [topicOther, setTopicOther] = useState("");
  const [method, setMethod] = useState("");
  const [methodOther, setMethodOther] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [notice, setNotice] = useState("");
  const db = getSupabase();

  useEffect(() => {
    let alive = true;
    if (db) db.from("survey_config").select("config").eq("id", "main").maybeSingle().then(({ data }) => {
      if (alive && data?.config?.developmentFormats?.length && data?.config?.competencies?.length) setConfig({ ...DEFAULT_CONFIG, ...data.config });
    });
    return () => { alive = false; };
  }, []);

  function setProfileField(key, value) { setProfile(prev => ({ ...prev, [key]: value })); }
  function toggle(list, setter, value, max = Infinity) { setter(prev => prev.includes(value) ? prev.filter(x => x !== value) : prev.length < max ? [...prev, value] : prev); }
  function next() {
    if (step === 1 && (!profile.nama.trim() || !profile.nip.trim() || !profile.unit || !profile.jabatan || !profile.masa_kerja)) { setNotice("Lengkapi nama lengkap, NIP, unit kerja, jenis jabatan, dan masa kerja terlebih dahulu."); return; }
    if (step === 2 && config.competencies.some(c => !scores[c.id]?.mastery || !scores[c.id]?.need)) { setNotice("Berikan penilaian kemampuan dan kebutuhan untuk semua pernyataan."); return; }
    if (step === 3 && (!formats.length || !topics.length || !method)) { setNotice("Pilih setidaknya satu bentuk pengembangan, topik prioritas, dan metode pembelajaran."); return; }
    setNotice(""); setStep(n => Math.min(4, n + 1)); window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function back() { setNotice(""); setStep(n => Math.max(1, n - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }
  async function submit(e) {
    e.preventDefault(); setNotice("");
    if (!db) { setNotice("Konfigurasi Supabase belum tersedia. Silakan hubungi administrator."); return; }
    setBusy(true);
    const response = {
      ...profile, nama: profile.nama.trim(), nip: profile.nip.trim(),
      scores: config.competencies.map(c => ({ id: c.id, kode: c.code || c.id, kelompok: c.pilar, kompetensi: c.title, penguasaan: Number(scores[c.id].mastery), kebutuhan: Number(scores[c.id].need), gap: Number(scores[c.id].need) - Number(scores[c.id].mastery) })),
      bentuk_pengembangan: [...formats.filter(x => x !== "Lainnya"), ...(formats.includes("Lainnya") && formatOther.trim() ? [formatOther.trim()] : [])],
      topik_prioritas: [...topics.filter(x => x !== "Lainnya"), ...(topics.includes("Lainnya") && topicOther.trim() ? [topicOther.trim()] : [])],
      metode_pembelajaran: method === "Lainnya" ? methodOther.trim() || "Lainnya" : method,
      kompetensi_lain: suggestion,
    };
    const { error } = await db.from("survey_responses").insert({ response });
    setBusy(false);
    if (error) { setNotice(`Jawaban belum terkirim: ${error.message}`); return; }
    setDone(true); window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const progress = done ? 100 : step * 25;
  return <div className="site-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark">LAN RI</span><span><b>Deputi Bidang Peningkatan Kualitas Kebijakan</b><small>Bigger • Smarter • Better</small></span></div></header>
    <main className="container">
      <section className="hero"><div className="eyebrow">Analisis Kebutuhan Pengembangan Kompetensi (AKPK)</div><h1>{config.surveyTitle}</h1><p>{config.intro}</p><div className="hero-meta"><span>Estimasi waktu: 6–8 menit</span><span>Skala penilaian 1–5</span><span>Pengembangan kapasitas SME</span></div></section>
      {notice && <div className="notice" role="alert">{notice}</div>}
      {done ? <section className="card success"><div className="success-icon">✓</div><h2>Terima kasih!</h2><p>Jawaban survei kebutuhan bangkom Anda telah berhasil dikirim dan tercatat.</p><p>Masukan Bapak/Ibu akan membantu perencanaan program pengembangan kompetensi Deputi I LAN RI.</p></section> : <>
        <section className="progress-card"><div><span>Kemajuan: {progress}%</span><b>Bagian {step} dari 4</b></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div></section>
        <form onSubmit={submit}>
          {step === 1 && <section className="card form-section"><SectionHeading n="1" title="Profil Responden" desc="Lengkapi data unit kerja dan profil jabatan Anda." />
            <div className="form-grid"><Field label="Nama Lengkap *"><input required autoComplete="name" value={profile.nama} onChange={e => setProfileField("nama", e.target.value)} placeholder="Masukkan nama lengkap" /></Field><Field label="NIP *"><input required inputMode="numeric" autoComplete="off" value={profile.nip} onChange={e => setProfileField("nip", e.target.value)} placeholder="Masukkan NIP" /></Field></div>
            <Field label="Direktorat / Unit Kerja *"><Select options={units} value={profile.unit} onChange={e => setProfileField("unit", e.target.value)} placeholder="Pilih unit kerja" /></Field>
            <div className="form-grid"><Field label="Kategori / Jenis Jabatan *"><Select options={positions} value={profile.jabatan} onChange={e => setProfileField("jabatan", e.target.value)} placeholder="Pilih jenis jabatan" /></Field><Field label="Jenjang Jabatan Fungsional"><Select options={["Tidak Berlaku / Bukan Pejabat Fungsional", "Ahli Pertama / Terampil", "Ahli Muda / Mahir", "Ahli Madya / Penyelia", "Ahli Utama"]} value={profile.jenjang} onChange={e => setProfileField("jenjang", e.target.value)} /></Field></div>
            <Field label="Masa kerja di lingkungan Deputi I LAN RI *"><RadioList name="masa" options={years} value={profile.masa_kerja} onChange={v => setProfileField("masa_kerja", v)} compact /></Field><Nav next={next} nextLabel="Lanjut ke Penilaian Kompetensi →" />
          </section>}
          {step === 2 && <section className="card form-section"><SectionHeading n="2" title="Penilaian Kompetensi" desc="Nilai setiap pernyataan berdasarkan kemampuan Anda saat ini dan kebutuhan pengembangan kompetensi." />
            <div className="scale-help"><p><b>Kemampuan saat ini</b><br />{scale.map((x, i) => `${i + 1} ${x}`).join(" · ")}</p><p><b>Kebutuhan pengembangan</b><br />{needScale.map((x, i) => `${i + 1} ${x}`).join(" · ")}</p></div>
            {[...new Set(config.competencies.map(c => c.pilar))].map((pilar, groupIndex) => <div className="competency-group" key={pilar}><h3>{String.fromCharCode(65 + groupIndex)}. {pilar}</h3><div className="competency-list">{config.competencies.filter(c => c.pilar === pilar).map(c => <article className="competency" key={c.id}><div><small>{c.code || c.id}</small><b>{c.title}</b></div><Rating name={`${c.id}-mastery`} label="Kemampuan saat ini" value={scores[c.id]?.mastery || ""} labels={scale} onChange={v => setScores(s => ({ ...s, [c.id]: { ...s[c.id], mastery: v } }))} /><Rating name={`${c.id}-need`} label="Kebutuhan pengembangan" value={scores[c.id]?.need || ""} labels={needScale} onChange={v => setScores(s => ({ ...s, [c.id]: { ...s[c.id], need: v } }))} /></article>)}</div></div>)}<Nav back={back} next={next} />
          </section>}
          {step === 3 && <section className="card form-section"><SectionHeading n="3" title="Identifikasi Kebutuhan Pengembangan" desc="Pilih jenis, topik, dan metode pengembangan kompetensi yang paling sesuai." />
            <Field label="Bentuk pengembangan kompetensi yang paling dibutuhkan (pilih maksimal 3) *"><Checks name="formats" options={config.developmentFormats} value={formats} onChange={v => toggle(formats, setFormats, v, 3)} /></Field>{formats.includes("Lainnya") && <Field label="Bentuk pengembangan lainnya"><input value={formatOther} onChange={e => setFormatOther(e.target.value)} placeholder="Tuliskan bentuk yang dibutuhkan" /></Field>}
            <Field label="Topik / kompetensi yang paling diprioritaskan (pilih maksimal 3) *"><Checks name="topics" options={config.priorityTopics} value={topics} onChange={v => toggle(topics, setTopics, v, 3)} /></Field>{topics.includes("Lainnya") && <Field label="Topik lainnya"><input value={topicOther} onChange={e => setTopicOther(e.target.value)} placeholder="Tuliskan topik prioritas" /></Field>}
            <Field label="Metode pembelajaran yang paling sesuai *"><RadioList name="method" options={config.learningMethods} value={method} onChange={setMethod} /></Field>{method === "Lainnya" && <Field label="Metode pembelajaran lainnya"><input value={methodOther} onChange={e => setMethodOther(e.target.value)} placeholder="Tuliskan metode yang sesuai" /></Field>}<Nav back={back} next={next} />
          </section>}
          {step === 4 && <section className="card form-section"><SectionHeading n="4" title="Masukan Tambahan" desc="Tambahkan kebutuhan kompetensi yang belum tercakup dalam pilihan sebelumnya." /><Field label="Kompetensi atau topik lain yang perlu dikembangkan untuk mendukung tugas SME"><textarea rows={5} value={suggestion} onChange={e => setSuggestion(e.target.value)} placeholder="Tuliskan kompetensi atau topik yang Anda usulkan" /></Field><div className="nav-row"><button type="button" className="button secondary" onClick={back}>Kembali</button><button type="submit" className="button primary" disabled={busy}>{busy ? "Mengirim…" : "Kirim jawaban"}</button></div></section>}
        </form>
      </>}
    </main><footer className="footer">Lembaga Administrasi Negara Republik Indonesia (LAN RI) · Deputi Bidang Peningkatan Kualitas Kebijakan Administrasi Negara</footer>
  </div>;
}

function SectionHeading({ n, title, desc }) { return <div className="section-heading"><span>Bagian {n}</span><h2>{title}</h2><p>{desc}</p></div>; }
function Nav({ back, next, nextLabel = "Lanjut" }) { return <div className={`nav-row ${back ? "between" : "end"}`}>{back && <button type="button" className="button secondary" onClick={back}>Kembali</button>}<button type="button" className={`button primary ${nextLabel.startsWith("Lanjut ke Penilaian") ? "continue-specific" : ""}`} onClick={next}>{nextLabel}</button></div>; }
function RadioList({ name, options, value, onChange, compact = false }) { return <div className={`choice-grid ${compact ? "tenure-choices" : ""}`}>{options.map(x => <label className="choice" key={x}><input type="radio" name={name} checked={value === x} onChange={() => onChange(x)} /><span>{x}</span></label>)}</div>; }
function Rating({ name, label, value, labels, onChange }) { return <fieldset className="rating"><legend>{label}</legend><div>{[1, 2, 3, 4, 5].map(n => <label key={n} className={String(n) === String(value) ? "selected" : ""}><input type="radio" name={name} checked={String(n) === String(value)} onChange={() => onChange(n)} /><span title={labels[n - 1]}>{n}</span></label>)}</div><small>{value ? labels[Number(value) - 1] : "Pilih nilai 1–5"}</small></fieldset>; }
