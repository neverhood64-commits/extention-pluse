import React, { useState } from 'react';
import { ExternalLink, Edit2, Trash2, Plus } from 'lucide-react';
import { PortalSite } from '../data/defaultSites';
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

  // Default: Pure Borderless Central Logo + Circular Orbiting Portals
  return (
    <div className="relative w-full flex-1 flex items-center justify-center min-h-[590px] py-4 select-none overflow-hidden">
      <div className="relative w-[880px] h-[560px] max-w-full flex items-center justify-center">
        {/* SVG Orbital Track & Dynamic Connector Lines */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 880 560"
        >
          <defs>
            <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(16, 185, 129, 0.22)" />
              <stop offset="50%" stopColor="rgba(239, 68, 68, 0.1)" />
              <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
            </radialGradient>
          </defs>

          <circle cx="440" cy="280" r="220" fill="url(#centerGlow)" />

          <ellipse
            cx="440"
            cy="280"
            rx="315"
            ry="215"
            fill="none"
            stroke={isDark ? 'rgba(255,255,255,0.09)' : 'rgba(15,23,42,0.09)'}
            strokeWidth="1.5"
            strokeDasharray="6 6"
          />

          {/* Connector Rays from Central Logo to Each Portal */}
          {sites.map((site, idx) => {
            const total = sites.length;
            const angle = (idx / total) * (2 * Math.PI) - Math.PI / 2;
            const rx = 315;
            const ry = 215;
            const x2 = 440 + Math.cos(angle) * rx;
            const y2 = 280 + Math.sin(angle) * ry;
            const isHovered = hoveredId === site.id;

            return (
              <g key={site.id}>
                <line
                  x1="440"
                  y1="280"
                  x2={x2}
                  y2={y2}
                  stroke={
                    isHovered
                      ? '#10b981'
                      : isDark
                      ? 'rgba(255,255,255,0.07)'
                      : 'rgba(15,23,42,0.08)'
                  }
                  strokeWidth={isHovered ? '3' : '1.2'}
                  strokeDasharray={isHovered ? 'none' : '4 4'}
                />
              </g>
            );
          })}
        </svg>

        {/* Pure Borderless Central Logo (بدون هیچ‌گونه حاشیه یا کادر اضافه) */}
        <div
          onClick={onOpenRightSidebar}
          title="کلیک برای باز کردن سایدبار کشویی سمت راست"
          className="relative z-20 cursor-pointer group flex flex-col items-center justify-center"
        >
          <div className="w-40 h-40 flex items-center justify-center animate-float-bubble transition-transform duration-300 group-hover:scale-110">
            <PureLogo
              alt="لوگوی مرکز مثبت زندگی ۷۸۲۸ سیرجان"
              className="w-full h-full object-contain drop-shadow-[0_18px_32px_rgba(239,68,68,0.42)]"
            />
          </div>
        </div>

        {/* Orbiting 3D Portal Buttons Around the Central Logo */}
        {sites.map((site, idx) => {
          const total = sites.length;
          const angle = (idx / total) * (2 * Math.PI) - Math.PI / 2;
          const radiusX = 315;
          const radiusY = 215;
          const x = Math.cos(angle) * radiusX;
          const y = Math.sin(angle) * radiusY;
          const isHovered = hoveredId === site.id;
          const isTilted = tiltState.id === site.id;

          return (
            <div
              key={site.id}
              onMouseMove={(e) => handleMouseMoveCard(e, site.id)}
              onMouseEnter={() => setHoveredId(site.id)}
              onMouseLeave={handleMouseLeaveCard}
              style={{
                transform: isTilted
                  ? `translate(${x}px, ${y - 8}px) perspective(650px) rotateX(${tiltState.rx}deg) rotateY(${tiltState.ry}deg) scale(1.1)`
                  : `translate(${x}px, ${y}px) perspective(650px) rotateX(0deg) rotateY(0deg) scale(1)`,
              }}
              className={`absolute z-30 w-[195px] rounded-2xl border px-3.5 py-3 transition-all duration-200 ${
                isDark
                  ? 'card-3d-dark border-white/15'
                  : 'card-3d-light border-slate-300/90'
              } ${isHovered ? 'border-emerald-400 z-40' : ''}`}
            >
              <div className="flex items-center justify-between gap-2">
                <a
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 flex-1 min-w-0"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isHovered
                        ? 'bg-emerald-500 text-white scale-110 shadow-lg shadow-emerald-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                    }`}
                  >
                    <PortalIcon name={site.iconName} className="w-4 h-4" />
                  </div>

                  <div className="min-w-0 flex-1 text-right">
                    <div className="text-xs font-extrabold truncate flex items-center gap-1">
                      <span className="truncate">{site.name}</span>
                    </div>
                    <div
                      className={`text-[10px] truncate ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {site.subtitle}
                    </div>
                  </div>
                </a>

                <div className="flex flex-col items-center gap-1 shrink-0">
                  <span
                    title={`کلید میانبر ${idx + 1}`}
                    className="w-5 h-5 rounded-md bg-slate-500/15 text-emerald-400 font-mono tabular-nums text-[10px] font-bold flex items-center justify-center"
                  >
                    {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditSite(site);
                    }}
                    title="ویرایش نام و آدرس"
                    className="opacity-0 hover:opacity-100 focus:opacity-100 p-0.5 text-slate-400 hover:text-emerald-400 transition-opacity cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
