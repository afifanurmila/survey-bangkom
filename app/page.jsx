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

function Field({ label, children, error, id }) { return <div className={`field ${error ? "has-error" : ""}`}>{id ? <label className="field-label" htmlFor={id}>{label}</label> : <span className="field-label">{label}</span>}{children}{error && <small className="field-error" role="alert">{error}</small>}</div>; }
function Select({ id, options, value, onChange, placeholder }) { return <select id={id} aria-label={placeholder} value={value} onChange={onChange} required><option value="">{placeholder}</option>{options.map(x => <option key={x}>{x}</option>)}</select>; }
function Checks({ name, options, value, onChange }) { return <div className="choice-grid" role="group" aria-label={name}>{options.map(x => <label className="answer-choice" key={x}><input type="checkbox" name={name} checked={value.includes(x)} onChange={() => onChange(x)} /><span>{x}</span></label>)}</div>; }

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
  const [validationErrors, setValidationErrors] = useState({});
  const db = getSupabase();

  useEffect(() => {
    let alive = true;
    if (db) db.from("survey_config").select("config").eq("id", "main").maybeSingle().then(({ data }) => {
      if (alive && data?.config?.developmentFormats?.length && data?.config?.competencies?.length) setConfig({ ...DEFAULT_CONFIG, ...data.config });
    });
    return () => { alive = false; };
  }, []);

  function setProfileField(key, value) { setProfile(prev => ({ ...prev, [key]: value })); setValidationErrors(prev => ({ ...prev, [key]: "" })); }
  function setScore(id, key, value) { setScores(prev => ({ ...prev, [id]: { ...prev[id], [key]: value } })); setValidationErrors(prev => ({ ...prev, [`${key}-${id}`]: "" })); }
  function clearValidation(key) { setValidationErrors(prev => ({ ...prev, [key]: "" })); }
  function toggle(list, setter, value, max = Infinity) { setter(prev => prev.includes(value) ? prev.filter(x => x !== value) : prev.length < max ? [...prev, value] : prev); }
  function next() {
    const errors = {};
    if (step === 1) {
      if (!profile.nama.trim()) errors.nama = "Nama lengkap wajib diisi.";
      if (!profile.nip.trim()) errors.nip = "NIP wajib diisi.";
      if (!profile.unit) errors.unit = "Unit kerja wajib dipilih.";
      if (!profile.jabatan) errors.jabatan = "Jenis jabatan wajib dipilih.";
      if (!profile.masa_kerja) errors.masa_kerja = "Masa kerja wajib dipilih.";
    }
    if (step >= 2 && step <= 6) {
      const currentGroup = [...new Set(config.competencies.map(c => c.pilar))][step - 2];
      config.competencies.filter(c => c.pilar === currentGroup).forEach(c => {
        if (!scores[c.id]?.mastery) errors[`mastery-${c.id}`] = "Wajib diisi.";
        if (!scores[c.id]?.need) errors[`need-${c.id}`] = "Wajib diisi.";
      });
    }
    if (step === 7) {
      if (!formats.length) errors.formats = "Pilih setidaknya satu bentuk pengembangan.";
      if (formats.includes("Lainnya") && !formatOther.trim()) errors.formatOther = "Tuliskan bentuk pengembangan lainnya.";
      if (!topics.length) errors.topics = "Pilih setidaknya satu topik prioritas.";
      if (topics.includes("Lainnya") && !topicOther.trim()) errors.topicOther = "Tuliskan topik lainnya.";
      if (!method) errors.method = "Metode pembelajaran wajib dipilih.";
      if (method === "Lainnya" && !methodOther.trim()) errors.methodOther = "Tuliskan metode pembelajaran lainnya.";
    }
    setValidationErrors(errors);
    if (Object.keys(errors).length) { setNotice("Periksa isian yang ditandai. Pertanyaan tersebut wajib diisi."); return; }
    setNotice(""); setStep(n => Math.min(8, n + 1)); window.scrollTo({ top: 0, behavior: "smooth" });
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

  const progress = done ? 100 : Math.round(step / 8 * 100);
  const competencyGroups = [...new Set(config.competencies.map(c => c.pilar))];
  const groupIndex = step - 2;
  const groupTitle = competencyGroups[groupIndex];
  const groupLetter = String.fromCharCode(65 + groupIndex);
  return <div className="site-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark">LAN RI</span><span><b>Deputi Bidang Peningkatan Kualitas Kebijakan</b><small>Bigger • Smarter • Better</small></span></div></header>
    <main className="container">
      <section className="hero"><div className="eyebrow">Analisis Kebutuhan Pengembangan Kompetensi (AKPK)</div><h1>{config.surveyTitle}</h1><p>{config.intro}</p><div className="hero-meta"><span>Estimasi waktu: 6–8 menit</span><span>Skala penilaian 1–5</span><span>Pengembangan kapasitas SME</span></div></section>
      {notice && <div className="notice" role="alert">{notice}</div>}
      {done ? <section className="card success"><div className="success-icon">✓</div><h2>Terima kasih!</h2><p>Jawaban survei kebutuhan bangkom Anda telah berhasil dikirim dan tercatat.</p><p>Masukan Bapak/Ibu akan membantu perencanaan program pengembangan kompetensi Deputi I LAN RI.</p></section> : <>
        <section className="progress-card"><div><span>Kemajuan: {progress}%</span><b>Halaman {step} dari 8</b></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div></section>
        <form onSubmit={submit}>
          {step === 1 && <section className="card form-section"><SectionHeading n="1" title="Profil Responden" desc="Lengkapi data unit kerja dan profil jabatan Anda." />
            <div className="form-grid"><Field id="nama" label="Nama Lengkap *" error={validationErrors.nama}><input id="nama" required autoComplete="name" aria-invalid={Boolean(validationErrors.nama)} value={profile.nama} onChange={e => setProfileField("nama", e.target.value)} placeholder="Masukkan nama lengkap" /></Field><Field id="nip" label="NIP *" error={validationErrors.nip}><input id="nip" required inputMode="numeric" autoComplete="off" aria-invalid={Boolean(validationErrors.nip)} value={profile.nip} onChange={e => setProfileField("nip", e.target.value)} placeholder="Masukkan NIP" /></Field></div>
            <Field id="unit" label="Direktorat / Unit Kerja *" error={validationErrors.unit}><Select id="unit" options={units} value={profile.unit} onChange={e => setProfileField("unit", e.target.value)} placeholder="Pilih unit kerja" /></Field>
            <div className="form-grid"><Field id="jabatan" label="Kategori / Jenis Jabatan *" error={validationErrors.jabatan}><Select id="jabatan" options={positions} value={profile.jabatan} onChange={e => setProfileField("jabatan", e.target.value)} placeholder="Pilih jenis jabatan" /></Field><Field id="jenjang" label="Jenjang Jabatan Fungsional"><Select id="jenjang" options={["Tidak Berlaku / Bukan Pejabat Fungsional", "Ahli Pertama / Terampil", "Ahli Muda / Mahir", "Ahli Madya / Penyelia", "Ahli Utama"]} value={profile.jenjang} onChange={e => setProfileField("jenjang", e.target.value)} /></Field></div>
            <Field label="Masa kerja di lingkungan Deputi I LAN RI *" error={validationErrors.masa_kerja}><RadioList name="masa" options={years} value={profile.masa_kerja} onChange={v => setProfileField("masa_kerja", v)} compact /></Field><Nav next={next} nextLabel="Lanjut ke Penilaian Kompetensi →" />
          </section>}
          {step >= 2 && step <= 6 && <section className="card form-section"><SectionHeading n={`Poin ${groupLetter} dari E`} title={groupTitle} desc="Nilai setiap pernyataan berdasarkan kemampuan Anda saat ini dan kebutuhan pengembangan kompetensi." />
            <div className="scale-help"><p><b>Kemampuan saat ini</b><br />{scale.map((x, i) => `${i + 1} ${x}`).join(" · ")}</p><p><b>Kebutuhan pengembangan</b><br />{needScale.map((x, i) => `${i + 1} ${x}`).join(" · ")}</p></div>
            <div className="competency-group"><div className="competency-list">{config.competencies.filter(c => c.pilar === groupTitle).map(c => <article className="competency" key={c.id}><div><small>{c.code || c.id}</small><b>{c.title}</b></div><Rating name={`${c.id}-mastery`} label="Kemampuan saat ini" value={scores[c.id]?.mastery || ""} labels={scale} error={validationErrors[`mastery-${c.id}`]} onChange={v => setScore(c.id, "mastery", v)} /><Rating name={`${c.id}-need`} label="Kebutuhan pengembangan" value={scores[c.id]?.need || ""} labels={needScale} error={validationErrors[`need-${c.id}`]} onChange={v => setScore(c.id, "need", v)} /></article>)}</div></div><Nav back={back} next={next} nextLabel={step < 6 ? `Lanjut ke poin ${String.fromCharCode(66 + groupIndex)} →` : "Lanjut ke Identifikasi Kebutuhan →"} />
          </section>}
          {step === 7 && <section className="card form-section"><SectionHeading n="7" title="Identifikasi Kebutuhan Pengembangan" desc="Pilih jenis, topik, dan metode pengembangan kompetensi yang paling sesuai." />
            <Field label="Bentuk pengembangan kompetensi yang paling dibutuhkan (pilih maksimal 3) *" error={validationErrors.formats}><Checks name="formats" options={config.developmentFormats} value={formats} onChange={v => { toggle(formats, setFormats, v, 3); clearValidation("formats"); }} /></Field>{formats.includes("Lainnya") && <Field id="formatOther" label="Bentuk pengembangan lainnya *" error={validationErrors.formatOther}><input id="formatOther" value={formatOther} onChange={e => { setFormatOther(e.target.value); clearValidation("formatOther"); }} placeholder="Tuliskan bentuk yang dibutuhkan" /></Field>}
            <Field label="Topik / kompetensi yang paling diprioritaskan (pilih maksimal 3) *" error={validationErrors.topics}><Checks name="topics" options={config.priorityTopics} value={topics} onChange={v => { toggle(topics, setTopics, v, 3); clearValidation("topics"); }} /></Field>{topics.includes("Lainnya") && <Field id="topicOther" label="Topik lainnya *" error={validationErrors.topicOther}><input id="topicOther" value={topicOther} onChange={e => { setTopicOther(e.target.value); clearValidation("topicOther"); }} placeholder="Tuliskan topik prioritas" /></Field>}
            <Field label="Metode pembelajaran yang paling sesuai *" error={validationErrors.method}><RadioList name="method" options={config.learningMethods} value={method} onChange={v => { setMethod(v); clearValidation("method"); }} /></Field>{method === "Lainnya" && <Field id="methodOther" label="Metode pembelajaran lainnya *" error={validationErrors.methodOther}><input id="methodOther" value={methodOther} onChange={e => { setMethodOther(e.target.value); clearValidation("methodOther"); }} placeholder="Tuliskan metode yang sesuai" /></Field>}<Nav back={back} next={next} />
          </section>}
          {step === 8 && <section className="card form-section"><SectionHeading n="8" title="Masukan Tambahan" desc="Tambahkan kebutuhan kompetensi yang belum tercakup dalam pilihan sebelumnya." /><Field label="Kompetensi atau topik lain yang perlu dikembangkan untuk mendukung tugas SME"><textarea rows={5} value={suggestion} onChange={e => setSuggestion(e.target.value)} placeholder="Tuliskan kompetensi atau topik yang Anda usulkan" /></Field><div className="nav-row"><button type="button" className="button secondary" onClick={back}>Kembali</button><button type="submit" className="button primary" disabled={busy}>{busy ? "Mengirim…" : "Kirim jawaban"}</button></div></section>}
        </form>
      </>}
    </main><footer className="footer">Lembaga Administrasi Negara Republik Indonesia (LAN RI) · Deputi Bidang Peningkatan Kualitas Kebijakan Administrasi Negara</footer>
  </div>;
}

