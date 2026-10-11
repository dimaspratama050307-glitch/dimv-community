import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  Activity, AudioLines, Boxes, ChevronDown, CircleHelp, Clock3, Code2,
  CreditCard, Crown, ExternalLink, FileClock, FolderKanban, Gift, Globe2,
  Headphones, LayoutDashboard, LogIn, LogOut, Menu, Package, Settings,
  ShieldCheck, Sparkles, WandSparkles, X, Zap
} from "lucide-react";
import { isSupabaseConfigured, supabase } from "./lib/supabase";

type Page = "Dashboard" | "Bypass Music" | "Config" | "Spoofer" | "Skybox" | "Editor" | "Asset Manager" | "Obfuscator" | "UGC" | "History" | "Info";
const nav: { label: Page; icon: typeof LayoutDashboard; section: string }[] = [
  { label: "Dashboard", icon: LayoutDashboard, section: "WORKSPACE" },
  { label: "Bypass Music", icon: AudioLines, section: "WORKSPACE" },
  { label: "Config", icon: Settings, section: "WORKSPACE" },
  { label: "Spoofer", icon: Boxes, section: "WORKSPACE" },
  { label: "Skybox", icon: Globe2, section: "WORKSPACE" },
  { label: "Editor", icon: Code2, section: "WORKSPACE" },
  { label: "Asset Manager", icon: FolderKanban, section: "WORKSPACE" },
  { label: "Obfuscator", icon: ShieldCheck, section: "WORKSPACE" },
  { label: "UGC", icon: Package, section: "WORKSPACE" },
  { label: "History", icon: FileClock, section: "ACCOUNT" },
  { label: "Info", icon: CircleHelp, section: "ACCOUNT" }
];

