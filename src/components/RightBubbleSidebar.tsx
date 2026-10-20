import React, { useState, useRef, useEffect } from 'react';
import {
  Pin,
  PinOff,
  ExternalLink,
  Plus,
  Orbit,
  List,
  Settings,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import {
  PortalSite,
  EXTENSION_TITLE,
  FOOTER_CREDIT,
  getOrbitalPosition,
} from '../data/defaultSites';
import { PortalIcon } from './PortalIcon';
import { PureLogo } from './PureLogo';

interface RightBubbleSidebarProps {
  sites: PortalSite[];
  isDark: boolean;
  watermarkOpacity: number;
  isOpen: boolean;
  isPinned: boolean;
  persianTime: string;
  persianDateShort: string;
  onOpenChange: (open: boolean) => void;
  onPinChange: (pinned: boolean) => void;
  onToggleTheme: () => void;
  onAddSite: () => void;
  onEditSite: (site: PortalSite) => void;
  onDeleteSite?: (id: string) => void;
}

export const RightBubbleSidebar: React.FC<RightBubbleSidebarProps> = ({
  sites,
  isDark,
  watermarkOpacity,
  isOpen,
  isPinned,
  persianTime,
  persianDateShort,
  onOpenChange,
  onPinChange,
  onToggleTheme,
  onAddSite,
  onEditSite,
  onDeleteSite,
}) => {
  const [sidebarMode, setSidebarMode] = useState<'orbital' | 'cards'>('orbital');
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const lastHoverOpenTimeRef = useRef<number>(0);
  const ignoreHoverUntilRef = useRef<number>(0);

  const handleMouseEnterArea = () => {
    if (Date.now() < ignoreHoverUntilRef.current) return;
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (!isOpen) {
      lastHoverOpenTimeRef.current = Date.now();
      onOpenChange(true);
    }
  };

  const handleMouseLeaveArea = () => {
    if (isPinned) return;
    closeTimeoutRef.current = window.setTimeout(() => {
      setShowSettingsMenu(false);
      onOpenChange(false);
    }, 360);
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) window.clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const handleToggleSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    const justOpenedByHover =
      isOpen && !isPinned && Date.now() - lastHoverOpenTimeRef.current < 650;

    if (justOpenedByHover) {
      onPinChange(true);
      onOpenChange(true);
    } else if (isOpen) {
      onPinChange(false);
      ignoreHoverUntilRef.current = Date.now() + 650;
      onOpenChange(false);
    } else {
      ignoreHoverUntilRef.current = 0;
      onOpenChange(true);
      onPinChange(true);
    }
  };

  // Spacious coordinates inside the 536px wide right-side sliding drawer
  const radiusX = 176;
  const radiusY = 186;

  return (
    <aside
      onMouseEnter={handleMouseEnterArea}
      onMouseLeave={handleMouseLeaveArea}
      aria-label={EXTENSION_TITLE}
      className={`fixed top-2 bottom-2 right-0 z-50 w-[536px] max-w-[calc(100vw-58px)] rounded-l-3xl border-l border-t border-b transition-transform duration-300 ease-out flex flex-col ${
        isDark
          ? 'bg-slate-950/96 border-white/15 text-slate-100'
          : 'bg-white/96 border-slate-300 text-slate-900'
      } ${
        isOpen
          ? isDark
            ? 'translate-x-0 shadow-[-24px_0_60px_rgba(0,0,0,0.85)]'
            : 'translate-x-0 shadow-[-20px_0_50px_rgba(15,23,42,0.25)]'
          : 'translate-x-full shadow-none'
      } backdrop-blur-2xl`}
    >
      {/* Attached Right-Edge Pure Borderless 3D Logo Handle (بدون حاشیه دور لوگو، همیشه در سمت راست صفحه) */}
      <button
        type="button"
        onMouseEnter={handleMouseEnterArea}
        onClick={handleToggleSlide}
        title={isOpen ? 'بستن کشویی سایدبار سمت راست' : 'باز کردن کشویی سایدبار سمت راست'}
        className="group absolute -left-16 top-1/2 -translate-y-1/2 w-16 h-20 flex flex-col items-center justify-center gap-1 cursor-pointer transition-transform duration-300 hover:scale-110 z-50 bg-transparent border-0"
      >
        <div className="relative w-13 h-13 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-500/25 via-rose-500/20 to-transparent blur-md group-hover:scale-125 transition-transform" />
          <PureLogo
            alt="لوگوی مرکز مثبت زندگی"
            className="relative w-12 h-12 object-contain drop-shadow-[0_8px_16px_rgba(239,68,68,0.52)]"
          />
        </div>
        <span
          className={`font-homa text-[9.5px] font-bold px-2 py-0.5 rounded-full border shadow-md flex items-center gap-0.5 whitespace-nowrap ${
            isDark
              ? 'bg-slate-950/90 text-emerald-400 border-emerald-500/40'
              : 'bg-white/95 text-emerald-700 border-emerald-500/40'
          }`}
        >
          {isOpen ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          <span>{isOpen ? 'بستن' : 'سامانه‌ها'}</span>
        </span>
      </button>

      {/* Subtle Background Pure Logo Watermark inside the Slide-Out Sidebar */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0 rounded-l-3xl"
        style={{ opacity: watermarkOpacity }}
      >
        <PureLogo alt="" className="w-[330px] h-[330px] object-contain" />
      </div>

      {/* Sidebar Header in Homa Font:
          - Right Side: Persian Clock & Date stacked vertically (در سمت راست هدر زیر هم)
          - Center: Title in Homa font (فونت هما)
          - Left Side: Gear Icon Settings Button (آیکون چرخ دنده در هدر سمت چپ)
      */}
      <div
        className={`font-homa relative z-20 px-4 py-2.5 border-b flex items-center justify-between gap-2 rounded-tl-3xl ${
          isDark ? 'border-white/10 bg-slate-900/85' : 'border-slate-200 bg-slate-100/90'
        }`}
      >
        {/* Right Side of Header: Persian Time & Date stacked vertically */}
        <div
          className={`flex flex-col items-start text-right shrink-0 leading-tight px-2.5 py-1 rounded-xl border ${
            isDark ? 'bg-slate-800/70 border-white/10' : 'bg-white border-slate-300/80'
          }`}
        >
          <span className="text-xs font-extrabold text-emerald-400 tabular-nums">
            {persianTime}
          </span>
          <span className={`text-[10.5px] font-bold mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {persianDateShort}
          </span>
        </div>

        {/* Center of Header: Extension Title in Homa Font */}
        <h2 className="font-homa text-sm sm:text-[15px] font-bold text-center whitespace-nowrap px-1">
          {EXTENSION_TITLE}
        </h2>

        {/* Left Side of Header: Pin Toggle + Gear Settings Icon */}
        <div className="flex items-center gap-1.5 shrink-0 relative">
          <button
            type="button"
            onClick={() => onPinChange(!isPinned)}
            title={isPinned ? 'حالت خودکار (بسته شدن با کنار رفتن موس)' : 'ثابت نگه داشتن سایدبار'}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isPinned
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : isDark
                ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 border-white/10'
                : 'bg-white hover:bg-slate-200 text-slate-600 border-slate-300'
            }`}
          >
            {isPinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
          </button>

          {/* Gear Icon Settings Button on the Left of Header */}
          <button
            type="button"
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            title="تنظیمات افزونه (تم، افزودن کارت، تنظیم نمایش)"
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              showSettingsMenu
                ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                : isDark
                ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-white/15'
                : 'bg-white hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Settings Dropdown Popover */}
          {showSettingsMenu && (
            <div
              className={`font-sans absolute left-0 top-11 w-64 rounded-2xl border p-3.5 shadow-2xl z-50 space-y-2.5 ${
                isDark
                  ? 'bg-slate-900 border-white/20 text-slate-100'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            >
              <div className="font-homa text-xs font-bold border-b border-white/10 pb-2">
                تنظیمات افزونه
              </div>

              {/* 1. Theme Setting */}
              <button
                type="button"
                onClick={onToggleTheme}
                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'
                }`}
              >
                <span>تنظیمات تم ({isDark ? 'تیره' : 'روشن'})</span>
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
              </button>

              {/* 2. Add New Card */}
              <button
                type="button"
                onClick={() => {
                  setShowSettingsMenu(false);
                  onAddSite();
                }}
                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-emerald-300' : 'bg-slate-100 hover:bg-slate-200 text-emerald-700'
                }`}
              >
                <span>اضافه کردن کارت جدید</span>
                <Plus className="w-4 h-4" />
              </button>

              {/* 3. Display Mode Setting */}
              <button
                type="button"
                onClick={() => {
                  setSidebarMode(sidebarMode === 'orbital' ? 'cards' : 'orbital');
                }}
                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'
                }`}
              >
                <span>تنظیم نمایش افزونه</span>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  {sidebarMode === 'orbital' ? <List className="w-3.5 h-3.5" /> : <Orbit className="w-3.5 h-3.5" />}
                  {sidebarMode === 'orbital' ? 'نمای کارت‌ها' : 'نمای مداری'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Sidebar Body: Orbital 3D View OR Cards List */}
      <div className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden px-1 py-1 flex flex-col">
        {sidebarMode === 'orbital' ? (
          <div className="relative flex-1 min-h-[465px] w-full my-auto">
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 536 465">
              <ellipse
                cx="268"
                cy="232"
                rx={radiusX}
                ry={radiusY}
                fill="none"
                stroke={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.12)'}
                strokeWidth="1.5"
                strokeDasharray="5 5"
              />
              {sites.slice(0, 12).map((site, idx, arr) => {
                const { x, y } = getOrbitalPosition(idx, arr.length, radiusX, radiusY);
                const x2 = 268 + x;
                const y2 = 232 + y;
                const isHovered = hoveredId === site.id;
                return (
                  <line
                    key={site.id}
                    x1="268"
                    y1="232"
                    x2={x2}
                    y2={y2}
                    stroke={
                      isHovered
                        ? '#10b981'
                        : isDark
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(15,23,42,0.1)'
                    }
                    strokeWidth={isHovered ? '2.5' : '1.2'}
                    strokeDasharray={isHovered ? 'none' : '4 4'}
                  />
                );
              })}
            </svg>

            {/* Pure Borderless Central Logo at Exact Center */}
            <div
              style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
              className="absolute z-10 w-24 h-24 flex items-center justify-center"
            >
              <PureLogo
                alt="لوگوی مرکزی"
                className="w-full h-full object-contain drop-shadow-[0_14px_24px_rgba(239,68,68,0.48)] animate-float-bubble"
              />
            </div>

            {/* Surrounding 3D Portal Buttons - Complete Non-Truncated Titles & Subtitles */}
            {sites.slice(0, 12).map((site, idx, arr) => {
              const { x, y } = getOrbitalPosition(idx, arr.length, radiusX, radiusY);
              const isHovered = hoveredId === site.id;

              return (
                <a
                  key={site.id}
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseEnter={() => setHoveredId(site.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                    transform: isHovered
                      ? 'translate(-50%, calc(-50% - 6px)) scale(1.08) perspective(450px) rotateX(7deg)'
                      : 'translate(-50%, -50%) scale(1)',
                  }}
                  className={`absolute z-20 w-[162px] px-2.5 py-2 rounded-2xl border text-center transition-all duration-200 cursor-pointer ${
                    isDark ? 'card-3d-dark border-white/20' : 'card-3d-light border-slate-300/90'
                  } ${isHovered ? 'border-emerald-400 z-30' : ''}`}
                >
                  <span className="absolute -top-2 -left-2 w-5 h-5 rounded-md bg-emerald-500 text-slate-950 font-mono tabular-nums text-[10px] font-extrabold flex items-center justify-center shadow">
                    {idx + 1}
                  </span>
                  <div className="text-[12px] font-extrabold leading-snug whitespace-nowrap">
                    {site.name}
                  </div>
                  <div
                    className={`text-[9.5px] leading-tight whitespace-nowrap mt-0.5 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    {site.subtitle}
                  </div>
                </a>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2.5 px-3 py-2">
            {sites.map((site, idx) => (
              <div
                key={site.id}
                className={`group relative rounded-2xl border p-3 flex items-center justify-between gap-3 transition-all duration-200 hover:-translate-y-1 ${
                  isDark
                    ? 'card-3d-dark border-white/15 hover:border-emerald-400/60'
                    : 'card-3d-light border-slate-200 hover:border-emerald-500/60'
                }`}
              >
                <a
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-rose-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <PortalIcon name={site.iconName} className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <span>{site.name}</span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400" />
                    </div>
                    <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {site.subtitle}
                    </div>
                  </div>
                </a>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onEditSite(site)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                      isDark
                        ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                        : 'bg-slate-200/70 hover:bg-slate-300 text-slate-700'
                    }`}
                  >
                    ویرایش
                  </button>
                  {onDeleteSite && (
                    <button
                      type="button"
                      onClick={() => onDeleteSite(site.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                      title="حذف کارت"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-400 font-mono tabular-nums text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar Bottom Credit Bar in Homa Font */}
      <div
        className={`font-homa relative z-10 px-4 py-2.5 border-t text-center text-xs font-bold rounded-bl-3xl ${
          isDark
            ? 'border-white/10 bg-slate-950/90 text-slate-200'
            : 'border-slate-200 bg-slate-100/95 text-slate-800'
        }`}
      >
        {FOOTER_CREDIT}
      </div>
    </aside>
  );
};