function SectionHeading({ n, title, desc }) { return <div className="section-heading"><span>{String(n).startsWith("Poin ") ? n : `Bagian ${n}`}</span><h2>{title}</h2><p>{desc}</p></div>; }
function Nav({ back, next, nextLabel = "Lanjut" }) { return <div className={`nav-row ${back ? "between" : "end"}`}>{back && <button type="button" className="button secondary" onClick={back}>Kembali</button>}<button type="button" className={`button primary ${nextLabel.startsWith("Lanjut ke Penilaian") ? "continue-specific" : ""}`} onClick={next}>{nextLabel}</button></div>; }
function RadioList({ name, options, value, onChange, compact = false }) { return <div className={`choice-grid ${compact ? "tenure-choices" : ""}`} role="radiogroup" aria-label={name}>{options.map(x => <label className={compact ? "choice" : "answer-choice"} key={x}><input type="radio" name={name} checked={value === x} onChange={() => onChange(x)} /><span>{x}</span></label>)}</div>; }
function Rating({ name, label, value, labels, error, onChange }) { return <fieldset className={`rating ${error ? "has-error" : ""}`}><legend>{label}</legend><div>{[1, 2, 3, 4, 5].map(n => <label key={n} className={String(n) === String(value) ? "selected" : ""}><input type="radio" name={name} required checked={String(n) === String(value)} onChange={() => onChange(n)} /><span title={labels[n - 1]}>{n}</span></label>)}</div><small>{value ? labels[Number(value) - 1] : "Pilih nilai 1–5"}</small>{error && <small className="rating-error" role="alert">{error}</small>}</fieldset>; }