const descriptions: Record<Page, string> = {
  "Dashboard": "Ringkasan akun, akses, dan aktivitas terbaru.",
  "Bypass Music": "Area pemrosesan audio. Mesin pemrosesan belum dihubungkan.",
  "Config": "Kelola konfigurasi yang tersedia untuk akunmu.",
  "Spoofer": "Area tools aset dan saldo token. Integrasi backend belum aktif.",
  "Skybox": "Area pengaturan skybox.",
  "Editor": "Editor interaktif akan ditempatkan di sini.",
  "Asset Manager": "Kelola aset yang kamu punya izin untuk gunakan.",
  "Obfuscator": "Area pemrosesan kode yang kamu miliki atau berhak modifikasi.",
  "UGC": "Pusat informasi dan pengelolaan UGC.",
  "History": "Riwayat aktivitas dan transaksi akan muncul setelah backend dibuat.",
  "Info": "Informasi layanan, bantuan, dan panduan DimV Community."
};

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [page, setPage] = useState<Page>("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [configured, setConfigured] = useState(isSupabaseConfigured);
  const [profileName, setProfileName] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) setSession(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setMessage("");
    });
    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!supabase || !session?.user) {
        setProfileName(null);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", session.user.id)
        .maybeSingle();
      setProfileName(data?.display_name ?? session.user.user_metadata?.full_name ?? session.user.email ?? "Member");
    };
    void fetchProfile();
  }, [session]);

  const userLabel = useMemo(() => {
    return profileName || session?.user.user_metadata?.full_name || session?.user.email || "Guest";
  }, [profileName, session]);

  async function login() {
    if (!supabase) {
      setMessage("Supabase belum dikonfigurasi. Isi environment variables terlebih dahulu.");
      return;
    }
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo: window.location.origin }
    });
    if (error) setMessage(`Login gagal: ${error.message}`);
    setBusy(false);
  }

  async function logout() {
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.auth.signOut();
    setMessage(error ? `Logout gagal: ${error.message}` : "Kamu sudah logout.");
    setBusy(false);
  }

  const selected = nav.find((item) => item.label === page);
  const pageIcon = selected?.icon ?? LayoutDashboard;

  if (!session) {
    return (
      <main className="login-shell">
        <div className="ambient ambient-one" /><div className="ambient ambient-two" />
        <header className="top-brand"><BrandMark /><span>DIMV <b>COMMUNITY</b></span><span className="status-pill"><i /> SYSTEM ONLINE</span></header>
        <section className="login-card">
          <div className="hero-icon"><Sparkles size={25} /></div>
          <p className="eyebrow">YOUR CREATIVE WORKSPACE</p>
          <h1>Build. Create.<br /><span>Go beyond.</span></h1>
          <p className="login-copy">Satu ruang untuk tools, aset, dan fitur komunitas DimV.</p>
          {!configured && <div className="notice warning"><ShieldCheck size={17} /><span>Supabase belum dikonfigurasi. Website bisa dibuka, tetapi login belum aktif.</span></div>}
          {message && <div className="notice warning">{message}</div>}
          <button className="primary-button login-button" onClick={login} disabled={busy || !configured}>
            <LogIn size={18} /> {busy ? "Menghubungkan..." : "Continue with Discord"}
          </button>
          <div className="secure-note"><ShieldCheck size={14} /> Login aman melalui Discord OAuth</div>
        </section>
        <footer className="login-footer">© {new Date().getFullYear()} DimV Community <span>•</span> Made for creators</footer>
      </main>
    );
  }

  return (
    <div className="app-shell">
      {sidebarOpen && <button aria-label="Tutup navigasi" className="mobile-scrim" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand-row"><BrandMark /><div className="brand-copy"><strong>DIMV COMMUNITY</strong><small>CREATOR WORKSPACE</small></div><button className="icon-button mobile-close" onClick={() => setSidebarOpen(false)} aria-label="Tutup"><X size={18}/></button></div>
        <div className="workspace-switch"><div className="workspace-avatar">D</div><div><strong>DimV Workspace</strong><small>Personal workspace</small></div><ChevronDown size={15}/></div>
        {["WORKSPACE", "ACCOUNT"].map((section) => (
          <div className="nav-section" key={section}>
            <p>{section}</p>
            {nav.filter((item) => item.section === section).map((item) => {
              const Icon = item.icon;
              return <button key={item.label} className={`nav-link ${page === item.label ? "active" : ""}`} onClick={() => { setPage(item.label); setSidebarOpen(false); }}>
                <Icon size={17}/><span>{item.label}</span>{item.label === "Bypass Music" && <span className="nav-dot"/>}
              </button>;
            })}
          </div>
        ))}
        <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><Headphones size={17}/></div><strong>Need a hand?</strong><p>Visit the info page for help and updates.</p><button onClick={() => setPage("Info")}>Open help center <ExternalLink size={13}/></button></div><div className="profile-row"><div className="profile-avatar">{String(userLabel).slice(0, 1).toUpperCase()}</div><div className="profile-details"><strong>{userLabel}</strong><small>Signed in with Discord</small></div><button className="icon-button" onClick={logout} title="Logout" aria-label="Logout"><LogOut size={16}/></button></div></div>
      </aside>
      <main className="main-panel">
        <header className="main-header"><button className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Buka navigasi"><Menu size={20}/></button><div className="breadcrumb">Workspace <span>/</span> <strong>{page}</strong></div><div className="header-actions"><span className="status-pill"><i/> ALL SYSTEMS NORMAL</span><button className="help-icon-button" onClick={() => setPage("Info")} aria-label="Bantuan"><CircleHelp size={18}/></button><div className="mini-avatar">{String(userLabel).slice(0,1).toUpperCase()}</div></div></header>
        <div className="page-content">
          <div className="page-heading"><div><div className="eyebrow blue-eyebrow">DIMV WORKSPACE <span>•</span> {page.toUpperCase()}</div><h1>{page === "Dashboard" ? <>Welcome back, <span>{String(userLabel).split(" ")[0]}</span>.</> : page}</h1><p>{descriptions[page]}</p></div><button className="outline-button" onClick={() => setPage("Info")}><CircleHelp size={16}/> Help center</button></div>
          {message && <div className="notice">{message}</div>}
          {page === "Dashboard" ? <Dashboard userLabel={String(userLabel)} onNavigate={setPage}/> : <ToolPlaceholder page={page} Icon={pageIcon}/>}
          <footer className="app-footer"><span>© {new Date().getFullYear()} DimV Community</span><span><i/> Secure workspace</span><span>v0.1.0 foundation</span></footer>
        </div>
      </main>
    </div>
  );
}

function BrandMark() {
  return <div className="brand-mark"><Zap size={21} fill="currentColor"/></div>;
}

