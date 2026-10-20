import React, { useState, useRef, useEffect } from 'react';
import { ExternalLink, Edit2, Trash2, Plus } from 'lucide-react';
import { PortalSite, getOrbitalPosition } from '../data/defaultSites';
import { PortalIcon } from './PortalIcon';
import { PureLogo } from './PureLogo';

interface OrbitalHubStageProps {
  sites: PortalSite[];
  isDark: boolean;
  viewMode: 'orbital' | 'grid';
  onEditSite: (site: PortalSite) => void;
  onDeleteSite: (id: string) => void;
  onAddSite: () => void;
  onOpenRightSidebar: () => void;
}

export const OrbitalHubStage: React.FC<OrbitalHubStageProps> = ({
  sites,
  isDark,
  viewMode,
  onEditSite,
  onDeleteSite,
  onAddSite,
  onOpenRightSidebar,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tiltState, setTiltState] = useState<{ id: string | null; rx: number; ry: number }>({
    id: null,
    rx: 0,
    ry: 0,
  });

  const stageRef = useRef<HTMLDivElement | null>(null);
  const [stageSize, setStageSize] = useState<{ width: number; height: number }>({
    width: 900,
    height: 560,
  });

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setStageSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    window.addEventListener('resize', updateSize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [viewMode]);

  const handleMouseMoveCard = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rx = ((y - centerY) / centerY) * -10;
    const ry = ((x - centerX) / centerX) * 10;
    setTiltState({ id, rx, ry });
  };

  const handleMouseLeaveCard = () => {
    setTiltState({ id: null, rx: 0, ry: 0 });
    setHoveredId(null);
  };

  if (viewMode === 'grid') {
    return (
      <div className="w-full max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sites.map((site, idx) => {
            const isTilted = tiltState.id === site.id;
            return (
              <div
                key={site.id}
                onMouseMove={(e) => handleMouseMoveCard(e, site.id)}
                onMouseEnter={() => setHoveredId(site.id)}
                onMouseLeave={handleMouseLeaveCard}
                style={{
                  transform: isTilted
                    ? `perspective(800px) rotateX(${tiltState.rx}deg) rotateY(${tiltState.ry}deg) translateY(-6px) scale(1.02)`
                    : 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px) scale(1)',
                }}
                className={`group relative rounded-2xl border p-5 transition-all duration-200 ${
                  isDark
                    ? 'card-3d-dark border-white/15 hover:border-emerald-400/70'
                    : 'card-3d-light border-slate-300/90 hover:border-emerald-500/70'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/15 to-rose-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <PortalIcon name={site.iconName} className="w-6 h-6" />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEditSite(site)}
                      title="ویرایش سامانه"
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isDark
                          ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                          : 'hover:bg-slate-200 text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSite(site.id)}
                      title="حذف سامانه"
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isDark
                          ? 'hover:bg-rose-950/60 text-slate-400 hover:text-rose-400'
                          : 'hover:bg-rose-100 text-slate-500 hover:text-rose-600'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 font-mono tabular-nums text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                  </div>
                </div>

                <a
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group-hover:text-emerald-400 transition-colors"
                >
                  <div className="text-base font-extrabold flex items-center justify-between gap-2 mb-1">
                    <span>{site.name}</span>
                    <ExternalLink className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className={`text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {site.subtitle}
                  </p>
                  <div
                    className={`text-[11px] flex items-center gap-1.5 ${
                      isDark ? 'text-slate-500' : 'text-slate-500'
                    }`}
                  >
                    <span>{site.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono truncate dir-ltr">{new URL(site.url).hostname}</span>
                  </div>
                </a>
              </div>
            );
          })}

          {/* Add New Site Card */}
          <button
            type="button"
            onClick={onAddSite}
            className={`rounded-2xl border-2 border-dashed p-5 flex flex-col items-center justify-center gap-2 min-h-[160px] transition-all cursor-pointer ${
              isDark
                ? 'border-white/15 hover:border-emerald-500/50 bg-slate-900/30 hover:bg-slate-900/60 text-slate-300'
                : 'border-slate-300 hover:border-emerald-500 bg-white/50 hover:bg-white/80 text-slate-700'
            }`}
          >
            <div className="w-11 h-11 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold">افزودن سامانه جدید</span>
            <span className="text-xs text-slate-400">نام و آدرس دلخواه خود را اضافه کنید</span>
          </button>
        </div>
      </div>
    );
  }

  // Responsive orbital radii guaranteed to keep all 9 cards non-overlapping and fully legible
  const isCompact = stageSize.width < 680;
  const cardWidth = isCompact ? 176 : 218;
  const radiusX = Math.max(155, Math.min(335, stageSize.width / 2 - cardWidth / 2 - 14));
  const radiusY = Math.max(178, Math.min(225, stageSize.height / 2 - 54));
  const centerX = stageSize.width / 2;
  const centerY = stageSize.height / 2;

  return (
    <div className="relative w-full flex-1 flex items-center justify-center min-h-[570px] py-2 select-none overflow-hidden">
      <div
        ref={stageRef}
        className="relative w-full max-w-[980px] h-[560px] mx-auto"
      >
        {/* SVG Orbital Track & Dynamic Connector Lines */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${stageSize.width} ${stageSize.height}`}
        >
          <defs>
            <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(16, 185, 129, 0.24)" />
              <stop offset="50%" stopColor="rgba(239, 68, 68, 0.1)" />
              <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
            </radialGradient>
          </defs>

          <circle cx={centerX} cy={centerY} r={Math.min(radiusX, radiusY)} fill="url(#centerGlow)" />

          <ellipse
            cx={centerX}
            cy={centerY}
            rx={radiusX}
            ry={radiusY}
            fill="none"
            stroke={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.12)'}
            strokeWidth="1.5"
            strokeDasharray="6 6"
          />

          {/* Connector Rays from Central Logo to Each Portal */}
          {sites.map((site, idx) => {
            const total = Math.max(1, sites.length);
            const { x, y } = getOrbitalPosition(idx, total, radiusX, radiusY);
            const x2 = centerX + x;
            const y2 = centerY + y;
            const isHovered = hoveredId === site.id;

            return (
              <line
                key={site.id}
                x1={centerX}
                y1={centerY}
                x2={x2}
                y2={y2}
                stroke={
                  isHovered
                    ? '#10b981'
                    : isDark
                    ? 'rgba(255,255,255,0.09)'
                    : 'rgba(15,23,42,0.1)'
                }
                strokeWidth={isHovered ? '3' : '1.2'}
                strokeDasharray={isHovered ? 'none' : '4 4'}
              />
            );
          })}
        </svg>

        {/* Pure Borderless Central Logo Positioned at Exact Center (50%, 50%) */}
        <div
          onClick={onOpenRightSidebar}
          title="کلیک برای باز/بسته کردن سایدبار کشویی سمت راست"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          className="absolute z-20 cursor-pointer group flex flex-col items-center justify-center"
        >
          <div
            className={`${
              isCompact ? 'w-28 h-28' : 'w-38 h-38'
            } flex items-center justify-center animate-float-bubble transition-transform duration-300 group-hover:scale-110`}
          >
            <PureLogo
              alt="لوگوی مرکز مثبت زندگی ۷۸۲۸ سیرجان"
              className="w-full h-full object-contain drop-shadow-[0_18px_32px_rgba(239,68,68,0.45)]"
            />
          </div>
        </div>

        {/* Orbiting 3D Portal Buttons Around the Central Logo (No truncated titles!) */}
        {sites.map((site, idx) => {
          const total = Math.max(1, sites.length);
          const { x, y } = getOrbitalPosition(idx, total, radiusX, radiusY);
          const isHovered = hoveredId === site.id;
          const isTilted = tiltState.id === site.id;

          return (
            <div
              key={site.id}
              onMouseMove={(e) => handleMouseMoveCard(e, site.id)}
              onMouseEnter={() => setHoveredId(site.id)}
              onMouseLeave={handleMouseLeaveCard}
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                width: `${cardWidth}px`,
                transform: isTilted
                  ? `translate(-50%, calc(-50% - 7px)) perspective(650px) rotateX(${tiltState.rx}deg) rotateY(${tiltState.ry}deg) scale(1.09)`
                  : 'translate(-50%, -50%) perspective(650px) rotateX(0deg) rotateY(0deg) scale(1)',
              }}
              className={`absolute z-30 rounded-2xl border px-3 py-2.5 transition-all duration-200 ${
                isDark
                  ? 'card-3d-dark border-white/15'
                  : 'card-3d-light border-slate-300/90'
              } ${isHovered ? 'border-emerald-400 z-40' : ''}`}
            >
              {/* Number Badge at Top-Left Corner */}
              <span
                title={`کلید میانبر ${idx + 1}`}
                className="absolute -top-2 -left-2 w-5 h-5 rounded-md bg-emerald-500 text-slate-950 font-mono tabular-nums text-[10px] font-extrabold flex items-center justify-center shadow"
              >
                {idx + 1}
              </span>

              <div className="flex items-center justify-between gap-2">
                <a
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 flex-1 min-w-0"
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isHovered
                        ? 'bg-emerald-500 text-white scale-110 shadow-lg shadow-emerald-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                    }`}
                  >
                    <PortalIcon name={site.iconName} className="w-4 h-4" />
                  </div>

                  <div className="min-w-0 flex-1 text-right">
                    <div className="text-[12.5px] font-extrabold leading-snug whitespace-nowrap">
                      {site.name}
                    </div>
                    <div
                      className={`text-[10px] whitespace-nowrap mt-0.5 ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {site.subtitle}
                    </div>
                  </div>
                </a>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditSite(site);
                  }}
                  title="ویرایش نام و آدرس"
                  className="opacity-50 hover:opacity-100 p-0.5 text-slate-400 hover:text-emerald-400 transition-opacity cursor-pointer shrink-0"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
