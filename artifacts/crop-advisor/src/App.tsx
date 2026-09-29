import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Link, Route, Switch, useLocation } from 'wouter';
import {
  ArrowRight, Check, ChevronRight, CircleAlert, CloudRain, Download,
  History, Leaf, Menu, Microscope, RefreshCw, ScanLine, Sprout, Sun, Upload,
  Wheat, X, Zap,
} from 'lucide-react';
import {
  getExportAdvisoryQueryKey, getGetDashboardSummaryQueryKey, getListAdvisoriesQueryKey,
  getListScansQueryKey, useCreateAdvisory, useCreateScan, useExportAdvisory,
  useGetDashboardSummary, useHealthCheck, useListAdvisories, useListScans,
} from '@workspace/api-client-react';
import type {
  Advisory, AdvisoryInput, CropRecommendation, Diagnosis, Scan,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
const DEVICE_ID = (() => {
  const saved = localStorage.getItem('crop-advisor-device');
  if (saved) return saved;
  const id = `field-${crypto.randomUUID()}`;
  localStorage.setItem('crop-advisor-device', id);
  return id;
})();
const request = { headers: { 'x-device-id': DEVICE_ID } };

function Logo({ compact = false }: { compact?: boolean }) {
  return <Link href="/" className="brand" data-testid="link-logo">
    <span className="brand-mark"><Sprout size={20} strokeWidth={2.6} /></span>
    {!compact && <span><strong>Crop</strong><em>Advisor</em></span>}
  </Link>;
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: health } = useHealthCheck({ request });
  const links = [
    { href: '/advisory', label: 'Crop advisory', icon: Leaf },
    { href: '/scanner', label: 'Disease scanner', icon: ScanLine },
    { href: '/dashboard', label: 'My history', icon: History },
  ];
  return <div className="app-shell">
    <header className="topbar">
      <Logo />
      <div className="topbar-right">
        <span className="network-status" data-testid="status-health">
          <span className={`status-dot ${health ? 'online' : ''}`} /> {health ? 'Ready for the field' : 'Connecting'}
        </span>
        <button className="icon-button menu-trigger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu" data-testid="button-menu"><Menu size={21} /></button>
      </div>
      <nav className={`desktop-nav ${menuOpen ? 'mobile-open' : ''}`}>
        {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} className={location === href ? 'nav-link active' : 'nav-link'} data-testid={`link-nav-${href.slice(1)}`}><Icon size={17} />{label}</Link>)}
      </nav>
    </header>
    <main className="page-wrap">{children}</main>
    <nav className="bottom-nav">
      {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={location === href ? 'bottom-link active' : 'bottom-link'} data-testid={`link-bottom-${href.slice(1)}`}><Icon size={20} /><span>{label === 'Crop advisory' ? 'Advise' : label === 'Disease scanner' ? 'Scan' : 'History'}</span></Link>)}
    </nav>
  </div>;
}

function SectionKicker({ children }: { children: ReactNode }) {
  return <p className="kicker">{children}</p>;
}

