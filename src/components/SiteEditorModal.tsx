import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw } from 'lucide-react';
import { PortalSite } from '../data/defaultSites';

interface SiteEditorModalProps {
  isOpen: boolean;
  isDark: boolean;
  editingSite: PortalSite | null;
  onClose: () => void;
  onSave: (siteData: Omit<PortalSite, 'id' | 'shortcutKey'> & { id?: string }) => void;
  onResetDefaults: () => void;
}

const CATEGORIES: PortalSite['category'][] = [
  'پورتال‌های اصلی',
  'خدمات الکترونیک',
  'استعلام و پایش',
  'امور مالی و بانکی',
  'پشتیبانی و مشاوره',
];

const ICON_OPTIONS = [
  { value: 'Building2', label: 'ساختمان / سازمان' },
  { value: 'HeartHandshake', label: 'خدمات بهزیستی / لایف‌پلاس' },
  { value: 'Sparkles', label: 'پورتال هوشمند / ارمغان' },
  { value: 'Briefcase', label: 'اشتغال و کارآفرینی' },
  { value: 'FileSearch', label: 'استعلام و دهک‌بندی' },
  { value: 'TicketCheck', label: 'تیکتینگ و پشتیبانی' },
  { value: 'CreditCard', label: 'کارت و خدمات رفاهی' },
  { value: 'Landmark', label: 'امور بانکی و شبا' },
  { value: 'Headset', label: 'صدای مشاور / CRM' },
];

export const SiteEditorModal: React.FC<SiteEditorModalProps> = ({
  isOpen,
  isDark,
  editingSite,
  onClose,
  onSave,
  onResetDefaults,
}) => {
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState<PortalSite['category']>('پورتال‌های اصلی');
  const [iconName, setIconName] = useState('Building2');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingSite) {
      setName(editingSite.name);
      setSubtitle(editingSite.subtitle);
      setUrl(editingSite.url);
      setCategory(editingSite.category);
      setIconName(editingSite.iconName);
    } else {
      setName('');
      setSubtitle('');
      setUrl('https://');
      setCategory('پورتال‌های اصلی');
      setIconName('Building2');
    }
    setError('');
  }, [editingSite, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('لطفاً نام سامانه را وارد کنید.');
      return;
    }
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }
    try {
      new URL(cleanUrl);
    } catch {
      setError('آدرس اینترنتی وارد شده معتبر نیست.');
      return;
    }

    onSave({
      id: editingSite?.id,
      name: name.trim(),
      subtitle: subtitle.trim() || 'دسترسی مستقیم به سامانه',
      url: cleanUrl,
      category,
      iconName,
      accentColor: editingSite?.accentColor || 'emerald',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl ${
          isDark
            ? 'bg-slate-900 border-white/15 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <h3 className="text-base font-extrabold">
            {editingSite ? 'ویرایش مشخصات سامانه' : 'افزودن سامانه جدید به مدار'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800/40 text-slate-400 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-bold mb-1">نام پیشنهادی سامانه</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثلاً: سامانه جامع"
              className={`w-full px-3.5 py-2 rounded-xl text-xs border outline-none ${
                isDark
                  ? 'bg-slate-950 border-white/15 text-slate-100 focus:border-emerald-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">توضیح کوتاه زیر عنوان</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="مثلاً: پورتال سازمان بهزیستی"
              className={`w-full px-3.5 py-2 rounded-xl text-xs border outline-none ${
                isDark
                  ? 'bg-slate-950 border-white/15 text-slate-100 focus:border-emerald-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">آدرس اینترنتی (URL)</label>
            <input
              type="text"
              dir="ltr"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://swo.behzisti.ir/"
              className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono border outline-none text-left ${
                isDark
                  ? 'bg-slate-950 border-white/15 text-slate-100 focus:border-emerald-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">دسته‌بندی</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PortalSite['category'])}
                className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                  isDark
                    ? 'bg-slate-950 border-white/15 text-slate-100'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">آیکون نمایشی</label>
              <select
                value={iconName}
                onChange={(e) => setIconName(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                  isDark
                    ? 'bg-slate-950 border-white/15 text-slate-100'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                {ICON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <div className="pt-3 flex items-center justify-between gap-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                onResetDefaults();
                onClose();
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-amber-400 hover:bg-amber-500/10 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>بازگردانی ۹ سامانه پیش‌فرض</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>ذخیره سامانه</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
