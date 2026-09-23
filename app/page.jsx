"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DEFAULT_CONFIG } from "../lib/default-config";
import { getSupabase } from "../lib/supabase";

const units = ["Direktorat Strategi Peningkatan Kualitas Kebijakan Administrasi Negara", "Direktorat Advokasi dan Pengembangan Kinerja Kebijakan", "Direktorat Penguatan Kapasitas Jabatan Fungsional", "Bagian Tata Usaha / Sekretariat Deputi I"];
const positions = ["Pimpinan : Kepala / Deputi / Sekretaris / Kepala Pusat", "Administrator / Pengawas : Pejabat Pengelola Unit", "Fungsional : Widyaiswara, Analis Kebijakan, Perencana, Arsiparis, dll.", "Pelaksana : Pengolah data, Pengadministrasi, Pengelola Layanan, dll."];
const years = ["< 1 tahun", "1 – 3 tahun", "3 – 5 tahun", "> 5 tahun"];
const days = ["Senin", "Selasa", "Rabu", "Kamis"];
const times = ["Pagi (09.00–11.30 WIB)", "Siang/Sore (13.30–15.30 WIB)", "Coffee Morning (1–1,5 Jam)", "Microlearning Mandiri / LMS"];
const barriers = ["Beban tugas kedinasan rutin sangat padat", "Jadwal bentrok dengan tugas mendadak/pimpinan", "Materi kurang aplikatif dengan pekerjaan harian", "Informasi pelatihan kurang tersosialisasi"];

function Field({ label, children }) { return <label className="field"><span>{label}</span>{children}</label>; }
function Select({ options, value, onChange, placeholder }) { return <select value={value} onChange={onChange} required><option value="">{placeholder}</option>{options.map(x => <option key={x}>{x}</option>)}</select>; }
function Checks({ name, options, value, onChange, max }) { return <div className="choice-grid">{options.map((x, i) => <label className="choice" key={x.title || x}><input type="checkbox" name={name} checked={value.includes(x.title || x)} onChange={() => onChange(x.title || x)} /><span>{x.title || x}{x.desc && <small>{x.desc}</small>}</span></label>)}</div>; }
function RadioList({ name, options, value, onChange }) { return <div className="choice-grid">{options.map(x => <label className="choice" key={x}><input type="radio" name={name} checked={value === x} onChange={() => onChange(x)} /><span>{x}</span></label>)}</div>; }

