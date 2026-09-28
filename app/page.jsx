"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DEFAULT_CONFIG } from "../lib/default-config";
import masterPegawaiData from "../lib/master-pegawai-data.json";
import { getSupabase } from "../lib/supabase";

const scale = ["Sangat tidak mampu", "Tidak mampu", "Cukup mampu", "Mampu", "Sangat mampu"];
const needScale = ["Sangat tidak membutuhkan", "Tidak membutuhkan", "Cukup membutuhkan", "Membutuhkan", "Sangat membutuhkan"];

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
      {options.map((x) => (
        <label className="answer-choice" key={x}>
          <input type="checkbox" name={name} checked={value.includes(x)} onChange={() => onChange(x)} />
          <span>{x}</span>
        </label>
      ))}
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

  const competencyGroups = useMemo(() => [...new Set(config.competencies.map((c) => c.pilar))], [config.competencies]);
  const groupCount = competencyGroups.length;
  const identificationStep = groupCount + 2;
  const suggestionStep = groupCount + 3;
  const totalSteps = groupCount + 3;

  useEffect(() => {
    let alive = true;
    if (db) {
      db.from("survey_config")
        .select("config")
        .eq("id", "main")
        .maybeSingle()
        .then(({ data }) => {
          if (
            alive &&
            data?.config?.instrumentVersion === DEFAULT_CONFIG.instrumentVersion &&
            data?.config?.developmentFormats?.length &&
            data?.config?.competencies?.length
          ) {
            setConfig({ ...DEFAULT_CONFIG, ...data.config });
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
      if (!formats.length) errors.formats = "Pilih setidaknya satu bentuk pengembangan.";
      if (formats.includes("Lainnya") && !formatOther.trim()) errors.formatOther = "Tuliskan bentuk pengembangan lainnya.";
      if (!topics.length) errors.topics = "Pilih setidaknya satu topik prioritas.";
      if (topics.includes("Lainnya") && !topicOther.trim()) errors.topicOther = "Tuliskan topik lainnya.";
      if (!method) errors.method = "Metode pembelajaran wajib dipilih.";
      if (method === "Lainnya" && !methodOther.trim()) errors.methodOther = "Tuliskan metode pembelajaran lainnya.";
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
      bentuk_pengembangan: [
        ...formats.filter((x) => x !== "Lainnya"),
        ...(formats.includes("Lainnya") && formatOther.trim() ? [formatOther.trim()] : []),
      ],
      topik_prioritas: [
        ...topics.filter((x) => x !== "Lainnya"),
        ...(topics.includes("Lainnya") && topicOther.trim() ? [topicOther.trim()] : []),
      ],
      metode_pembelajaran: method === "Lainnya" ? methodOther.trim() || "Lainnya" : method,
      kompetensi_lain: suggestion,
    };

    const { error } = await db.from("survey_responses").insert({ response });
    setBusy(false);
    if (error) {
      setNotice(`Jawaban belum terkirim: ${error.message}`);
      return;
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
            <span>Terhubung Data Master Pegawai ({pegawaiList.length} ASN)</span>
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

                  <Nav next={next} nextLabel="Lanjut ke Penilaian Kompetensi →" />
                </section>
              )}

              {/* STEP 2..N: PENILAIAN KOMPETENSI */}
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

              {/* STEP IDENTIFIKASI KEBUTUHAN */}
              {step === identificationStep && (
                <section className="card form-section">
                  <SectionHeading
                    n={String(identificationStep)}
                    title="Identifikasi Kebutuhan Pengembangan"
                    desc="Pilih jenis, topik, dan metode pengembangan kompetensi yang paling sesuai."
                  />
                  <Field
                    label="Bentuk pengembangan kompetensi yang paling dibutuhkan (pilih maksimal 3) *"
                    error={validationErrors.formats}
                  >
                    <Checks
                      name="formats"
                      options={config.developmentFormats}
                      value={formats}
                      onChange={(v) => {
                        toggle(formats, setFormats, v, 3);
                        clearValidation("formats");
                      }}
                    />
                  </Field>
                  {formats.includes("Lainnya") && (
                    <Field
                      id="formatOther"
                      label="Bentuk pengembangan lainnya *"
                      error={validationErrors.formatOther}
                    >
                      <input
                        id="formatOther"
                        value={formatOther}
                        onChange={(e) => {
                          setFormatOther(e.target.value);
                          clearValidation("formatOther");
                        }}
                        placeholder="Tuliskan bentuk yang dibutuhkan"
                      />
                    </Field>
                  )}

                  <Field
                    label="Topik / kompetensi yang paling diprioritaskan (pilih maksimal 3) *"
                    error={validationErrors.topics}
                  >
                    <Checks
                      name="topics"
                      options={config.priorityTopics}
                      value={topics}
                      onChange={(v) => {
                        toggle(topics, setTopics, v, 3);
                        clearValidation("topics");
                      }}
                    />
                  </Field>
                  {topics.includes("Lainnya") && (
                    <Field id="topicOther" label="Topik lainnya *" error={validationErrors.topicOther}>
                      <input
                        id="topicOther"
                        value={topicOther}
                        onChange={(e) => {
                          setTopicOther(e.target.value);
                          clearValidation("topicOther");
                        }}
                        placeholder="Tuliskan topik prioritas"
                      />
                    </Field>
                  )}

                  <Field label="Metode pembelajaran yang paling sesuai *" error={validationErrors.method}>
                    <RadioList
                      name="method"
                      options={config.learningMethods}
                      value={method}
                      onChange={(v) => {
                        setMethod(v);
                        clearValidation("method");
                      }}
                    />
                  </Field>
                  {method === "Lainnya" && (
                    <Field
                      id="methodOther"
                      label="Metode pembelajaran lainnya *"
                      error={validationErrors.methodOther}
                    >
                      <input
                        id="methodOther"
                        value={methodOther}
                        onChange={(e) => {
                          setMethodOther(e.target.value);
                          clearValidation("methodOther");
                        }}
                        placeholder="Tuliskan metode yang sesuai"
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
        className={`button primary ${nextLabel.startsWith("Lanjut ke Penilaian") ? "continue-specific" : ""}`}
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
