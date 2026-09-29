"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DEFAULT_CONFIG, normalizeSurveyConfig } from "../lib/default-config";
import { SME_DOMAINS } from "../lib/sme-topics-data";
import masterPegawaiData from "../lib/master-pegawai-data.json";
import { getSupabase } from "../lib/supabase";

const scale = ["Sangat tidak mampu", "Tidak mampu", "Cukup mampu", "Mampu", "Sangat mampu"];
const needScale = ["Sangat tidak membutuhkan", "Tidak membutuhkan", "Cukup membutuhkan", "Membutuhkan", "Sangat membutuhkan"];
const DRAFT_STORAGE_KEY = "survey-bangkom-draft";
const DRAFT_SCHEMA_VERSION = 1;
const preferredDayOptions = ["Senin", "Selasa", "Rabu", "Kamis", "Tidak ada preferensi"];
const preferredTimeOptions = [
  "Pagi (09.00–11.30 WIB)",
  "Siang/sore (13.30–15.30 WIB)",
  "Fleksibel / tidak ada preferensi",
];
const sharingReadinessOptions = [
  "Ya, bersedia berkontribusi",
  "Mungkin, setelah mengetahui topik dan jadwal kegiatan",
  "Untuk saat ini, ingin berfokus sebagai peserta",
];

function formatMasaKerja(p) {
  if (p.masa_kerja_organisasi !== null && p.masa_kerja_organisasi !== undefined) {
    const years = Number(p.masa_kerja_organisasi);
    let kat = "< 10 tahun";
    if (years > 30) kat = "31 – 40 tahun";
    else if (years > 20) kat = "21 – 30 tahun";
    else if (years > 10) kat = "11 – 20 tahun";
    else if (years >= 1) kat = "< 10 tahun";
    return `${years} tahun (${kat})`;
  }
  return p.kategori_masa_kerja_organisasi || "< 10 tahun";
}

function Field({ label, children, error, id, helper }) {
  return (
    <div className={`field ${error ? "has-error" : ""}`}>
      {id ? (
        <label className="field-label" htmlFor={id}>
          {label}
        </label>
      ) : (
        <span className="field-label">{label}</span>
      )}
      {children}
      {helper && <small style={{ color: "var(--muted)", fontSize: "10px", marginTop: "2px" }}>{helper}</small>}
      {error && (
        <small className="field-error" role="alert">
          {error}
        </small>
      )}
    </div>
  );
}

function Select({ id, options, value, onChange, placeholder, disabled = false }) {
  return (
    <select id={id} aria-label={placeholder} value={value} onChange={onChange} required disabled={disabled}>
      <option value="">{placeholder}</option>
      {options.map((x) => {
        const val = typeof x === "string" ? x : x.value;
        const label = typeof x === "string" ? x : x.label;
        return (
          <option key={val} value={val}>
            {label}
          </option>
        );
      })}
    </select>
  );
}

function Checks({ name, options, value, onChange }) {
  return (
    <div className="choice-grid" role="group" aria-label={name}>
      {options.map((option) => {
        const optionValue = typeof option === "string" ? option : option.value;
        const label = typeof option === "string" ? option : option.label;
        const description = typeof option === "string" ? "" : option.description;
        return (
          <label className="answer-choice" key={optionValue}>
            <input type="checkbox" name={name} checked={value.includes(optionValue)} onChange={() => onChange(optionValue)} />
            <span className={description ? "answer-choice-copy" : undefined}>
              {description ? <><strong>{label}</strong><small>{description}</small></> : label}
            </span>
          </label>
        );
      })}
    </div>
  );
}

