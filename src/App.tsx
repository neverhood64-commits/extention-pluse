import React, { useState, useEffect } from 'react';
import {
  Search,
  Sun,
  Moon,
  Orbit,
  LayoutGrid,
  PanelRightOpen,
  Plus,
  Download,
  CheckSquare,
  Settings,
} from 'lucide-react';
import {
  PortalSite,
  DEFAULT_PORTAL_SITES,
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
      const saved = localStorage.getItem('mz7828_portal_sites_v2');
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

  // Right-side slide-out sidebar state (closed by default; opens only on click)
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(false);
  const [isRightSidebarPinned, setIsRightSidebarPinned] = useState<boolean>(false);

  // Header left-side Gear Settings Menu state
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState<boolean>(false);

  // Background Logo Watermark Customization
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(0.09);
  const [watermarkBlur, setWatermarkBlur] = useState<number>(1);

  // Modals
  const [isTasksOpen, setIsTasksOpen] = useState<boolean>(false);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingSite, setEditingSite] = useState<PortalSite | null>(null);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState<boolean>(false);

  // Live Persian Date & Clock (updates every second)
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('mz7828_portal_sites_v2', JSON.stringify(sites));
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

  // Keyboard shortcuts 1-9 to launch portals quickly
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

  const persianDateShort = new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

  const persianTime = new Intl.DateTimeFormat('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(now);

  return (
    <div
      className={`min-h-screen flex flex-col justify-between relative overflow-x-hidden transition-colors duration-300 ${
        isDark
          ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100'
          : 'bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 text-slate-900'
      }`}
    >
      {/* Faint Watermark Pure Logo in Background */}
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

      {/* Top Navigation Bar:
          - Right Side (سمت راست هدر): Stacked Persian Clock & Date (ساعت و تاریخ فارسی زیر هم) + Brand Title in Homa font
          - Center: Navigation & Search
          - Left Side (سمت چپ هدر): Gear Icon Settings Button (آیکون چرخ دنده) + Chrome Extension Download
      */}
      <header
        className={`relative z-40 flex items-center justify-between gap-4 px-5 py-3 border-b backdrop-blur-xl ${
          isDark ? 'bg-slate-950/85 border-white/10' : 'bg-white/85 border-slate-200/90'
        }`}
      >
        {/* Zone 1 (Right Side in RTL): Stacked Persian Time & Date + Brand Title in Homa Font */}
        <div className="flex items-center gap-4 shrink-0">
          <div
            className={`flex flex-col items-start justify-center px-3 py-1 rounded-xl border leading-tight ${
              isDark ? 'bg-slate-900/90 border-white/10' : 'bg-slate-100 border-slate-300/80'
            }`}
          >
            <span className="text-xs sm:text-sm font-extrabold text-emerald-400 font-mono tabular-nums">
              {persianTime}
            </span>
            <span className={`text-[10px] sm:text-[11px] font-semibold mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {persianDate}
            </span>
          </div>

          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setViewMode('orbital');
            }}
            className="font-homa text-base sm:text-lg font-bold tracking-tight whitespace-nowrap shrink-0"
          >
            {EXTENSION_TITLE}
          </a>
        </div>

        {/* Zone 2 (Center): Quick Search & View Links */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی نام یا آدرس سامانه..."
              className={`w-full pr-8 pl-3 py-1.5 rounded-xl text-xs border outline-none transition-colors ${
                isDark
                  ? 'bg-slate-900/80 border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/60'
                  : 'bg-slate-100 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-600'
              }`}
            />
          </div>

          <button
            type="button"
            onClick={() => setIsTasksOpen(true)}
            className={`text-xs font-semibold flex items-center gap-1.5 hover:underline underline-offset-8 cursor-pointer whitespace-nowrap shrink-0 ${
              isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>وظایف روزانه</span>
          </button>
        </div>

        {/* Zone 3 (Left Side in RTL): Download Extension Button + Gear Settings Icon on the Far Left */}
        <div className="flex items-center gap-2.5 shrink-0 relative">
          <button
            type="button"
            onClick={() => setIsExtensionModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/25 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>دانلود افزونه کروم</span>
          </button>

          {/* Gear Settings Button on the Left Side of Header (دکمه تنظیمات در هدر سمت چپ با آیکون چرخ دنده) */}
          <button
            type="button"
            onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}
            title="تنظیمات (تم، افزودن کارت، تنظیم نمایش افزونه)"
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
              isSettingsMenuOpen
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/25'
                : isDark
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-white/15'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="text-xs font-bold hidden sm:inline">تنظیمات</span>
          </button>

          {/* Left Header Gear Settings Popover Panel */}
          {isSettingsMenuOpen && (
            <div
              className={`absolute left-0 top-13 w-72 rounded-2xl border p-4 shadow-2xl z-50 space-y-3.5 ${
                isDark
                  ? 'bg-slate-900 border-white/20 text-slate-100'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="font-homa text-sm font-bold">تنظیمات افزونه</span>
                <button
                  type="button"
                  onClick={() => setIsSettingsMenuOpen(false)}
                  className="text-xs text-slate-400 hover:text-emerald-400 cursor-pointer"
                >
                  بستن
                </button>
              </div>

              {/* 1. Theme Settings */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 block">۱. تنظیمات تم و پس‌زمینه</span>
                <button
                  type="button"
                  onClick={() => setIsDark(!isDark)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-slate-950 border-white/10 hover:border-emerald-500/50'
                      : 'bg-slate-100 border-slate-300 hover:border-emerald-500'
                  }`}
                >
                  <span>حالت فعلی: {isDark ? 'تم تیره (شب)' : 'تم روشن (روز)'}</span>
                  {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
                </button>

                <div className="pt-1 flex items-center justify-between gap-2 text-[11px]">
                  <span>وضوح لوگوی پس‌زمینه:</span>
                  <input
                    type="range"
                    min="0.02"
                    max="0.35"
                    step="0.01"
                    value={watermarkOpacity}
                    onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                    className="w-28 accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* 2. Add Card Setting */}
              <div className="space-y-1.5 pt-1 border-t border-white/10">
                <span className="text-[11px] font-bold text-slate-400 block">۲. مدیریت کارت‌ها و سامانه‌ها</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsSettingsMenuOpen(false);
                    setEditingSite(null);
                    setIsEditorOpen(true);
                  }}
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span>اضافه کردن کارت / سامانه جدید</span>
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* 3. Extension Display Mode Setting */}
              <div className="space-y-1.5 pt-1 border-t border-white/10">
                <span className="text-[11px] font-bold text-slate-400 block">۳. تنظیم نمایش افزونه</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setViewMode('orbital')}
                    className={`px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border cursor-pointer ${
                      viewMode === 'orbital'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : isDark
                        ? 'bg-slate-950 border-white/10 text-slate-300'
                        : 'bg-slate-100 border-slate-300 text-slate-700'
                    }`}
                  >
                    <Orbit className="w-3.5 h-3.5" />
                    <span>نمای مداری</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border cursor-pointer ${
                      viewMode === 'grid'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : isDark
                        ? 'bg-slate-950 border-white/10 text-slate-300'
                        : 'bg-slate-100 border-slate-300 text-slate-700'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>نمای کارت‌ها</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const next = !isRightSidebarOpen;
                    setIsRightSidebarOpen(next);
                    setIsRightSidebarPinned(next);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border cursor-pointer ${
                    isRightSidebarOpen
                      ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                      : isDark
                      ? 'bg-slate-950 border-white/10 text-slate-300'
                      : 'bg-slate-100 border-slate-300 text-slate-700'
                  }`}
                >
                  <span>پنل کشویی سمت راست</span>
                  <PanelRightOpen className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main 3D Orbital Stage */}
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
            setIsRightSidebarOpen(!isRightSidebarOpen);
            if (!isRightSidebarOpen) setIsRightSidebarPinned(true);
          }}
        />
      </main>

      {/* Right-Side Sliding Sidebar Drawer (به محض فعال شدن در سمت راست قرار می‌گیرد) */}
      <RightBubbleSidebar
        sites={sites}
        isDark={isDark}
        watermarkOpacity={watermarkOpacity}
        isOpen={isRightSidebarOpen}
        isPinned={isRightSidebarPinned}
        persianTime={persianTime}
        persianDateShort={persianDateShort}
        onOpenChange={setIsRightSidebarOpen}
        onPinChange={setIsRightSidebarPinned}
        onToggleTheme={() => setIsDark(!isDark)}
        onAddSite={() => {
          setEditingSite(null);
          setIsEditorOpen(true);
        }}
        onEditSite={(site) => {
          setEditingSite(site);
          setIsEditorOpen(true);
        }}
      />

      {/* Bottom Footer Bar in Homa Font (نوار پایین افزونه با فونت هما) */}
      <footer
        className={`font-homa relative z-30 py-2.5 px-6 border-t backdrop-blur-md text-center ${
          isDark
            ? 'bg-slate-950/85 border-white/10 text-slate-200'
            : 'bg-white/85 border-slate-200 text-slate-800'
        }`}
      >
        <p className="text-xs sm:text-sm font-bold tracking-wide">{FOOTER_CREDIT}</p>
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