function Dashboard({ userLabel, onNavigate }: { userLabel: string; onNavigate: (page: Page) => void }) {
  return <>
    <section className="welcome-banner"><div className="banner-orb orb-a"/><div className="banner-orb orb-b"/><div className="banner-content"><div className="banner-tag"><Sparkles size={13}/> CREATOR HUB</div><h2>Your next idea<br/>starts <span>here.</span></h2><p>Selamat datang, {userLabel}. Jelajahi workspace dan temukan tools yang kamu perlukan.</p><button className="primary-button" onClick={() => onNavigate("Bypass Music")}>Explore tools <Activity size={16}/></button></div><div className="banner-art"><div className="art-ring ring-one"/><div className="art-ring ring-two"/><div className="art-core"><Zap size={43} fill="currentColor"/></div><div className="floating-chip chip-one"><AudioLines size={17}/></div><div className="floating-chip chip-two"><Boxes size={17}/></div><div className="floating-chip chip-three"><WandSparkles size={17}/></div></div></section>
    <div className="section-title"><div><h2>Workspace overview</h2><p>Ringkasan area kerja kamu.</p></div><span className="live-label"><i/> LIVE PREVIEW</span></div>
    <section className="stats-grid">
      <StatCard icon={Crown} label="Membership" value="Free plan" note="Paket akun saat ini" />
      <StatCard icon={Gift} label="Token balance" value="—" note="Menunggu integrasi database" />
      <StatCard icon={Activity} label="Daily usage" value="— / —" note="Belum ada mesin tools terhubung" />
      <StatCard icon={Clock3} label="Next expiry" value="—" note="Status langganan akan tampil di sini" />
    </section>
    <div className="section-title tools-title"><div><h2>Quick access</h2><p>Mulai dari tools yang tersedia di workspace.</p></div><button className="text-button" onClick={() => onNavigate("Info")}>View all <ExternalLink size={14}/></button></div>
    <section className="quick-grid">
      <QuickCard icon={AudioLines} title="Bypass Music" desc="Audio workspace" onClick={() => onNavigate("Bypass Music")}/>
      <QuickCard icon={Boxes} title="Spoofer" desc="Token & assets" onClick={() => onNavigate("Spoofer")}/>
      <QuickCard icon={Globe2} title="Skybox" desc="Environment tools" onClick={() => onNavigate("Skybox")}/>
      <QuickCard icon={Code2} title="Editor" desc="Creative workspace" onClick={() => onNavigate("Editor")}/>
    </section>
    <section className="bottom-grid"><div className="panel-card"><div className="panel-heading"><div className="panel-icon"><CreditCard size={17}/></div><div><h3>Membership & store</h3><p>Plans, token packs, and purchases.</p></div></div><div className="panel-empty"><Package size={22}/><span>Store integration is not enabled yet.</span><small>Pembelian belum aktif pada versi fondasi.</small></div><button className="outline-button full-width" onClick={() => onNavigate("Info")}>View membership info <ExternalLink size={14}/></button></div><div className="panel-card"><div className="panel-heading"><div className="panel-icon"><FileClock size={17}/></div><div><h3>Recent activity</h3><p>Latest events from your account.</p></div></div><div className="panel-empty"><Activity size={22}/><span>Nothing to show yet.</span><small>Aktivitas akan muncul setelah backend tools dibuat.</small></div><button className="outline-button full-width" onClick={() => onNavigate("History")}>Open activity history <ExternalLink size={14}/></button></div></section>
  </>;
}

function StatCard({ icon: Icon, label, value, note }: { icon: typeof Crown; label: string; value: string; note: string }) {
  return <div className="stat-card"><div className="stat-top"><div className="stat-icon"><Icon size={17}/></div><span>{label}</span></div><strong>{value}</strong><small>{note}</small></div>;
}

function QuickCard({ icon: Icon, title, desc, onClick }: { icon: typeof AudioLines; title: string; desc: string; onClick: () => void }) {
  return <button className="quick-card" onClick={onClick}><div className="quick-icon"><Icon size={19}/></div><div><strong>{title}</strong><small>{desc}</small></div><ExternalLink className="quick-arrow" size={15}/></button>;
}

function ToolPlaceholder({ page, Icon }: { page: Page; Icon: typeof LayoutDashboard }) {
  return <section className="tool-placeholder"><div className="placeholder-icon"><Icon size={28}/></div><div className="eyebrow blue-eyebrow">WORKSPACE MODULE</div><h2>{page}</h2><p>{descriptions[page]}</p><div className="coming-soon"><span className="pulse-dot"/> Module foundation ready <span>•</span> Backend integration pending</div><div className="placeholder-note"><ShieldCheck size={17}/><span>Halaman ini sudah terdaftar di navigasi, tetapi proses sebenarnya belum diaktifkan. Ini mencegah tombol palsu memberi kesan bahwa tools sudah bekerja.</span></div></section>;
}

export default App;