export default function SurveyPage() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [pegawaiList, setPegawaiList] = useState(masterPegawaiData);
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    nama: "",
    nip: "",
    unit: "",
    jabatan: "",
    jenjang: "",
    masa_kerja: "",
    pendidikan: "",
    pangkat_golongan_ruang: "",
    gender: "",
  });
  const [scores, setScores] = useState({});
  const [smeDomains, setSmeDomains] = useState([]);
  const [smeSubtopics, setSmeSubtopics] = useState([]);
  const [formats, setFormats] = useState([]);
  const [formatOther, setFormatOther] = useState("");
  const [preferredDays, setPreferredDays] = useState([]);
  const [preferredTime, setPreferredTime] = useState("");
  const [sharingReadiness, setSharingReadiness] = useState("");
  const [sharingExpertise, setSharingExpertise] = useState("");
  const [topics, setTopics] = useState([]);
  const [topicOther, setTopicOther] = useState("");
  const [method, setMethod] = useState("");
  const [methodOther, setMethodOther] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [notice, setNotice] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [draftReady, setDraftReady] = useState(false);
  const db = getSupabase();

  const competencyGroups = useMemo(() => [...new Set(config.competencies.map((c) => c.pilar))], [config.competencies]);
  const groupCount = competencyGroups.length;
  const identificationStep = groupCount + 2;
  const scheduleStep = groupCount + 3;
  const readinessStep = groupCount + 4;
  const suggestionStep = groupCount + 5;
  const totalSteps = groupCount + 5;

  useEffect(() => {
    try {
      const rawDraft = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (rawDraft) {
        const draft = JSON.parse(rawDraft);
        if (draft.schemaVersion === DRAFT_SCHEMA_VERSION && Number(draft.instrumentVersion) === Number(DEFAULT_CONFIG.instrumentVersion)) {
          const hasProgress = Number(draft.step) > 1 ||
            Object.values(draft.profile || {}).some((value) => String(value ?? "").trim()) ||
            Object.keys(draft.scores || {}).length > 0 ||
            (draft.smeDomains || []).length > 0 ||
            (draft.smeSubtopics || []).length > 0 ||
            (draft.formats || []).length > 0 ||
            String(draft.formatOther || "").trim() ||
            (draft.preferredDays || []).length > 0 ||
            String(draft.preferredTime || "").trim() ||
            String(draft.sharingReadiness || "").trim() ||
            String(draft.sharingExpertise || "").trim() ||
            (draft.topics || []).length > 0 ||
            String(draft.topicOther || "").trim() ||
            String(draft.method || "").trim() ||
            String(draft.methodOther || "").trim() ||
            String(draft.suggestion || "").trim();
          if (draft.profile && typeof draft.profile === "object") setProfile((current) => ({ ...current, ...draft.profile }));
          if (draft.scores && typeof draft.scores === "object") setScores(draft.scores);
          if (Array.isArray(draft.smeDomains)) setSmeDomains(draft.smeDomains);
          if (Array.isArray(draft.smeSubtopics)) setSmeSubtopics(draft.smeSubtopics);
          if (Array.isArray(draft.formats)) setFormats(draft.formats);
          if (typeof draft.formatOther === "string") setFormatOther(draft.formatOther);
          if (Array.isArray(draft.preferredDays)) setPreferredDays(draft.preferredDays);
          if (typeof draft.preferredTime === "string") setPreferredTime(draft.preferredTime);
          if (typeof draft.sharingReadiness === "string") setSharingReadiness(draft.sharingReadiness);
          if (typeof draft.sharingExpertise === "string") setSharingExpertise(draft.sharingExpertise);
          if (Array.isArray(draft.topics)) setTopics(draft.topics);
          if (typeof draft.topicOther === "string") setTopicOther(draft.topicOther);
          if (typeof draft.method === "string") setMethod(draft.method);
          if (typeof draft.methodOther === "string") setMethodOther(draft.methodOther);
          if (typeof draft.suggestion === "string") setSuggestion(draft.suggestion);
          if (Number.isInteger(draft.step) && draft.step >= 1) {
            const wasOnLegacySuggestion =
              (!Array.isArray(draft.preferredDays) && draft.step === scheduleStep) ||
              (Array.isArray(draft.preferredDays) && draft.step === readinessStep && typeof draft.sharingReadiness !== "string");
            const restoredStep = wasOnLegacySuggestion ? suggestionStep : draft.step;
            setStep(Math.min(restoredStep, totalSteps));
          }
          if (hasProgress) setNotice("Progres jawaban sebelumnya dipulihkan dari browser ini.");
        } else {
          window.localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
      }
    } catch {
      setNotice("Draf jawaban tidak dapat dibaca. Kamu tetap bisa melanjutkan survei.");
    } finally {
      setDraftReady(true);
    }
  }, [totalSteps, scheduleStep, readinessStep, suggestionStep]);

  useEffect(() => {
    if (!draftReady || done) return;
    try {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
        schemaVersion: DRAFT_SCHEMA_VERSION,
        instrumentVersion: config.instrumentVersion,
        savedAt: new Date().toISOString(),
        step,
        profile,
        scores,
        smeDomains,
        smeSubtopics,
        formats,
        formatOther,
        preferredDays,
        preferredTime,
        sharingReadiness,
        sharingExpertise,
        topics,
        topicOther,
        method,
        methodOther,
        suggestion,
      }));
    } catch {
      setNotice("Progres tidak dapat disimpan di browser ini. Periksa ruang penyimpanan perangkat.");
    }
  }, [draftReady, done, config.instrumentVersion, step, profile, scores, smeDomains, smeSubtopics, formats, formatOther, preferredDays, preferredTime, sharingReadiness, sharingExpertise, topics, topicOther, method, methodOther, suggestion]);

  useEffect(() => {
    let alive = true;
    if (db) {
      db.from("survey_config")
        .select("config")
        .eq("id", "main")
        .maybeSingle()
        .then(({ data, error }) => {
          if (!alive) return;
          if (error) {
            setNotice(`Konfigurasi tersimpan belum dapat dimuat dari Supabase: ${error.message}`);
            return;
          }
          if (!data?.config) return;

          const savedConfig = normalizeSurveyConfig(data.config);
          if (savedConfig) {
            setConfig(savedConfig);
          }
        });

      // Also attempt to load active master_pegawai from Supabase if table exists
      db.from("master_pegawai")
        .select("*")
        .order("no_urut", { ascending: true })
        .then(({ data, error }) => {
          if (alive && !error && data && data.length > 0) {
            setPegawaiList(data);
          }
        });
    }
    return () => {
      alive = false;
    };
  }, []);

  // Unique list of unit_organisasi from master_pegawai
  const unitOptions = useMemo(() => {
    const list = pegawaiList.map((p) => p.unit_organisasi).filter(Boolean);
    return [...new Set(list)];
  }, [pegawaiList]);

  // Available pegawai filtered by selected unit
  const pegawaiInSelectedUnit = useMemo(() => {
    if (!profile.unit) return [];
    return pegawaiList.filter((p) => p.unit_organisasi === profile.unit);
  }, [pegawaiList, profile.unit]);

  function handleUnitChange(selectedUnit) {
    setProfile((prev) => ({
      ...prev,
      unit: selectedUnit,
      nama: "",
      nip: "",
      jabatan: "",
      jenjang: "",
      masa_kerja: "",
      pendidikan: "",
      pangkat_golongan_ruang: "",
      gender: "",
    }));
    setValidationErrors((prev) => ({ ...prev, unit: "", nama: "" }));
  }

  function handlePegawaiChange(selectedNama) {
    const person = pegawaiList.find((p) => p.nama === selectedNama);
    if (person) {
      const formattedMasaKerja = formatMasaKerja(person);
      setProfile((prev) => ({
        ...prev,
        nama: person.nama,
        nip: person.nip || "",
        unit: person.unit_organisasi || prev.unit,
        jabatan: person.jabatan || "",
        jenjang: person.jenjang_jabatan || person.jenis_jabatan || "Tidak Berlaku / Bukan Pejabat Fungsional",
        masa_kerja: formattedMasaKerja,
        pendidikan: person.pendidikan || "",
        pangkat_golongan_ruang: person.pangkat_golongan_ruang || "",
        gender: person.gender || "",
      }));
      setValidationErrors((prev) => ({
        ...prev,
        nama: "",
        nip: "",
        unit: "",
        jabatan: "",
        jenjang: "",
        masa_kerja: "",
      }));
    } else {
      setProfile((prev) => ({ ...prev, nama: selectedNama }));
    }
  }

  function setScore(id, key, value) {
    setScores((prev) => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
    setValidationErrors((prev) => ({ ...prev, [`${key}-${id}`]: "" }));
  }

  function clearValidation(key) {
    setValidationErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function toggle(list, setter, value, max = Infinity) {
    setter((prev) => (prev.includes(value) ? prev.filter((x) => x !== value) : prev.length < max ? [...prev, value] : prev));
  }

  function next() {
    const errors = {};
    if (step === 1) {
      if (!profile.unit) errors.unit = "Direktorat / Unit Kerja wajib dipilih.";
      if (!profile.nama) errors.nama = "Nama pegawai wajib dipilih.";
      if (!profile.nip) errors.nip = "NIP wajib terisi.";
      if (!profile.jabatan) errors.jabatan = "Jabatan wajib terisi.";
    }
    if (step >= 2 && step < identificationStep) {
      const currentGroup = competencyGroups[step - 2];
      config.competencies
        .filter((c) => c.pilar === currentGroup)
        .forEach((c) => {
          if (!scores[c.id]?.mastery) errors[`mastery-${c.id}`] = "Wajib diisi.";
          if (!scores[c.id]?.need) errors[`need-${c.id}`] = "Wajib diisi.";
        });
    }
    if (step === identificationStep) {
      if (!smeDomains.length) errors.smeDomains = "Pilih setidaknya 1 Rumpun Kepakaran SME yang diminati.";
      if (!smeSubtopics.length) errors.smeSubtopics = "Pilih setidaknya 1 sub-topik materi bangkom yang dibutuhkan.";
      if (!formats.length) errors.formats = "Pilih setidaknya satu bentuk pengembangan.";
      if (formats.includes("Lainnya") && !formatOther.trim()) errors.formatOther = "Tuliskan bentuk pengembangan lainnya.";
      if (!method) errors.method = "Metode pembelajaran wajib dipilih.";
      if (method === "Lainnya" && !methodOther.trim()) errors.methodOther = "Tuliskan metode pembelajaran lainnya.";
    }
    if (step === scheduleStep) {
      if (!preferredDays.length) errors.preferredDays = "Pilih hari atau pilih tidak ada preferensi.";
      if (!preferredTime) errors.preferredTime = "Pilih waktu pelaksanaan.";
    }
    if (step === readinessStep && !sharingReadiness) {
      errors.sharingReadiness = "Pilih salah satu jawaban.";
    }
    setValidationErrors(errors);
    if (Object.keys(errors).length) {
      setNotice("Periksa isian yang ditandai. Bagian tersebut wajib dilengkapi.");
      return;
    }
    setNotice("");
    setStep((n) => Math.min(totalSteps, n + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setNotice("");
    setStep((n) => Math.max(1, n - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(e) {
    e.preventDefault();
    setNotice("");
    if (!db) {
      setNotice("Konfigurasi database belum tersedia. Silakan hubungi administrator.");
      return;
    }
    setBusy(true);
    const selectedSmeDomainObjects = smeDomains.map((id) => SME_DOMAINS.find((d) => d.id === id)).filter(Boolean);
    const response = {
      ...profile,
      nama: profile.nama.trim(),
      nip: profile.nip.trim(),
      instrument_version: config.instrumentVersion,
      scores: config.competencies.map((c) => ({
        id: c.id,
        kode: c.code || c.id,
        kelompok: c.pilar,
        kompetensi: c.title,
        penguasaan: Number(scores[c.id]?.mastery || 0),
        kebutuhan: Number(scores[c.id]?.need || 0),
        gap: Number(scores[c.id]?.need || 0) - Number(scores[c.id]?.mastery || 0),
      })),
      sme_domains: selectedSmeDomainObjects.map((d) => d.title),
      sme_domain_codes: selectedSmeDomainObjects.map((d) => d.code),
      sme_subtopics: smeSubtopics,
      bentuk_pengembangan: [
        ...formats.filter((x) => x !== "Lainnya"),
        ...(formats.includes("Lainnya") && formatOther.trim() ? [formatOther.trim()] : []),
      ],
      topik_prioritas: smeSubtopics.length ? smeSubtopics : [
        ...topics.filter((x) => x !== "Lainnya"),
        ...(topics.includes("Lainnya") && topicOther.trim() ? [topicOther.trim()] : []),
      ],
      metode_pembelajaran: method === "Lainnya" ? methodOther.trim() || "Lainnya" : method,
      preferensi_hari: preferredDays,
      preferensi_waktu: preferredTime,
      kesiapan_berbagi_pengetahuan: sharingReadiness,
      bidang_keahlian_dibagikan: sharingExpertise.trim(),
      kompetensi_lain: suggestion,
    };

    const { error } = await db.from("survey_responses").insert({ response });
    setBusy(false);
    if (error) {
      setNotice(`Jawaban belum terkirim: ${error.message}`);
      return;
    }
    try {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // The response is already saved in Supabase; a stale local draft is harmless.
    }
    setDone(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const progress = done ? 100 : Math.round((step / totalSteps) * 100);
  const groupIndex = step - 2;
  const groupTitle = competencyGroups[groupIndex];
  const groupLetter = String.fromCharCode(65 + groupIndex);
  const groupDescription = config.competencies.find((c) => c.pilar === groupTitle)?.description;

  return (
    <div className="site-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">LAN RI</span>
          <span>
            <b>Deputi Bidang Peningkatan Kualitas Kebijakan</b>
            <small>Bigger • Smarter • Better</small>
          </span>
        </div>
      </header>
      <main className="container">
        <section className="hero">
          <div className="eyebrow">Analisis Kebutuhan Pengembangan Kompetensi (AKPK)</div>
          <h1>{config.surveyTitle}</h1>
          <p>{config.intro}</p>
          <div className="hero-meta">
            <span>Estimasi waktu: 10–15 menit</span>
            <span>Skala penilaian 1–5</span>
          </div>
        </section>

        {notice && (
          <div className="notice" role="alert">
            {notice}
          </div>
        )}

        {done ? (
          <section className="card success">
            <div className="success-icon">✓</div>
            <h2>Terima kasih, {profile.nama}!</h2>
            <p>Jawaban survei kebutuhan bangkom Anda telah berhasil dikirim dan tercatat di database.</p>
            <p>Masukan Bapak/Ibu akan membantu perencanaan program pengembangan kompetensi Deputi I LAN RI.</p>
          </section>
        ) : (
          <>
            <section className="progress-card">
              <div>
                <span>Kemajuan: {progress}%</span>
                <b>
                  Halaman {step} dari {totalSteps}
                </b>
              </div>
              <div className="progress-track">
                <span style={{ width: `${progress}%` }} />
              </div>
              <p className="draft-note">Progres jawaban disimpan otomatis di browser ini sampai survei berhasil dikirim.</p>
            </section>

            <form onSubmit={submit}>
              {/* STEP 1: PROFIL RESPONDEN DENGAN AUTO-FILL MASTER PEGAWAI */}
              {step === 1 && (
                <section className="card form-section">
                  <SectionHeading
                    n="1"
                    title="Profil Responden"
                    desc="Pilih Direktorat/Unit Organisasi dan Nama Anda. Data NIP, Jabatan, dan Masa Kerja akan terisi otomatis."
                  />

                  {/* 1. Pilih Unit Organisasi */}
                  <Field
                    id="unit"
                    label="1. Direktorat / Unit Organisasi *"
                    error={validationErrors.unit}
                    helper="Pilih unit kerja Anda untuk memfilter daftar nama pegawai."
                  >
                    <Select
                      id="unit"
                      options={unitOptions}
                      value={profile.unit}
                      onChange={(e) => handleUnitChange(e.target.value)}
                      placeholder="-- Pilih Direktorat / Unit Organisasi --"
                    />
                  </Field>

                  {/* 2. Pilih Nama Pegawai */}
                  <Field
                    id="nama"
                    label="2. Nama Pegawai *"
                    error={validationErrors.nama}
                    helper={
                      profile.unit
                        ? `Menampilkan ${pegawaiInSelectedUnit.length} pegawai di unit terpilih.`
                        : "Pilih Direktorat terlebih dahulu di atas."
                    }
                  >
                    <Select
                      id="nama"
                      disabled={!profile.unit}
                      options={pegawaiInSelectedUnit.map((p) => ({ value: p.nama, label: p.nama }))}
                      value={profile.nama}
                      onChange={(e) => handlePegawaiChange(e.target.value)}
                      placeholder={
                        profile.unit ? "-- Pilih Nama Anda dari Daftar --" : "-- Pilih Unit Terlebih Dahulu --"
                      }
                    />
                  </Field>

                  {/* 3. Detail Profil Pegawai yang Terisi Otomatis */}
                  {profile.nama && (
                    <div
                      style={{
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        borderRadius: "12px",
                        padding: "16px 18px",
                        marginTop: "8px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "12px",
                          color: "#166534",
                          fontWeight: 800,
                          fontSize: "12px",
                        }}
                      >
                        <span>✓</span>
                        <span>DATA KEPEGAWAIAN TERVERIFIKASI</span>
                      </div>

                      <div className="form-grid">
                        <Field id="nip" label="NIP">
                          <input id="nip" readOnly value={profile.nip} style={{ background: "#f8fafc" }} />
                        </Field>
                        <Field id="pangkat" label="Pangkat / Golongan Ruang">
                          <input
                            id="pangkat"
                            readOnly
                            value={profile.pangkat_golongan_ruang || "—"}
                            style={{ background: "#f8fafc" }}
                          />
                        </Field>
                      </div>

                      <Field id="jabatan" label="Jabatan">
                        <input id="jabatan" readOnly value={profile.jabatan} style={{ background: "#f8fafc" }} />
                      </Field>

                      <div className="form-grid" style={{ marginTop: "10px" }}>
                        <Field id="jenjang" label="Jenjang / Kategori Jabatan">
                          <input id="jenjang" readOnly value={profile.jenjang} style={{ background: "#f8fafc" }} />
                        </Field>
                        <Field id="masa_kerja" label="Masa Kerja Organisasi">
                          <input
                            id="masa_kerja"
                            readOnly
                            value={profile.masa_kerja}
                            style={{ background: "#f8fafc" }}
                          />
                        </Field>
                      </div>
                    </div>
                  )}

                  <Nav next={next} nextLabel="Lanjut ke Pemetaan Kompetensi →" />
                </section>
              )}

              {/* STEP 2..N: PEMETAAN KOMPETENSI */}
              {step >= 2 && step < identificationStep && (
                <section className="card form-section">
                  <SectionHeading
                    n={`Poin ${groupLetter} dari ${String.fromCharCode(64 + groupCount)}`}
                    title={groupTitle}
                    desc={`${groupDescription ? `${groupDescription} ` : ""}Nilai setiap pernyataan berdasarkan kemampuan Anda saat ini dan kebutuhan pengembangan kompetensi.`}
                  />
                  <div className="scale-help">
                    <p>
                      <b>Kemampuan saat ini</b>
                      <br />
                      {scale.map((x, i) => `${i + 1} ${x}`).join(" · ")}
                    </p>
                    <p>
                      <b>Kebutuhan pengembangan</b>
                      <br />
                      {needScale.map((x, i) => `${i + 1} ${x}`).join(" · ")}
                    </p>
                  </div>
                  <div className="competency-group">
                    <div className="competency-list">
                      {config.competencies
                        .filter((c) => c.pilar === groupTitle)
                        .map((c) => (
                          <article className="competency" key={c.id}>
                            <div>
                              <small>{c.code || c.id}</small>
                              <b>{c.title}</b>
                            </div>
                            <Rating
                              name={`${c.id}-mastery`}
                              label="Kemampuan saat ini"
                              value={scores[c.id]?.mastery || ""}
                              labels={scale}
                              error={validationErrors[`mastery-${c.id}`]}
                              onChange={(v) => setScore(c.id, "mastery", v)}
                            />
                            <Rating
                              name={`${c.id}-need`}
                              label="Kebutuhan pengembangan"
                              value={scores[c.id]?.need || ""}
                              labels={needScale}
                              error={validationErrors[`need-${c.id}`]}
                              onChange={(v) => setScore(c.id, "need", v)}
                            />
                          </article>
                        ))}
                    </div>
                  </div>
                  <Nav
                    back={back}
                    next={next}
                    nextLabel={
                      step < groupCount + 1
                        ? `Lanjut ke poin ${String.fromCharCode(66 + groupIndex)} →`
                        : "Lanjut ke Identifikasi Kebutuhan →"
                    }
                  />
                </section>
              )}

              {/* STEP IDENTIFIKASI KEBUTUHAN BANGKOM SME */}
              {step === identificationStep && (
                <section className="card form-section">
                  <SectionHeading
                    n={String(identificationStep)}
                    title="Identifikasi Kebutuhan Pengembangan & Peminatan SME"
                    desc="Pilih rumpun kepakaran Subject Matter Expert (SME), sub-topik materi, serta bentuk dan metode pembelajaran yang paling sesuai."
                  />

                  {/* 1. PILIHAN RUMPUN KEPATARAN SME */}
                  <Field
                    label="1. Rumpun Kepakaran Subject Matter Expert (SME) yang Diminati (Pilih 1 s.d. 3 Rumpun) *"
                    error={validationErrors.smeDomains}
                    helper="Pilih bidang kepakaran yang paling relevan dengan minat pengembangan karier atau tugas fungsi Anda."
                  >
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "10px", marginTop: "4px" }}>
                      {SME_DOMAINS.map((domain) => {
                        const isSelected = smeDomains.includes(domain.id);
                        return (
                          <div
                            key={domain.id}
                            onClick={() => {
                              toggle(smeDomains, (updater) => {
                                setSmeDomains((prev) => {
                                  const nextList = typeof updater === "function" ? updater(prev) : updater;
                                  if (prev.includes(domain.id) && !nextList.includes(domain.id)) {
                                    setSmeSubtopics((subPrev) => subPrev.filter((st) => !domain.topics.includes(st)));
                                  }
                                  return nextList;
                                });
                              }, domain.id, 3);
                              setValidationErrors((prev) => ({ ...prev, smeDomains: "" }));
                            }}
                            style={{
                              border: isSelected ? "2px solid var(--navy)" : "1px solid var(--line)",
                              background: isSelected ? "#f0f7fb" : "#fff",
                              borderRadius: "12px",
                              padding: "14px 16px",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "12px",
                              boxShadow: isSelected ? "0 3px 10px rgba(10, 77, 104, 0.12)" : "none"
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              style={{ width: "18px", height: "18px", marginTop: "2px", accentColor: "var(--blue)" }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                                <span style={{ fontSize: "16px" }}>{domain.icon}</span>
                                <span style={{ fontSize: "10px", fontWeight: "800", color: "var(--blue)", letterSpacing: "0.05em" }}>
                                  RUMPUN {domain.code}
                                </span>
                              </div>
                              <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--ink)", lineHeight: 1.4 }}>
                                {domain.title}
                              </div>
                              <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>
                                {domain.topics.length} sub-topik materi
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Field>

                  {/* 2. PILIHAN SUB-TOPIK SPESIFIK */}
                  {smeDomains.length > 0 && (
                    <Field
                      label="2. Sub-Topik Materi Bangkom yang Dibutuhkan / Diprioritaskan *"
                      error={validationErrors.smeSubtopics}
                      helper="Centang sub-topik materi pelatihan yang ingin Anda ikuti pada rumpun kepakaran yang telah dipilih di atas."
                    >
                      <div style={{ display: "grid", gap: "14px", marginTop: "6px" }}>
                        {smeDomains.map((domainId) => {
                          const domain = SME_DOMAINS.find((d) => d.id === domainId);
                          if (!domain) return null;
                          return (
                            <div
                              key={domain.id}
                              style={{
                                background: "#f8fafb",
                                border: "1px solid #dce4e9",
                                borderRadius: "12px",
                                padding: "16px 18px",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", borderBottom: "1px solid #e9eef1", paddingBottom: "8px" }}>
                                <span style={{ fontSize: "18px" }}>{domain.icon}</span>
                                <div>
                                  <span style={{ fontSize: "10px", fontWeight: "800", color: "var(--blue)" }}>RUMPUN {domain.code}</span>
                                  <h4 style={{ margin: 0, fontSize: "14px", color: "var(--navy)" }}>{domain.title}</h4>
                                </div>
                              </div>
                              <div className="choice-grid">
                                {domain.topics.map((topic) => (
                                  <label className="answer-choice" key={topic}>
                                    <input
                                      type="checkbox"
                                      checked={smeSubtopics.includes(topic)}
                                      onChange={() => {
                                        setSmeSubtopics((prev) =>
                                          prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
                                        );
                                        setValidationErrors((prev) => ({ ...prev, smeSubtopics: "" }));
                                      }}
                                    />
                                    <span>{topic}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Field>
                  )}

                  {/* 3. BENTUK PENGEMBANGAN */}
                  <Field
                    label="3. Bentuk Kegiatan SME yang Paling Efektif bagi Anda (Pilih maksimal 3) *"
                    error={validationErrors.formats}
                    helper="Pilih hingga tiga kegiatan yang paling membantu Anda mengembangkan kompetensi untuk mendukung peran SME."
                  >
                    <Checks
                      name="formats"
                      options={config.developmentFormats}
                      value={formats}
                      onChange={(v) => {
                        toggle(formats, setFormats, v, 3);
                        setValidationErrors((prev) => ({ ...prev, formats: "" }));
                      }}
                    />
                  </Field>
                  {formats.includes("Lainnya") && (
                    <Field
                      id="formatOther"
                      label="Bentuk kegiatan SME lainnya, sebutkan *"
                      error={validationErrors.formatOther}
                    >
                      <input
                        id="formatOther"
                        value={formatOther}
                        onChange={(e) => {
                          setFormatOther(e.target.value);
                          setValidationErrors((prev) => ({ ...prev, formatOther: "" }));
                        }}
                        placeholder="Tuliskan kegiatan SME yang Anda usulkan"
                      />
                    </Field>
                  )}

                  {/* 4. METODE PEMBELAJARAN */}
                  <Field label="4. Metode Pembelajaran yang Paling Sesuai *" error={validationErrors.method}>
                    <RadioList
                      name="method"
                      options={config.learningMethods}
                      value={method}
                      onChange={(v) => {
                        setMethod(v);
                        setValidationErrors((prev) => ({ ...prev, method: "" }));
                      }}
                    />
                  </Field>
                  {method === "Lainnya" && (
                    <Field
                      id="methodOther"
                      label="Metode pembelajaran lainnya, sebutkan *"
                      error={validationErrors.methodOther}
                    >
                      <input
                        id="methodOther"
                        value={methodOther}
                        onChange={(e) => {
                          setMethodOther(e.target.value);
                          setValidationErrors((prev) => ({ ...prev, methodOther: "" }));
                        }}
                        placeholder="Tuliskan metode pembelajaran yang Anda usulkan"
                      />
                    </Field>
                  )}

                  <Nav back={back} next={next} />
                </section>
              )}

              {/* STEP PREFERENSI JADWAL */}
              {step === scheduleStep && (
                <section className="card form-section">
                  <SectionHeading
                    n={String(scheduleStep)}
                    title="Preferensi Hari & Waktu Pelaksanaan"
                    desc="Bantu kami menyesuaikan jadwal kegiatan agar tidak mengganggu ritme kerja harian."
                  />
                  <Field
                    label="1. Pilihan Hari Pelaksanaan (Pilih maksimal 2) *"
                    error={validationErrors.preferredDays}
                    helper="Pilih satu atau dua hari kerja. Pilih ‘Tidak ada preferensi’ jika jadwal Anda fleksibel."
                  >
                    <Checks
                      name="preferredDays"
                      options={preferredDayOptions}
                      value={preferredDays}
                      onChange={(day) => {
                        setPreferredDays((current) => {
                          if (day === "Tidak ada preferensi") {
                            return current.includes(day) ? [] : [day];
                          }
                          const selectedDays = current.filter((value) => value !== "Tidak ada preferensi");
                          if (selectedDays.includes(day)) return selectedDays.filter((value) => value !== day);
                          return selectedDays.length < 2 ? [...selectedDays, day] : selectedDays;
                        });
                        setValidationErrors((prev) => ({ ...prev, preferredDays: "" }));
                      }}
                    />
                  </Field>
                  <Field
                    label="2. Preferensi Waktu / Jam Pelaksanaan *"
                    error={validationErrors.preferredTime}
                  >
                    <RadioList
                      name="preferredTime"
                      options={preferredTimeOptions}
                      value={preferredTime}
                      onChange={(value) => {
                        setPreferredTime(value);
                        setValidationErrors((prev) => ({ ...prev, preferredTime: "" }));
                      }}
                    />
                  </Field>
                  <Nav back={back} next={next} />
                </section>
              )}

              {/* STEP KESEDIAAN BERBAGI PENGETAHUAN */}
              {step === readinessStep && (
                <section className="card form-section">
                  <SectionHeading
                    n={String(readinessStep)}
                    title="Kesediaan Berbagi Pengetahuan Internal"
                    desc="Bagian ini membantu memetakan pegawai yang berminat berbagi pengetahuan sebagai SME internal."
                  />
                  <Field
                    label="1. Apakah Anda bersedia berkontribusi dalam kegiatan berbagi pengetahuan internal Deputi I? *"
                    error={validationErrors.sharingReadiness}
                  >
                    <RadioList
                      name="sharingReadiness"
                      options={sharingReadinessOptions}
                      value={sharingReadiness}
                      onChange={(value) => {
                        setSharingReadiness(value);
                        if (value === sharingReadinessOptions[2]) setSharingExpertise("");
                        setValidationErrors((prev) => ({ ...prev, sharingReadiness: "" }));
                      }}
                    />
                  </Field>
                  {sharingReadiness && sharingReadiness !== sharingReadinessOptions[2] && (
                    <Field
                      id="sharingExpertise"
                      label="2. Bidang keahlian atau pengalaman yang dapat Anda bagikan (opsional)"
                      helper="Boleh dikosongkan jika belum menentukan bidang yang ingin dibagikan."
                    >
                      <input
                        id="sharingExpertise"
                        value={sharingExpertise}
                        onChange={(event) => setSharingExpertise(event.target.value)}
                        placeholder="Contoh: metodologi survei kebijakan, visualisasi data"
                      />
                    </Field>
                  )}
                  <Nav back={back} next={next} />
                </section>
              )}

              {/* STEP MASUKAN TAMBAHAN & SUBMIT */}
              {step === suggestionStep && (
                <section className="card form-section">
                  <SectionHeading
                    n={String(suggestionStep)}
                    title="Masukan Tambahan"
                    desc="Tambahkan kebutuhan kompetensi yang belum tercakup dalam pilihan sebelumnya."
                  />
                  <Field label="Kompetensi atau topik lain yang perlu dikembangkan untuk mendukung tugas SME">
                    <textarea
                      rows={5}
                      value={suggestion}
                      onChange={(e) => setSuggestion(e.target.value)}
                      placeholder="Tuliskan usulan atau masukan tambahan Anda di sini..."
                    />
                  </Field>
                  <div className="nav-row">
                    <button type="button" className="button secondary" onClick={back}>
                      Kembali
                    </button>
                    <button type="submit" className="button primary" disabled={busy}>
                      {busy ? "Mengirim Jawaban…" : "Kirim Jawaban Survei"}
                    </button>
                  </div>
                </section>
              )}
            </form>
          </>
        )}
      </main>
      <footer className="footer">
        Lembaga Administrasi Negara Republik Indonesia (LAN RI) · Deputi Bidang Peningkatan Kualitas Kebijakan
        Administrasi Negara
      </footer>
    </div>
  );
}

function SectionHeading({ n, title, desc }) {
  return (
    <div className="section-heading">
      <span>{String(n).startsWith("Poin ") ? n : `Bagian ${n}`}</span>
      <h2>{title}</h2>
      <p>{desc}</p>
    </div>
  );
}

function Nav({ back, next, nextLabel = "Lanjut" }) {
  return (
    <div className={`nav-row ${back ? "between" : "end"}`}>
      {back && (
        <button type="button" className="button secondary" onClick={back}>
          Kembali
        </button>
      )}
      <button
        type="button"
        className={`button primary ${nextLabel.startsWith("Lanjut ke Pemetaan") ? "continue-specific" : ""}`}
        onClick={next}
      >
        {nextLabel}
      </button>
    </div>
  );
}

function RadioList({ name, options, value, onChange, compact = false }) {
  return (
    <div className={`choice-grid ${compact ? "tenure-choices" : ""}`} role="radiogroup" aria-label={name}>
      {options.map((x) => (
        <label className={compact ? "choice" : "answer-choice"} key={x}>
          <input type="radio" name={name} checked={value === x} onChange={() => onChange(x)} />
          <span>{x}</span>
        </label>
      ))}
    </div>
  );
}

function Rating({ name, label, value, labels, error, onChange }) {
  return (
    <fieldset className={`rating ${error ? "has-error" : ""}`}>
      <legend>{label}</legend>
      <div>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className={String(n) === String(value) ? "selected" : ""}>
            <input
              type="radio"
              name={name}
              required
              checked={String(n) === String(value)}
              onChange={() => onChange(n)}
            />
            <span title={labels[n - 1]}>{n}</span>
          </label>
        ))}
      </div>
      <small>{value ? labels[Number(value) - 1] : "Pilih nilai 1–5"}</small>
      {error && (
        <small className="rating-error" role="alert">
          {error}
        </small>
      )}
    </fieldset>
  );
}