function Home() {
  return <div className="home-page">
    <section className="home-hero">
      <div className="hero-copy">
        <SectionKicker>Practical guidance, rooted in your field</SectionKicker>
        <h1>Make your <span>next decision</span> with confidence.</h1>
        <p className="hero-lede">Crop Advisor turns the signals you already have — soil, weather, and a leaf — into a clear plan for today’s work.</p>
        <div className="hero-actions">
          <Link href="/advisory" className="button button-primary" data-testid="link-hero-advisory">Start a crop advisory <ArrowRight size={18} /></Link>
          <Link href="/scanner" className="button button-quiet" data-testid="link-hero-scanner"><ScanLine size={18} /> Check a leaf</Link>
        </div>
        <div className="trust-row"><span><Check size={14} /> Built for the field</span><span><Check size={14} /> Plain-language results</span></div>
      </div>
      <div className="hero-visual" aria-label="Illustration of a healthy crop field">
        <div className="sun-disc"><Sun size={28} /></div>
        <div className="hill hill-back" /><div className="hill hill-front" />
        <div className="field-lines">{Array.from({ length: 5 }).map((_, i) => <span key={i} />)}</div>
        <div className="hero-stalk stalk-one"><span /><span /><span /></div>
        <div className="hero-stalk stalk-two"><span /><span /><span /></div>
        <div className="hero-note"><span className="note-icon"><CloudRain size={17} /></span><span><b>Field note</b><small>Good planting conditions</small></span></div>
        <div className="hero-quote">“Look at the soil.<br /><b>Then make the call.</b>”</div>
      </div>
    </section>
    <section className="home-intro">
      <SectionKicker>Three useful tools. One calm place.</SectionKicker>
      <h2>Knowledge that meets you where the work is.</h2>
      <div className="feature-grid">
        <Link href="/advisory" className="feature-card feature-orange" data-testid="card-feature-advisory">
          <span className="feature-number">01</span><span className="feature-icon"><Wheat size={22} /></span>
          <h3>Choose what to plant</h3><p>Use your soil readings and local conditions to find crops that fit — not just crops that are popular.</p><span className="card-arrow"><ArrowRight size={17} /></span>
        </Link>
        <Link href="/scanner" className="feature-card feature-green" data-testid="card-feature-scanner">
          <span className="feature-number">02</span><span className="feature-icon"><Microscope size={22} /></span>
          <h3>Read a leaf</h3><p>Upload a clear photo and get a likely diagnosis, what to do next, and how to protect the rest of the crop.</p><span className="card-arrow"><ArrowRight size={17} /></span>
        </Link>
        <Link href="/dashboard" className="feature-card feature-ink" data-testid="card-feature-history">
          <span className="feature-number">03</span><span className="feature-icon"><History size={22} /></span>
          <h3>Keep your notes</h3><p>Your recommendations and scans stay together, so past seasons can inform the next one.</p><span className="card-arrow"><ArrowRight size={17} /></span>
        </Link>
      </div>
    </section>
    <section className="home-statement"><div className="statement-mark"><Leaf size={24} /></div><div><p className="kicker">Made for decisions, not dashboards</p><h2>Good advice should leave you knowing exactly what to do next.</h2></div></section>
    <footer className="home-footer"><Logo compact /><span>Field-ready guidance for better growing.</span><span className="footer-meta">Your data stays tied to this device.</span></footer>
  </div>;
}

const defaultAdvisory: AdvisoryInput = { nitrogen: 72, phosphorus: 42, potassium: 38, ph: 6.5, temperature: 25, humidity: 68, rainfall: 620, region: '', soilType: undefined, cropCategory: undefined };
const numericFields = [
  ['nitrogen', 'Nitrogen', 'mg/kg', 0, 140], ['phosphorus', 'Phosphorus', 'mg/kg', 0, 140], ['potassium', 'Potassium', 'mg/kg', 0, 140],
  ['ph', 'Soil pH', '0–14 scale', 0, 14], ['temperature', 'Temperature', '°C average', -20, 60], ['humidity', 'Humidity', '% average', 0, 100], ['rainfall', 'Rainfall', 'mm / season', 0, 5000],
] as const;

function FieldInput({ name, label, suffix, value, min, max, onChange }: { name: string; label: string; suffix: string; value: number | string; min: number; max: number; onChange: (value: string) => void }) {
  return <label className="field-control"><span>{label}</span><div className="input-wrap"><input data-testid={`input-${name}`} type="number" min={min} max={max} step={name === 'ph' ? '0.1' : '1'} value={value} onChange={(e) => onChange(e.target.value)} required /><small>{suffix}</small></div></label>;
}

