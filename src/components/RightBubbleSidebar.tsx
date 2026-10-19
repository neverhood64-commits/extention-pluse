import React, { useState, useRef, useEffect } from 'react';
import { Pin, PinOff, ExternalLink, Search, Plus, Orbit, List, X } from 'lucide-react';
import { PortalSite, EXTENSION_TITLE, FOOTER_CREDIT } from '../data/defaultSites';
import { PortalIcon } from './PortalIcon';
import { PureLogo } from './PureLogo';

interface RightBubbleSidebarProps {
  sites: PortalSite[];
  isDark: boolean;
  watermarkOpacity: number;
  isOpen: boolean;
  isPinned: boolean;
  onOpenChange: (open: boolean) => void;
  onPinChange: (pinned: boolean) => void;
  onAddSite: () => void;
  onEditSite: (site: PortalSite) => void;
}

export const RightBubbleSidebar: React.FC<RightBubbleSidebarProps> = ({
  sites,
  isDark,
  watermarkOpacity,
  isOpen,
  isPinned,
  onOpenChange,
  onPinChange,
  onAddSite,
  onEditSite,
}) => {
  const [sidebarMode, setSidebarMode] = useState<'orbital' | 'cards'>('orbital');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);

  const filteredSites = sites.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMouseEnterBubble = () => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    onOpenChange(true);
  };

  const handleMouseEnterDrawer = () => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handleMouseLeaveArea = () => {
    if (isPinned) return;
    closeTimeoutRef.current = window.setTimeout(() => {
      onOpenChange(false);
    }, 320);
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) window.clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const handleBubbleClick = () => {
    if (!isOpen) {
      onOpenChange(true);
      onPinChange(true);
    } else {
      const nextPin = !isPinned;
      onPinChange(nextPin);
      if (!nextPin) {
        onOpenChange(false);
      }
    }
  };

  return (
    <>
      {/* Right-Edge Pure Borderless Logo Trigger (فقط اصل لوگو بدون حاشیه) */}
      <div
        onMouseEnter={handleMouseEnterBubble}
        onMouseLeave={handleMouseLeaveArea}
        onClick={handleBubbleClick}
        title="رفتن موس یا کلیک جهت باز شدن سایدبار کشویی سامانه‌ها"
        className={`fixed right-3 top-1/2 -translate-y-1/2 z-50 flex items-center cursor-pointer group transition-all duration-300 ${
          isOpen ? 'translate-x-full opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'
        }`}
      >
        <div className="w-16 h-16 flex items-center justify-center transition-transform duration-300 group-hover:-translate-x-2 group-hover:scale-115 animate-float-bubble">
          <PureLogo
            alt="لوگوی مرکز مثبت زندگی"
            className="w-full h-full object-contain drop-shadow-[0_12px_24px_rgba(239,68,68,0.45)]"
          />
        </div>
      </div>

      {/* Slide-Out Right Sidebar Drawer */}
      <aside
        onMouseEnter={handleMouseEnterDrawer}
        onMouseLeave={handleMouseLeaveArea}
        aria-label={EXTENSION_TITLE}
        className={`fixed top-3 bottom-3 right-3 z-50 w-[430px] max-w-[94vw] rounded-3xl border transition-all duration-300 ease-out flex flex-col overflow-hidden ${
          isDark
            ? 'bg-slate-950/92 border-white/15 text-slate-100 shadow-[-24px_0_60px_rgba(0,0,0,0.75)]'
            : 'bg-white/95 border-slate-300/80 text-slate-900 shadow-[-20px_0_50px_rgba(15,23,42,0.22)]'
        } backdrop-blur-2xl ${
          isOpen ? 'translate-x-0 opacity-100' : 'translate-x-[108%] opacity-0 pointer-events-none'
        }`}
      >
        {/* Subtle Background Pure Logo Watermark inside the Slide-Out Sidebar */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0"
          style={{ opacity: watermarkOpacity }}
        >
          <PureLogo
            alt=""
            className="w-[320px] h-[320px] object-contain"
          />
        </div>

        {/* Sidebar Top Bar */}
        <div
          className={`relative z-10 px-4 pt-3.5 pb-3 border-b flex items-center justify-between gap-2 ${
            isDark ? 'border-white/10 bg-slate-900/50' : 'border-slate-200/80 bg-slate-50/70'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 shrink-0 flex items-center justify-center">
              <PureLogo
                alt="لوگو"
                className="w-full h-full object-contain drop-shadow-sm"
              />
            </div>
            <h2 className="text-xs font-extrabold truncate">{EXTENSION_TITLE}</h2>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setSidebarMode(sidebarMode === 'orbital' ? 'cards' : 'orbital')}
              title={sidebarMode === 'orbital' ? 'نمایش به صورت لیست سه‌بعدی' : 'نمایش به صورت دایره‌ای'}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-white/10'
                  : 'bg-slate-200/80 hover:bg-slate-300/80 text-emerald-800'
              }`}
            >
              {sidebarMode === 'orbital' ? <List className="w-3.5 h-3.5" /> : <Orbit className="w-3.5 h-3.5" />}
              <span>{sidebarMode === 'orbital' ? 'نمای لیستی' : 'نمای دایره‌ای'}</span>
            </button>

            <button
              type="button"
              onClick={() => onPinChange(!isPinned)}
              title={isPinned ? 'آزاد کردن سایدبار (بسته شدن خودکار)' : 'ثابت نگه داشتن سایدبار'}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isPinned
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : isDark
                  ? 'hover:bg-slate-800 text-slate-400'
                  : 'hover:bg-slate-200 text-slate-600'
              }`}
            >
              {isPinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => {
                onPinChange(false);
                onOpenChange(false);
              }}
              title="بستن سایدبار کشویی"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Search & Add inside Sidebar */}
        <div className="relative z-10 px-4 pt-2.5 pb-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی سریع سامانه در سایدبار..."
              className={`w-full pr-8 pl-3 py-1.5 rounded-xl text-xs border outline-none transition-colors ${
                isDark
                  ? 'bg-slate-900/80 border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/60'
                  : 'bg-slate-100/90 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-600'
              }`}
            />
          </div>
          <button
            type="button"
            onClick={onAddSite}
            title="افزودن سامانه جدید"
            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>سایت جدید</span>
          </button>
        </div>

        {/* Main Sidebar Content Area */}
        <div className="relative z-10 flex-1 overflow-y-auto px-3 py-2 flex flex-col">
          {sidebarMode === 'orbital' && searchQuery.trim() === '' ? (
            <div className="relative flex-1 min-h-[410px] flex items-center justify-center my-auto">
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 420">
                <circle
                  cx="200"
                  cy="210"
                  r="142"
                  fill="none"
                  stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'}
                  strokeWidth="1.5"
                  strokeDasharray="5 5"
                />
                {filteredSites.slice(0, 12).map((site, idx, arr) => {
                  const angle = (idx / arr.length) * 2 * Math.PI - Math.PI / 2;
                  const x2 = 200 + Math.cos(angle) * 142;
                  const y2 = 210 + Math.sin(angle) * 142;
                  const isHovered = hoveredId === site.id;
                  return (
                    <line
                      key={site.id}
                      x1="200"
                      y1="210"
                      x2={x2}
                      y2={y2}
                      stroke={
                        isHovered
                          ? '#10b981'
                          : isDark
                          ? 'rgba(255,255,255,0.07)'
                          : 'rgba(15,23,42,0.08)'
                      }
                      strokeWidth={isHovered ? '2.5' : '1'}
                    />
                  );
                })}
              </svg>

              {/* Pure Borderless Central Logo in Middle of Sidebar */}
              <div className="relative z-10 w-24 h-24 animate-float-bubble flex items-center justify-center">
                <PureLogo
                  alt="لوگوی مرکزی"
                  className="w-full h-full object-contain drop-shadow-[0_12px_22px_rgba(239,68,68,0.4)]"
                />
              </div>

              {/* Surrounding 3D Portal Buttons */}
              {filteredSites.slice(0, 12).map((site, idx, arr) => {
                const angle = (idx / arr.length) * 2 * Math.PI - Math.PI / 2;
                const radiusX = 142;
                const radiusY = 152;
                const x = Math.cos(angle) * radiusX;
                const y = Math.sin(angle) * radiusY;
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
                      transform: isHovered
                        ? `translate(${x}px, ${y - 6}px) scale(1.12) perspective(400px) rotateX(8deg)`
                        : `translate(${x}px, ${y}px) scale(1)`,
                    }}
                    className={`absolute z-20 w-[108px] px-2.5 py-2 rounded-2xl border text-center transition-all duration-200 cursor-pointer ${
                      isDark ? 'card-3d-dark border-white/15' : 'card-3d-light border-slate-300/90'
                    } ${isHovered ? 'border-emerald-400 z-30' : ''}`}
                  >
                    <div className="flex items-center justify-center gap-1.5 mb-0.5">
                      <span className="text-emerald-400 shrink-0">
                        <PortalIcon name={site.iconName} className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-[11px] font-bold truncate">{site.name}</span>
                    </div>
                    <div
                      className={`text-[9px] truncate ${
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
            <div className="space-y-2.5 py-1">
              {/* Pure Borderless Logo in List Mode */}
              <div className="flex flex-col items-center justify-center py-2">
                <div className="relative w-16 h-16 flex items-center justify-center mb-1">
                  <PureLogo
                    alt="لوگوی مرکزی"
                    className="w-full h-full object-contain drop-shadow-[0_10px_18px_rgba(239,68,68,0.35)]"
                  />
                </div>
              </div>

              {filteredSites.map((site, idx) => (
                <div
                  key={site.id}
                  className={`group relative rounded-2xl border p-3 flex items-center justify-between gap-3 transition-all duration-200 hover:-translate-y-1 hover:scale-[1.015] ${
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
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-rose-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-110 transition-transform">
                      <PortalIcon name={site.iconName} className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate flex items-center gap-1.5">
                        <span>{site.name}</span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400" />
                      </div>
                      <div
                        className={`text-[11px] truncate ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
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
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-400 font-mono tabular-nums text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Bottom Credit Bar */}
        <div
          className={`relative z-10 px-4 py-2.5 border-t text-center text-[11px] font-semibold ${
            isDark
              ? 'border-white/10 bg-slate-950/85 text-slate-300'
              : 'border-slate-200 bg-slate-100/90 text-slate-700'
          }`}
        >
          {FOOTER_CREDIT}
        </div>
      </aside>
    </>
  );
};
