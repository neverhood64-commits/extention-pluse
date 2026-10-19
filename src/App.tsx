import React, { useState, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  Sun,
  Moon,
  Orbit,
  LayoutGrid,
  PanelRightOpen,
  Plus,
  Download,
  CheckSquare,
} from 'lucide-react';
import {
  PortalSite,
  DEFAULT_PORTAL_SITES,
  LOGO_ASSET_PATH,
  EXTENSION_TITLE,
  FOOTER_CREDIT,
} from './data/defaultSites';
import { OrbitalHubStage } from './components/OrbitalHubStage';
import { RightBubbleSidebar } from './components/RightBubbleSidebar';
import { TasksModal } from './components/TasksModal';
import { SiteEditorModal } from './components/SiteEditorModal';
import { ExtensionGuideModal } from './components/ExtensionGuideModal';
import { PureLogo } from './components/PureLogo';

export default function App() {
  const [sites, setSites] = useState<PortalSite[]>(() => {
    try {
      const saved = localStorage.getItem('mz7828_portal_sites_v1');
      return saved ? JSON.parse(saved) : DEFAULT_PORTAL_SITES;
    } catch {
      return DEFAULT_PORTAL_SITES;
    }
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('mz7828_theme_dark');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [viewMode, setViewMode] = useState<'orbital' | 'grid'>('orbital');
  const [selectedCategory, setSelectedCategory] = useState<string>('همه');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Right-side slide-out sidebar state
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(false);
  const [isRightSidebarPinned, setIsRightSidebarPinned] = useState<boolean>(false);

  // Background Logo Watermark Customization
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(0.09);
  const [watermarkBlur, setWatermarkBlur] = useState<number>(1);
  const [showBgSettings, setShowBgSettings] = useState<boolean>(false);

  // Modals
  const [isTasksOpen, setIsTasksOpen] = useState<boolean>(false);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingSite, setEditingSite] = useState<PortalSite | null>(null);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState<boolean>(false);

  // Live Persian Date & Clock
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('mz7828_portal_sites_v1', JSON.stringify(sites));
    } catch {
      // ignore storage errors
    }
  }, [sites]);

  useEffect(() => {
    try {
      localStorage.setItem('mz7828_theme_dark', JSON.stringify(isDark));
    } catch {
      // ignore storage errors
    }
  }, [isDark]);

  // Keyboard shortcuts 1-9 to launch portals quickly when not typing in an input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9 && sites[num - 1]) {
        window.open(sites[num - 1].url, '_blank', 'noopener,noreferrer');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sites]);

  const categories = ['همه', 'پورتال‌های اصلی', 'خدمات الکترونیک', 'استعلام و پایش', 'امور مالی و بانکی', 'پشتیبانی و مشاوره'];

  const filteredSites = sites.filter((site) => {
    const matchesCategory = selectedCategory === 'همه' || site.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.url.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSaveSite = (siteData: Omit<PortalSite, 'id' | 'shortcutKey'> & { id?: string }) => {
    if (siteData.id) {
      setSites((prev) =>
        prev.map((s) =>
          s.id === siteData.id
            ? {
                ...s,
                name: siteData.name,
                subtitle: siteData.subtitle,
                url: siteData.url,
                category: siteData.category,
                iconName: siteData.iconName,
                accentColor: siteData.accentColor,
              }
            : s
        )
      );
    } else {
      const newSite: PortalSite = {
        id: `site-${Date.now()}`,
        name: siteData.name,
        subtitle: siteData.subtitle,
        url: siteData.url,
        category: siteData.category,
        iconName: siteData.iconName,
        accentColor: siteData.accentColor,
        shortcutKey: sites.length + 1,
      };
      setSites((prev) => [...prev, newSite]);
    }
  };

  const handleDeleteSite = (id: string) => {
    setSites((prev) => prev.filter((s) => s.id !== id));
  };

  const handleResetDefaults = () => {
    setSites(DEFAULT_PORTAL_SITES);
  };

  const persianDate = new Intl.DateTimeFormat('fa-IR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);

  const persianTime = new Intl.DateTimeFormat('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(now);

  return (
    <div
      className={`min-h-screen flex flex-col justify-between relative overflow-x-hidden transition-colors duration-300 ${
        isDark
          ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100'
          : 'bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 text-slate-900'
      }`}
    >
      {/* Faint Watermark Pure Logo in Background (بدون حاشیه و فقط اصل لوگو به صورت کم رنگ در پس‌زمینه) */}
      <div
        className="fixed inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden"
        style={{
          opacity: watermarkOpacity,
          filter: `blur(${watermarkBlur}px)`,
        }}
      >
        <PureLogo
          alt=""
          className="w-[560px] h-[560px] max-w-[80vw] max-h-[80vh] object-contain"
        />
      </div>

      {/* Top Navigation Bar (Strict 3-Zone Contract) */}
      <header
        className={`relative z-30 flex items-center justify-between gap-8 px-6 py-3.5 border-b backdrop-blur-xl ${
          isDark ? 'bg-slate-950/75 border-white/10' : 'bg-white/80 border-slate-200/90'
        }`}
      >
        {/* Zone 1: Single-line Brand Title Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setViewMode('orbital');
          }}
          className="text-base sm:text-lg font-extrabold tracking-tight whitespace-nowrap shrink-0"
        >
          {EXTENSION_TITLE}
        </a>

        {/* Zone 2: 4–5 Clean Single-Line Text Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setViewMode('orbital')}
            className={`hover:underline underline-offset-8 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              viewMode === 'orbital'
                ? 'text-emerald-400 font-bold'
                : isDark
                ? 'text-slate-300 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            نمای مداری سه‌بعدی
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRightSidebarOpen(true);
              setIsRightSidebarPinned(true);
            }}
            className={`hover:underline underline-offset-8 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              isRightSidebarOpen
                ? 'text-emerald-400 font-bold'
                : isDark
                ? 'text-slate-300 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            سایدبار کشویی راست
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingSite(null);
              setIsEditorOpen(true);
            }}
            className={`hover:underline underline-offset-8 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            افزودن سامانه
          </button>
          <button
            type="button"
            onClick={() => setIsTasksOpen(true)}
            className={`hover:underline underline-offset-8 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            وظایف و Google Tasks
          </button>
          <button
            type="button"
            onClick={() => setShowBgSettings(!showBgSettings)}
            className={`hover:underline underline-offset-8 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              showBgSettings
                ? 'text-emerald-400 font-bold'
                : isDark
                ? 'text-slate-300 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            تنظیمات پس‌زمینه
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action Button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsExtensionModalOpen(true)}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/25 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>دانلود افزونه کروم</span>
          </button>
        </div>
      </header>

      {/* Secondary Workspace Control Bar */}
      <section className="relative z-20 max-w-6xl w-full mx-auto px-6 pt-4">
        <div
          className={`rounded-2xl border px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 backdrop-blur-xl ${
            isDark ? 'bg-slate-900/65 border-white/10' : 'bg-white/75 border-slate-200/90'
          }`}
        >
          {/* Search Input & Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[260px]">
            <div className="relative w-56 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی نام یا آدرس سامانه..."
                className={`w-full pr-8 pl-3 py-1.5 rounded-xl text-xs border outline-none transition-colors ${
                  isDark
                    ? 'bg-slate-950/80 border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/60'
                    : 'bg-slate-100 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-600'
                }`}
              />
            </div>

            {/* Interactive Category Filter Buttons */}
            <div
              className={`hidden xl:flex items-center gap-1 p-1 rounded-xl ${
                isDark ? 'bg-slate-950/70' : 'bg-slate-200/70'
              }`}
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : isDark
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Right Controls: Date/Time + View Mode + Sidebar Trigger + Theme */}
          <div className="flex items-center gap-2 shrink-0">
            <div
              className={`hidden md:flex items-center gap-2 text-xs px-2.5 py-1 ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              <span>{persianDate}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums font-bold text-emerald-400">{persianTime}</span>
            </div>

            {/* Segmented View Switcher (Orbital 3D vs Grid 3D) */}
            <div
              className={`flex items-center gap-1 p-1 rounded-xl ${
                isDark ? 'bg-slate-950/80' : 'bg-slate-200/80'
              }`}
            >
              <button
                type="button"
                onClick={() => setViewMode('orbital')}
                title="نمای دایره‌ای حباب در مرکز"
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  viewMode === 'orbital'
                    ? 'bg-emerald-600 text-white'
                    : isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Orbit className="w-3.5 h-3.5" />
                <span>مداری</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="نمای شبکه‌ای سه‌بعدی"
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  viewMode === 'grid'
                    ? 'bg-emerald-600 text-white'
                    : isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>کارت‌ها</span>
              </button>
            </div>

            {/* Open Right Slide-Out Sidebar Button */}
            <button
              type="button"
              onClick={() => {
                setIsRightSidebarOpen(!isRightSidebarOpen);
                if (!isRightSidebarOpen) setIsRightSidebarPinned(true);
              }}
              title="باز کردن سایدبار کشویی سمت راست"
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isRightSidebarOpen
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : isDark
                  ? 'bg-slate-800/80 border-white/10 text-slate-200 hover:bg-slate-800'
                  : 'bg-slate-200/80 border-slate-300 text-slate-800 hover:bg-slate-300'
              }`}
            >
              <PanelRightOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">سایدبار راست</span>
            </button>

            {/* Tasks Quick Trigger */}
            <button
              type="button"
              onClick={() => setIsTasksOpen(true)}
              title="مدیریت وظایف روزانه و Google Tasks"
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-slate-800/80 border-white/10 text-emerald-400 hover:bg-slate-800'
                  : 'bg-slate-200/80 border-slate-300 text-emerald-700 hover:bg-slate-300'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
            </button>

            {/* Add Site Trigger */}
            <button
              type="button"
              onClick={() => {
                setEditingSite(null);
                setIsEditorOpen(true);
              }}
              title="افزودن سامانه جدید"
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-slate-800/80 border-white/10 text-slate-200 hover:bg-slate-800'
                  : 'bg-slate-200/80 border-slate-300 text-slate-800 hover:bg-slate-300'
              }`}
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Watermark Settings Toggle */}
            <button
              type="button"
              onClick={() => setShowBgSettings(!showBgSettings)}
              title="تنظیم شفافیت لوگوی پس‌زمینه"
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                showBgSettings
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                  : isDark
                  ? 'bg-slate-800/80 border-white/10 text-slate-300 hover:bg-slate-800'
                  : 'bg-slate-200/80 border-slate-300 text-slate-700 hover:bg-slate-300'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* Light / Dark Theme Switcher */}
            <button
              type="button"
              onClick={() => setIsDark(!isDark)}
              title={isDark ? 'تم روشن' : 'تم تیره'}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-slate-800/80 border-white/10 text-amber-300 hover:bg-slate-800'
                  : 'bg-slate-200/80 border-slate-300 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Collapsible Watermark Opacity & Blur Controls */}
        {showBgSettings && (
          <div
            className={`mt-2 rounded-2xl border px-5 py-3 flex flex-wrap items-center justify-between gap-6 backdrop-blur-xl ${
              isDark ? 'bg-slate-900/85 border-white/15' : 'bg-white/90 border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold">میزان وضوح لوگوی کم‌رنگ پس‌زمینه:</span>
              <input
                type="range"
                min="0.02"
                max="0.35"
                step="0.01"
                value={watermarkOpacity}
                onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                className="w-36 accent-emerald-500 cursor-pointer"
              />
              <span className="text-xs font-mono tabular-nums text-emerald-400">
                {Math.round(watermarkOpacity * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold">میزان محو شدن (Blur) لوگو:</span>
              <input
                type="range"
                min="0"
                max="8"
                step="0.5"
                value={watermarkBlur}
                onChange={(e) => setWatermarkBlur(parseFloat(e.target.value))}
                className="w-32 accent-emerald-500 cursor-pointer"
              />
              <span className="text-xs font-mono tabular-nums text-emerald-400">{watermarkBlur}px</span>
            </div>
          </div>
        )}
      </section>

      {/* Main 3D Orbital Stage (Central 3D Logo Bubble + Surrounding 3D Portals) */}
      <main className="relative z-10 flex-1 flex flex-col justify-center">
        <OrbitalHubStage
          sites={filteredSites}
          isDark={isDark}
          viewMode={viewMode}
          onEditSite={(site) => {
            setEditingSite(site);
            setIsEditorOpen(true);
          }}
          onDeleteSite={handleDeleteSite}
          onAddSite={() => {
            setEditingSite(null);
            setIsEditorOpen(true);
          }}
          onOpenRightSidebar={() => {
            setIsRightSidebarOpen(true);
            setIsRightSidebarPinned(true);
          }}
        />
      </main>

      {/* Right-Side Floating 3D Bubble + Slide-Out Sidebar Drawer */}
      <RightBubbleSidebar
        sites={sites}
        isDark={isDark}
        watermarkOpacity={watermarkOpacity}
        isOpen={isRightSidebarOpen}
        isPinned={isRightSidebarPinned}
        onOpenChange={setIsRightSidebarOpen}
        onPinChange={setIsRightSidebarPinned}
        onAddSite={() => {
          setEditingSite(null);
          setIsEditorOpen(true);
        }}
        onEditSite={(site) => {
          setEditingSite(site);
          setIsEditorOpen(true);
        }}
      />

      {/* Bottom Footer Bar with Requested Exact Credit */}
      <footer
        className={`relative z-30 py-2.5 px-6 border-t backdrop-blur-md text-center ${
          isDark
            ? 'bg-slate-950/85 border-white/10 text-slate-300'
            : 'bg-white/85 border-slate-200 text-slate-700'
        }`}
      >
        <p className="text-xs font-bold tracking-wide">{FOOTER_CREDIT}</p>
      </footer>

      {/* Modals */}
      <TasksModal
        isOpen={isTasksOpen}
        isDark={isDark}
        onClose={() => setIsTasksOpen(false)}
      />

      <SiteEditorModal
        isOpen={isEditorOpen}
        isDark={isDark}
        editingSite={editingSite}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveSite}
        onResetDefaults={handleResetDefaults}
      />

      <ExtensionGuideModal
        isOpen={isExtensionModalOpen}
        isDark={isDark}
        sites={sites}
        onClose={() => setIsExtensionModalOpen(false)}
      />
    </div>
  );
}