function AdvisoryResult({ advisory, onReset }: { advisory: Advisory; onReset: () => void }) {
  const [selected, setSelected] = useState(0);
  const rec = advisory.recommendation;
  const selectedCrop: CropRecommendation | undefined = rec.crops[selected];
  return <section className="result-panel animate-in" data-testid="panel-advisory-result">
    <div className="result-heading"><div><SectionKicker>Your field plan</SectionKicker><h2>{rec.summary}</h2></div><button className="icon-button" onClick={onReset} aria-label="Start another advisory" data-testid="button-reset-advisory"><X size={18} /></button></div>
    <div className="crop-tabs">{rec.crops.map((crop, i) => <button key={crop.name} onClick={() => setSelected(i)} className={i === selected ? 'crop-tab selected' : 'crop-tab'} data-testid={`button-crop-${i}`}><span>{String(crop.fitScore).padStart(2, '0')}</span><b>{crop.name}</b><small>{crop.category}</small></button>)}</div>
    {selectedCrop && <div className="crop-detail"><div className="score-ring"><strong>{selectedCrop.fitScore}</strong><small>fit</small></div><div><h3>{selectedCrop.name}</h3><p>{selectedCrop.reason}</p><span className="window-label"><Sun size={14} /> Planting window: <b>{selectedCrop.plantingWindow}</b></span></div></div>}
    <div className="schedule-block"><div className="subhead"><span className="mini-icon"><Zap size={15} /></span><h3>Fertilizer rhythm</h3></div>{rec.fertilizerSchedule.map((step, i) => <div className="schedule-step" key={`${step.stage}-${i}`}><span className="step-count">{i + 1}</span><div><b>{step.stage}</b><small>{step.timing}</small></div><p>{step.recommendation}</p></div>)}</div>
    {rec.cautions.length > 0 && <div className="caution-box"><CircleAlert size={17} /><div><b>Keep an eye on</b>{rec.cautions.map((caution, i) => <p key={i}>{caution}</p>)}</div></div>}
    <Link href="/dashboard" className="button button-primary full-button" data-testid="link-result-history">Save is automatic — view history <ArrowRight size={17} /></Link>
  </section>;
}