export default function SurveyPage() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({ nama: "", unit: "", jabatan: "", jenjang: "Tidak Berlaku / Bukan Pejabat Fungsional", masa_kerja: "" });
  const [scores, setScores] = useState({});
  const [activities, setActivities] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedDays, setSelectedDays] = useState([]);
  const [time, setTime] = useState(times[0]);
  const [selectedBarriers, setSelectedBarriers] = useState([]);
  const [contribution, setContribution] = useState("Mungkin di Masa Depan");
  const [contributionTopic, setContributionTopic] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [notice, setNotice] = useState("");
  const db = getSupabase();

  useEffect(() => {
    let alive = true;
    if (db) db.from("survey_config").select("config").eq("id", "main").maybeSingle().then(({ data }) => {
      if (alive && data?.config?.competencies?.length) setConfig({ ...DEFAULT_CONFIG, ...data.config });
    });
    return () => { alive = false; };
  }, []);

  function setProfileField(key, value) { setProfile(prev => ({ ...prev, [key]: value })); }
  function toggle(list, setter, value, max = Infinity) {
    setter(prev => prev.includes(value) ? prev.filter(x => x !== value) : prev.length < max ? [...prev, value] : prev);
  }
  function next() {
    if (step === 1 && (!profile.unit || !profile.jabatan || !profile.masa_kerja)) { setNotice("Lengkapi unit kerja, jenis jabatan, dan masa kerja terlebih dahulu."); return; }
    if (step === 2 && config.competencies.some(c => !scores[c.id]?.mastery || !scores[c.id]?.need)) { setNotice("Berikan skor penguasaan dan kebutuhan untuk semua kompetensi."); return; }
    setNotice(""); setStep(n => Math.min(5, n + 1)); window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function back() { setNotice(""); setStep(n => Math.max(1, n - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }
  async function submit(e) {
    e.preventDefault(); setNotice("");
    if (!db) { setNotice("Konfigurasi Supabase belum tersedia. Silakan hubungi administrator."); return; }
    setBusy(true);
    const response = {
      ...profile, nama: profile.nama || "Anonim",
      scores: config.competencies.map(c => ({ id: c.id, kompetensi: c.title, penguasaan: Number(scores[c.id].mastery), kebutuhan: Number(scores[c.id].need), gap: Number(scores[c.id].need) - Number(scores[c.id].mastery) })),
      sme_kegiatan: activities, sme_topik: topics, hari: selectedDays, waktu: time, kendala: selectedBarriers,
      kontribusi: contribution, topik_kontribusi: contributionTopic, saran: suggestion,
    };
    const { error } = await db.from("survey_responses").insert({ response });
    setBusy(false);
    if (error) { setNotice(`Jawaban belum terkirim: ${error.message}`); return; }
    setDone(true); window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const progress = done ? 100 : step * 20;
  return <div className="site-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark">LAN RI</span><span><b>Deputi Bidang Peningkatan Kualitas Kebijakan</b><small>Bigger • Smarter • Better</small></span></div><Link href="/admin/" className="admin-link">Admin</Link></header>
    <main className="container">
      <section className="hero"><div className="eyebrow">Analisis Kebutuhan Pengembangan Kompetensi (AKPK)</div><h1>{config.surveyTitle}</h1><p>{config.intro}</p><div className="hero-meta"><span>Estimasi waktu: 4–6 menit</span><span>Skala 1–4 tanpa pilihan netral</span><span>Selaras 8 Pilar SME LAN RI</span></div></section>
      {notice && <div className="notice" role="alert">{notice}</div>}
      {done ? <section className="card success"><div className="success-icon">✓</div><h2>Terima kasih!</h2><p>Jawaban survei kebutuhan bangkom Anda telah berhasil dikirim dan tercatat.</p><p>Masukan Bapak/Ibu akan membantu perencanaan program pengembangan kompetensi Deputi I LAN RI.</p></section> : <>
        <section className="progress-card"><div><span>Kemajuan: {progress}%</span><b>Langkah {step} dari 5</b></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div></section>
        <form onSubmit={submit}>
          {step === 1 && <section className="card form-section"><SectionHeading n="1" title="Profil & Data Pegawai" desc="Lengkapi data unit kerja dan profil jabatan Anda." />
            <Field label="Nama lengkap / NIP (opsional)"><input value={profile.nama} onChange={e => setProfileField("nama", e.target.value)} placeholder="Boleh dikosongkan" /></Field>
            <Field label="Direktorat / Unit Kerja *"><Select options={units} value={profile.unit} onChange={e => setProfileField("unit", e.target.value)} placeholder="Pilih unit kerja" /></Field>
            <div className="form-grid"><Field label="Kategori / Jenis Jabatan *"><Select options={positions} value={profile.jabatan} onChange={e => setProfileField("jabatan", e.target.value)} placeholder="Pilih jenis jabatan" /></Field><Field label="Jenjang Jabatan Fungsional"><Select options={["Tidak Berlaku / Bukan Pejabat Fungsional", "Ahli Pertama / Terampil", "Ahli Muda / Mahir", "Ahli Madya / Penyelia", "Ahli Utama"]} value={profile.jenjang} onChange={e => setProfileField("jenjang", e.target.value)} /></Field></div>
            <Field label="Masa kerja di lingkungan Deputi I LAN RI *"><RadioList name="masa" options={years} value={profile.masa_kerja} onChange={v => setProfileField("masa_kerja", v)} /></Field><Nav next={next} />
          </section>}
          {step === 2 && <section className="card form-section"><SectionHeading n="2" title="Penilaian Mandiri Kompetensi" desc="Nilai penguasaan saat ini dan kebutuhan kompetensi untuk tugas Anda." />
            <div className="scale-help"><p><b>Penguasaan</b><br />1 Belum menguasai · 2 Dasar/perlu bimbingan · 3 Mandiri · 4 Mampu membimbing</p><p><b>Kebutuhan tugas</b><br />1 Jarang terkait · 2 Sesekali · 3 Dibutuhkan rutin · 4 Kritis/mendesak</p></div>
            <div className="competency-list">{config.competencies.map((c, i) => <article className="competency" key={c.id}><div><small>{String(i + 1).padStart(2, "0")} · {c.pilar}</small><b>{c.title}</b></div><Rating label="Penguasaan saat ini" value={scores[c.id]?.mastery || ""} onChange={v => setScores(s => ({ ...s, [c.id]: { ...s[c.id], mastery: v } }))} /><Rating label="Kebutuhan tugas" value={scores[c.id]?.need || ""} onChange={v => setScores(s => ({ ...s, [c.id]: { ...s[c.id], need: v } }))} /></article>)}</div><Nav back={back} next={next} />
          </section>}
          {step === 3 && <section className="card form-section"><SectionHeading n="3" title="Minat Program & Kegiatan SME" desc="Pilih format dan topik pembelajaran internal yang Anda butuhkan." /><Field label="Bentuk kegiatan SME (maksimal 3)"><Checks name="activities" options={config.smeActivities} value={activities} onChange={v => toggle(activities, setActivities, v, 3)} /></Field><Field label="Topik kepakaran SME yang paling mendesak (maksimal 4)"><Checks name="topics" options={config.smeTopics} value={topics} onChange={v => toggle(topics, setTopics, v, 4)} /></Field><Nav back={back} next={next} /></section>}
          {step === 4 && <section className="card form-section"><SectionHeading n="4" title="Preferensi Hari & Waktu" desc="Bantu sesuaikan jadwal pelatihan dengan ritme kerja." /><Field label="Hari pelaksanaan (boleh pilih lebih dari satu)"><Checks options={days} value={selectedDays} onChange={v => toggle(selectedDays, setSelectedDays, v)} /></Field><Field label="Preferensi waktu"><RadioList name="waktu" options={times} value={time} onChange={setTime} /></Field><Nav back={back} next={next} /></section>}
          {step === 5 && <section className="card form-section"><SectionHeading n="5" title="Hambatan & Kesiapan Berkontribusi" desc="Masukan Anda membantu meningkatkan kualitas program bangkom." /><Field label="Kendala utama (boleh pilih beberapa)"><Checks options={barriers} value={selectedBarriers} onChange={v => toggle(selectedBarriers, setSelectedBarriers, v)} /></Field><Field label="Kesediaan berbagi pengetahuan internal"><RadioList name="kontribusi" options={["Ya, Bersedia", "Mungkin di Masa Depan", "Fokus sebagai Peserta"]} value={contribution} onChange={setContribution} /></Field><Field label="Bidang kepakaran yang dapat dibagikan (opsional)"><input value={contributionTopic} onChange={e => setContributionTopic(e.target.value)} placeholder="Contoh: metodologi survei kebijakan" /></Field><Field label="Saran & masukan (opsional)"><textarea rows={4} value={suggestion} onChange={e => setSuggestion(e.target.value)} /></Field><div className="nav-row"><button type="button" className="button secondary" onClick={back}>Kembali</button><button type="submit" className="button primary" disabled={busy}>{busy ? "Mengirim…" : "Kirim jawaban"}</button></div></section>}
        </form>
      </>}
    </main><footer className="footer">Lembaga Administrasi Negara Republik Indonesia (LAN RI) · Deputi Bidang Peningkatan Kualitas Kebijakan Administrasi Negara</footer>
  </div>;
}

function SectionHeading({ n, title, desc }) { return <div className="section-heading"><span>Bagian {n} dari 5</span><h2>{title}</h2><p>{desc}</p></div>; }
function Nav({ back, next }) { return <div className={`nav-row ${back ? "between" : "end"}`}>{back && <button type="button" className="button secondary" onClick={back}>Kembali</button>}<button type="button" className="button primary" onClick={next}>Lanjut</button></div>; }
function Rating({ label, value, onChange }) { return <fieldset className="rating"><legend>{label}</legend><div>{[1, 2, 3, 4].map(n => <label key={n} className={String(n) === String(value) ? "selected" : ""}><input type="radio" checked={String(n) === String(value)} onChange={() => onChange(n)} /><span>{n}</span></label>)}</div></fieldset>; }
