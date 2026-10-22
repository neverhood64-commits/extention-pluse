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
  GripVertical,
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

  // Draggable vertical position (percentage of sidebar height, 10% to 90%)
  const [handleTopPercent, setHandleTopPercent] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('mz7828_handle_top_pct');
      const parsed = saved ? parseFloat(saved) : 50;
      return !isNaN(parsed) ? Math.min(90, Math.max(10, parsed)) : 50;
    } catch {
      return 50;
    }
  });
  const [isDraggingHandle, setIsDraggingHandle] = useState<boolean>(false);

  const sidebarRef = useRef<HTMLElement | null>(null);
  const dragStateRef = useRef<{
    active: boolean;
    startY: number;
    moved: boolean;
  }>({
    active: false,
    startY: 0,
    moved: false,
  });

  // Pointer / Mouse Drag handlers for moving the sliding handle up and down
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!dragStateRef.current.active) return;
      const dy = Math.abs(e.clientY - dragStateRef.current.startY);
      if (dy > 4) {
        dragStateRef.current.moved = true;
      }
      if (!dragStateRef.current.moved) return;

      const sidebarEl = sidebarRef.current;
      if (sidebarEl) {
        const rect = sidebarEl.getBoundingClientRect();
        const relY = e.clientY - rect.top;
        const pct = Math.min(90, Math.max(10, (relY / Math.max(1, rect.height)) * 100));
        setHandleTopPercent(pct);
      } else {
        const pct = Math.min(90, Math.max(10, (e.clientY / Math.max(1, window.innerHeight)) * 100));
        setHandleTopPercent(pct);
      }
    };

    const handlePointerUp = () => {
      if (!dragStateRef.current.active) return;
      dragStateRef.current.active = false;
      setIsDraggingHandle(false);
      try {
        localStorage.setItem('mz7828_handle_top_pct', String(handleTopPercent));
      } catch {
        // ignore storage error
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [handleTopPercent]);

  const handlePointerDownHandle = (e: React.PointerEvent<HTMLButtonElement>) => {
    dragStateRef.current = {
      active: true,
      startY: e.clientY,
      moved: false,
    };
    setIsDraggingHandle(true);
  };

  const handleToggleSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    // If the user dragged the handle up/down, do not toggle open/close on release
    if (dragStateRef.current.moved) {
      dragStateRef.current.moved = false;
      return;
    }

    const nextOpen = !isOpen;
    if (!nextOpen) {
      setShowSettingsMenu(false);
    }
    onOpenChange(nextOpen);
    onPinChange(nextOpen);
  };

  // Balanced orbital radii inside the 490px wide right-side sliding drawer so all 9 buttons fit in one view
  const radiusX = 152;
  const radiusY = 172;

  return (
    <aside
      ref={sidebarRef}
      aria-label={EXTENSION_TITLE}
      className={`fixed top-2 bottom-2 right-0 z-50 w-[490px] max-w-[calc(100vw-64px)] rounded-l-3xl border-l border-t border-b transition-transform duration-300 ease-out flex flex-col ${
        isDark
          ? 'bg-slate-950/96 border-white/15 text-slate-100'
          : 'bg-white/96 border-slate-300 text-slate-900'
      } ${
        isOpen
          ? isDark
            ? 'translate-x-0 shadow-[-24px_0_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl'
            : 'translate-x-0 shadow-[-20px_0_50px_rgba(15,23,42,0.25)] backdrop-blur-2xl'
          : 'translate-x-full shadow-none'
      }`}
    >
      {/* Draggable Right-Edge Pure Borderless 3D Logo Handle (فقط با کلیک باز و بسته می‌شود + قابل جابه‌جایی به بالا و پایین) */}
      <button
        type="button"
        onPointerDown={handlePointerDownHandle}
        onClick={handleToggleSlide}
        style={{
          top: `${handleTopPercent}%`,
          transform: 'translateY(-50%)',
        }}
        title="نگه دارید و به بالا/پایین بکشید | فقط با کلیک باز و بسته می‌شود"
        className={`group absolute -left-16 w-16 h-22 rounded-r-none rounded-l-2xl border border-r-0 flex flex-col items-center justify-center gap-1 select-none touch-none z-50 shadow-2xl ${
          isDraggingHandle
            ? 'cursor-grabbing scale-110 ring-2 ring-emerald-400'
            : 'cursor-grab transition-transform duration-200 hover:scale-105'
        } ${
          isDark
            ? 'bg-slate-950/92 border-white/20 text-slate-100 hover:bg-slate-900'
            : 'bg-white/95 border-slate-300 text-slate-900 hover:bg-slate-100'
        }`}
      >
        <div className="w-11 h-11 flex items-center justify-center pointer-events-none">
          <PureLogo
            alt="لوگوی مرکز مثبت زندگی"
            className="w-full h-full object-contain drop-shadow-[0_6px_14px_rgba(239,68,68,0.48)]"
          />
        </div>
        <span className="font-homa text-[9px] font-bold text-emerald-400 flex items-center gap-0.5 pointer-events-none">
          <GripVertical className="w-2.5 h-2.5 opacity-75" />
          {isOpen ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          <span>{isOpen ? 'بستن' : 'سامانه‌ها'}</span>
        </span>
      </button>

      {/* Subtle Background Pure Logo Watermark inside the Slide-Out Sidebar */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0 rounded-l-3xl"
        style={{ opacity: watermarkOpacity }}
      >
        <PureLogo alt="" className="w-[310px] h-[310px] object-contain" />
      </div>

      {/* Sidebar Header in Homa Font:
          - Right Side: Persian Clock & Date stacked vertically (در سمت راست هدر زیر هم)
          - Center: Title in Homa font (فونت هما)
          - Left Side: Gear Icon Settings Button (آیکون چرخ دنده در هدر سمت چپ)
      */}
      <div
        className={`font-homa relative z-20 px-3.5 py-2.5 border-b flex items-center justify-between gap-2 rounded-tl-3xl ${
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
          <span className={`text-[10px] font-bold mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {persianDateShort}
          </span>
        </div>

        {/* Center of Header: Extension Title in Homa Font */}
        <h2 className="font-homa text-sm font-bold text-center whitespace-nowrap px-1">
          {EXTENSION_TITLE}
        </h2>

        {/* Left Side of Header: Pin Toggle + Gear Settings Icon */}
        <div className="flex items-center gap-1.5 shrink-0 relative">
          <button
            type="button"
            onClick={() => onPinChange(!isPinned)}
            title={isPinned ? 'حالت خودکار (بسته شدن با کنار رفتن موس)' : 'ثابت نگه داشتن سایدبار'}
            className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
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
            className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
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
          <div className="relative flex-1 min-h-[430px] w-full my-auto">
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 490 430">
              <ellipse
                cx="245"
                cy="215"
                rx={radiusX}
                ry={radiusY}
                fill="none"
                stroke={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.12)'}
                strokeWidth="1.5"
                strokeDasharray="5 5"
              />
              {sites.slice(0, 12).map((site, idx, arr) => {
                const { x, y } = getOrbitalPosition(idx, arr.length, radiusX, radiusY);
                const x2 = 245 + x;
                const y2 = 215 + y;
                const isHovered = hoveredId === site.id;
                return (
                  <line
                    key={site.id}
                    x1="245"
                    y1="215"
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
              className="absolute z-10 w-22 h-22 flex items-center justify-center"
            >
              <PureLogo
                alt="لوگوی مرکزی"
                className="w-full h-full object-contain drop-shadow-[0_14px_24px_rgba(239,68,68,0.48)] animate-float-bubble"
              />
            </div>

            {/* Surrounding 3D Portal Buttons - Sized to fit 100% inside the panel with complete text */}
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
                      ? 'translate(-50%, calc(-50% - 5px)) scale(1.08) perspective(450px) rotateX(7deg)'
                      : 'translate(-50%, -50%) scale(1)',
                  }}
                  className={`absolute z-20 w-[138px] px-2 py-1.5 rounded-2xl border text-center transition-all duration-200 cursor-pointer ${
                    isDark ? 'card-3d-dark border-white/20' : 'card-3d-light border-slate-300/90'
                  } ${isHovered ? 'border-emerald-400 z-30' : ''}`}
                >
                  <span className="absolute -top-2 -left-2 w-4.5 h-4.5 rounded-md bg-emerald-500 text-slate-950 font-mono tabular-nums text-[9.5px] font-extrabold flex items-center justify-center shadow">
                    {idx + 1}
                  </span>
                  <div className="text-[11px] font-extrabold leading-snug whitespace-nowrap">
                    {site.name}
                  </div>
                  <div
                    className={`text-[9px] leading-tight whitespace-nowrap mt-0.5 ${
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
        className={`font-homa relative z-10 px-4 py-2 border-t text-center text-xs font-bold rounded-bl-3xl ${
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