function AdvisoryPage() {
  const [form, setForm] = useState<AdvisoryInput>(defaultAdvisory);
  const [result, setResult] = useState<Advisory | null>(null);
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();
  const create = useCreateAdvisory({ request });
  const update = (key: keyof AdvisoryInput, value: string) => setForm((current) => ({ ...current, [key]: ['region', 'soilType', 'cropCategory'].includes(key) ? value || undefined : Number(value) }));
  const submit = (e: FormEvent) => {
    e.preventDefault(); setMessage('');
    create.mutate({ data: form }, {
      onSuccess: (data) => { setResult(data); queryClient.invalidateQueries({ queryKey: getListAdvisoriesQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); },
      onError: () => setMessage('We could not create your advisory. Check your entries and try again.'),
    });
  };
  return <div className="tool-page">
    <div className="tool-header"><div><SectionKicker>Crop advisory</SectionKicker><h1>What should I plant?</h1><p>Tell us what your field is saying. We’ll turn the numbers into a short list you can act on.</p></div><span className="header-stamp"><Wheat size={20} /> Soil + weather</span></div>
    {!result ? <form className="advisory-form" onSubmit={submit}>
      <div className="form-section"><div className="form-section-heading"><span className="section-index">01</span><div><h2>Your place</h2><p>Start with where this field is located.</p></div></div><div className="form-grid"><label className="field-control wide"><span>Region or village</span><input data-testid="input-region" type="text" placeholder="e.g. Nashik, Maharashtra" value={form.region} onChange={(e) => update('region', e.target.value)} required /></label><label className="field-control"><span>Soil type <i>optional</i></span><select data-testid="select-soil-type" value={form.soilType ?? ''} onChange={(e) => update('soilType', e.target.value)}><option value="">Choose soil</option><option value="Sandy">Sandy</option><option value="Loamy">Loamy</option><option value="Clay">Clay</option><option value="Peaty">Peaty</option><option value="Saline">Saline</option></select></label><label className="field-control"><span>Crop focus <i>optional</i></span><select data-testid="select-crop-category" value={form.cropCategory ?? ''} onChange={(e) => update('cropCategory', e.target.value)}><option value="">Any crop</option><option value="Cereals">Cereals</option><option value="Pulses">Pulses</option><option value="Cash Crops">Cash Crops</option><option value="Fruits">Fruits</option><option value="Vegetables">Vegetables</option></select></label></div></div>
      <div className="form-section"><div className="form-section-heading"><span className="section-index">02</span><div><h2>Soil reading</h2><p>Use your latest soil test. Approximate is okay.</p></div></div><div className="form-grid three">{numericFields.slice(0, 4).map(([name, label, suffix, min, max]) => <FieldInput key={name} name={name} label={label} suffix={suffix} value={form[name]} min={min} max={max} onChange={(v) => update(name, v)} />)}</div></div>
      <div className="form-section"><div className="form-section-heading"><span className="section-index">03</span><div><h2>Weather pattern</h2><p>Season averages help us suggest a better fit.</p></div></div><div className="form-grid three">{numericFields.slice(4).map(([name, label, suffix, min, max]) => <FieldInput key={name} name={name} label={label} suffix={suffix} value={form[name]} min={min} max={max} onChange={(v) => update(name, v)} />)}</div></div>
      {message && <div className="error-banner" data-testid="status-advisory-error"><CircleAlert size={18} />{message}</div>}
      <div className="form-actions"><p><span className="status-dot online" /> Your result is saved to this device</p><button className="button button-primary" type="submit" disabled={create.isPending} data-testid="button-submit-advisory">{create.isPending ? <><RefreshCw className="spin" size={17} /> Reading your field…</> : <>Get my crop plan <ArrowRight size={18} /></>}</button></div>
    </form> : <AdvisoryResult advisory={result} onReset={() => { setResult(null); setMessage(''); }} />}
  </div>;
}

function ScannerPage() {
  const [file, setFile] = useState<{ name: string; data: string } | null>(null);
  const [region, setRegion] = useState('');
  const [result, setResult] = useState<Scan | null>(null);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();
  const create = useCreateScan({ request });
  const fileInput = useRef<HTMLInputElement>(null);
  const readFile = (selected: File) => {
    if (!selected.type.startsWith('image/')) { setMessage('Please choose a leaf photo in JPG, PNG, or WEBP format.'); return; }
    const reader = new FileReader();
    reader.onload = () => setFile({ name: selected.name, data: String(reader.result) });
    reader.readAsDataURL(selected);
  };
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => { const selected = e.target.files?.[0]; if (selected) readFile(selected); };
  const submit = () => {
    if (!file) return;
    setMessage('');
    create.mutate({ data: { imageData: file.data, fileName: file.name, region: region || undefined } }, {
      onSuccess: (data) => { setResult(data); queryClient.invalidateQueries({ queryKey: getListScansQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); },
      onError: () => setMessage('The scan could not be completed. Try a brighter, closer photo.'),
    });
  };
  return <div className="tool-page scanner-page">
    <div className="tool-header"><div><SectionKicker>Disease scanner</SectionKicker><h1>Read what the leaf is telling you.</h1><p>A clear photo can help spot a problem early. Get a likely diagnosis and practical steps for the crop.</p></div><span className="header-stamp green"><Microscope size={20} /> Photo diagnosis</span></div>
    {!result ? <div className="scanner-layout"><div className="scanner-main">
      <div className={`upload-zone ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); const dropped = e.dataTransfer.files[0]; if (dropped) readFile(dropped); }} onClick={() => fileInput.current?.click()} data-testid="dropzone-leaf">
        <input ref={fileInput} type="file" accept="image/*" onChange={onFileChange} hidden data-testid="input-leaf-file" />
        {file ? <><div className="preview-frame"><img src={file.data} alt="Selected leaf preview" data-testid="img-leaf-preview" /><button className="remove-photo" onClick={(e) => { e.stopPropagation(); setFile(null); }} aria-label="Remove photo" data-testid="button-remove-photo"><X size={15} /></button></div><b>{file.name}</b><small>Tap to choose a different photo</small></> : <><span className="upload-icon"><Upload size={25} /></span><h3>Drop a leaf photo here</h3><p>or <b>browse your device</b></p><small>JPG, PNG or WEBP · up to 8 MB</small></>}
      </div>
      <div className="scanner-field"><label className="field-control"><span>Region or village <i>optional</i></span><input data-testid="input-scanner-region" type="text" placeholder="Helps with local context" value={region} onChange={(e) => setRegion(e.target.value)} /></label></div>
      {message && <div className="error-banner" data-testid="status-scan-error"><CircleAlert size={18} />{message}</div>}
      <div className="form-actions scanner-actions"><p><span className="status-dot online" /> Photos are used for this scan only</p><button className="button button-primary" disabled={!file || create.isPending} onClick={submit} data-testid="button-submit-scan">{create.isPending ? <><RefreshCw className="spin" size={17} /> Looking closely…</> : <>Scan this leaf <ArrowRight size={18} /></>}</button></div>
    </div><aside className="scan-tips"><div className="tip-heading"><Zap size={16} /><b>For a better read</b></div><ul><li>Use daylight, without a harsh shadow.</li><li>Fill the frame with one affected leaf.</li><li>Show both the healthy and affected parts.</li></ul><div className="tip-divider" /><p><CircleAlert size={15} /> A scan is a helpful starting point, not a replacement for a local agronomist.</p></aside></div> : <DiagnosisResult scan={result} onReset={() => { setResult(null); setFile(null); }} />}
  </div>;
}

function DiagnosisResult({ scan, onReset }: { scan: Scan; onReset: () => void }) {
  const d: Diagnosis = scan.diagnosis;
  return <section className="diagnosis-result animate-in" data-testid="panel-diagnosis-result"><div className="diagnosis-top"><div className="diagnosis-photo">{scan.imageUrl ? <img src={scan.imageUrl} alt="Scanned leaf" /> : <Leaf size={46} />}</div><div><SectionKicker>Scan complete</SectionKicker><h2>{d.plant}: {d.condition}</h2><div className="diagnosis-meta"><span className={`severity severity-${d.severity.toLowerCase()}`}>{d.severity} concern</span><span>{d.confidence}% confidence</span></div></div></div><p className="diagnosis-explanation">{d.explanation}</p><div className="diagnosis-columns"><div><h3><span className="list-dot orange" />What to do now</h3><ul>{d.treatment.map((item, i) => <li key={i}>{item}</li>)}</ul></div><div><h3><span className="list-dot green" />Keep it from spreading</h3><ul>{d.prevention.map((item, i) => <li key={i}>{item}</li>)}</ul></div></div><div className="result-actions"><button className="button button-primary" onClick={onReset} data-testid="button-scan-another">Scan another leaf <ScanLine size={17} /></button><Link href="/dashboard" className="button button-quiet" data-testid="link-scan-history">View saved history <ArrowRight size={17} /></Link></div></section>;
}

function EmptyState({ type }: { type: 'advisory' | 'scan' }) {
  return <div className="empty-state"><span className="empty-icon">{type === 'advisory' ? <Wheat size={25} /> : <ScanLine size={25} />}</span><h3>No {type === 'advisory' ? 'crop plans' : 'leaf scans'} yet</h3><p>Your saved {type === 'advisory' ? 'recommendations' : 'diagnoses'} will show up here after your first one.</p><Link href={type === 'advisory' ? '/advisory' : '/scanner'} className="text-link" data-testid={`link-empty-${type}`}>{type === 'advisory' ? 'Make a crop plan' : 'Scan a leaf'} <ArrowRight size={15} /></Link></div>;
}

function DashboardPage() {
  const { data: summary, isLoading: summaryLoading, isError: summaryError, refetch: refetchSummary } = useGetDashboardSummary({ request });
  const { data: advisories, isLoading: advisoriesLoading } = useListAdvisories({ request });
  const { data: scans, isLoading: scansLoading } = useListScans({ request });
  const [tab, setTab] = useState<'activity' | 'advisories' | 'scans'>('activity');
  const [exportId, setExportId] = useState<number | null>(null);
  const { data: exported } = useExportAdvisory(exportId ?? 0, { query: { enabled: !!exportId, queryKey: getExportAdvisoryQueryKey(exportId ?? 0) }, request });
  useEffect(() => { if (exported && exportId) { const blob = new Blob([exported], { type: 'text/html' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `crop-advisory-${exportId}.html`; anchor.click(); URL.revokeObjectURL(url); setExportId(null); } }, [exported, exportId]);
  const activities = summary?.recentActivity ?? [];
  const latestAdvisory = summary?.latestAdvisory;
  const latestScan = summary?.latestScan;
  const loading = summaryLoading || advisoriesLoading || scansLoading;
  const list = useMemo(() => tab === 'advisories' ? (advisories ?? []) : tab === 'scans' ? (scans ?? []) : [], [tab, advisories, scans]);
  return <div className="tool-page dashboard-page">
    <div className="dashboard-heading"><div><SectionKicker>Your field book</SectionKicker><h1>History that helps you grow.</h1><p>Every plan and scan is kept here for a quick look back.</p></div><Link href="/advisory" className="button button-primary compact-button" data-testid="link-dashboard-new"><span className="plus">+</span> New advisory</Link></div>
    {summaryError ? <div className="error-banner large" data-testid="status-dashboard-error"><CircleAlert size={18} /><span>We couldn't load your field book.</span><button onClick={() => refetchSummary()} data-testid="button-retry-dashboard">Try again</button></div> : <>
      <div className="stats-grid"><div className="stat-card orange"><span className="stat-icon"><Wheat size={19} /></span><small>Crop plans</small><strong>{loading ? '—' : summary?.advisoryCount ?? 0}</strong><span>recommendations saved</span></div><div className="stat-card green"><span className="stat-icon"><ScanLine size={19} /></span><small>Leaf scans</small><strong>{loading ? '—' : summary?.scanCount ?? 0}</strong><span>diagnoses saved</span></div><div className="season-card"><div><small>Last field note</small><strong>{latestAdvisory ? 'Plan ready' : latestScan ? 'Scan ready' : 'Start your field book'}</strong><p>{latestAdvisory ? latestAdvisory.recommendation.crops[0]?.name ?? 'Crop plan' : latestScan ? latestScan.diagnosis.condition : 'Your first decision belongs here.'}</p></div><Sprout size={42} /></div></div>
      <div className="dashboard-content"><div className="activity-panel"><div className="panel-title"><div><SectionKicker>Timeline</SectionKicker><h2>Recent activity</h2></div><div className="tab-row">{(['activity', 'advisories', 'scans'] as const).map((item) => <button key={item} onClick={() => setTab(item)} className={tab === item ? 'tab active' : 'tab'} data-testid={`button-tab-${item}`}>{item === 'activity' ? 'All activity' : item === 'advisories' ? 'Crop plans' : 'Leaf scans'}</button>)}</div></div>
        {loading ? <div className="loading-list">{[1, 2, 3].map((i) => <div className="skeleton-row" key={i}><span /><div><i /><i /></div></div>)}</div> : tab === 'activity' ? activities.length === 0 ? <EmptyState type="advisory" /> : <div className="activity-list">{activities.map((item) => <div className="activity-item" key={`${item.type}-${item.id}`} data-testid={`row-activity-${item.id}`}><span className={`activity-icon ${item.type === 'scan' ? 'green' : 'orange'}`}>{item.type === 'scan' ? <ScanLine size={17} /> : <Wheat size={17} />}</span><div><b>{item.title}</b><p>{item.subtitle}</p></div><time>{new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</time><ChevronRight size={16} /></div>)}</div> : list.length === 0 ? <EmptyState type={tab === 'scans' ? 'scan' : 'advisory'} /> : <div className="activity-list">{list.map((item) => tab === 'advisories' ? <div className="activity-item" key={(item as Advisory).id}><span className="activity-icon orange"><Wheat size={17} /></span><div><b>{(item as Advisory).recommendation.crops[0]?.name ?? 'Crop plan'}</b><p>{(item as Advisory).recommendation.summary}</p></div><button className="small-icon-button" onClick={() => setExportId((item as Advisory).id)} title="Export advisory" data-testid={`button-export-${(item as Advisory).id}`}><Download size={15} /></button></div> : <div className="activity-item" key={(item as Scan).id}><span className="activity-icon green"><ScanLine size={17} /></span><div><b>{(item as Scan).diagnosis.condition}</b><p>{(item as Scan).diagnosis.plant} · {(item as Scan).diagnosis.severity} concern</p></div><time>{new Date((item as Scan).createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</time></div>)}</div>}
      </div><aside className="latest-panel"><SectionKicker>At a glance</SectionKicker><h2>Your latest notes</h2>{latestAdvisory ? <div className="latest-note"><span className="note-label orange-label"><Wheat size={14} /> CROP PLAN</span><h3>{latestAdvisory.recommendation.crops[0]?.name ?? 'Recommendation'}</h3><p>{latestAdvisory.recommendation.summary}</p><Link href="/advisory" className="text-link">Make another plan <ArrowRight size={14} /></Link></div> : <EmptyState type="advisory" />}{latestScan && <div className="latest-note scan-note"><span className="note-label green-label"><ScanLine size={14} /> LAST SCAN</span><h3>{latestScan.diagnosis.condition}</h3><p>{latestScan.diagnosis.explanation}</p><Link href="/scanner" className="text-link">Scan another leaf <ArrowRight size={14} /></Link></div>}</aside></div>
    </>}
  </div>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Shell><Switch><Route path="/" component={Home} /><Route path="/advisory" component={AdvisoryPage} /><Route path="/scanner" component={ScannerPage} /><Route path="/dashboard" component={DashboardPage} /><Route component={NotFound} /></Switch></Shell></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><Router /><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;