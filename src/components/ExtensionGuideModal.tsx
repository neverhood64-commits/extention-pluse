import React, { useState } from 'react';
import { Download, X, Chrome, CheckCircle2, FolderArchive, ToggleRight, Upload } from 'lucide-react';
import { PortalSite, EXTENSION_TITLE, FOOTER_CREDIT } from '../data/defaultSites';
import { generateChromeExtensionZip } from '../services/extensionBuilder';

interface ExtensionGuideModalProps {
  isOpen: boolean;
  isDark: boolean;
  sites: PortalSite[];
  onClose: () => void;
}

export const ExtensionGuideModal: React.FC<ExtensionGuideModalProps> = ({
  isOpen,
  isDark,
  sites,
  onClose,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen) return null;

  const handleDownloadZip = async () => {
    setIsGenerating(true);
    try {
      const zipBlob = await generateChromeExtensionZip(sites);
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mosbat-zendegi-7828-chrome-extension.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloaded(true);
    } catch (err) {
      console.error('Error building Chrome extension zip:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
      <div
        className={`w-full max-w-xl rounded-3xl border p-6 shadow-2xl ${
          isDark
            ? 'bg-slate-900 border-white/15 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Chrome className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold">دانلود و نصب در مرورگر گوگل کروم</h3>
              <p className="text-xs text-slate-400">{EXTENSION_TITLE}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800/40 text-slate-400 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <p className="text-xs leading-relaxed text-slate-300">
            با دانلود این بسته، افزونه اختصاصی شامل <strong>حباب سه‌بعدی لوگو در سمت راست کروم (سایدبار کشویی)</strong> و همچنین <strong>صفحه تب جدید مداری (New Tab)</strong> به همراه تمامی سامانه‌های فعلی شما تولید می‌شود.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              className={`p-3.5 rounded-2xl border ${
                isDark ? 'bg-slate-950/60 border-white/10' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <FolderArchive className="w-5 h-5 text-emerald-400 mb-2" />
              <div className="text-xs font-bold mb-1">۱. استخراج فایل زیپ</div>
              <p className="text-[11px] text-slate-400 leading-normal">
                فایل دانلود شده را در یک پوشه روی سیستم خود Extract (از حالت فشرده خارج) کنید.
              </p>
            </div>

            <div
              className={`p-3.5 rounded-2xl border ${
                isDark ? 'bg-slate-950/60 border-white/10' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <ToggleRight className="w-5 h-5 text-emerald-400 mb-2" />
              <div className="text-xs font-bold mb-1">۲. بخش افزونه‌های کروم</div>
              <p className="text-[11px] text-slate-400 leading-normal">
                در کروم آدرس <code className="font-mono text-emerald-300">chrome://extensions</code> را باز کرده و Developer mode را فعال کنید.
              </p>
            </div>

            <div
              className={`p-3.5 rounded-2xl border ${
                isDark ? 'bg-slate-950/60 border-white/10' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <Upload className="w-5 h-5 text-emerald-400 mb-2" />
              <div className="text-xs font-bold mb-1">۳. بارگذاری پوشه</div>
              <p className="text-[11px] text-slate-400 leading-normal">
                روی دکمه <strong>Load unpacked</strong> کلیک کرده و پوشه مرحله اول را انتخاب نمایید.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400">{FOOTER_CREDIT}</span>

            <button
              type="button"
              onClick={handleDownloadZip}
              disabled={isGenerating}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer transition-all whitespace-nowrap shrink-0"
            >
              {downloaded ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>دانلود مجدد بسته افزونه کروم (ZIP)</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{isGenerating ? 'در حال ساخت بسته...' : 'دانلود مستقیم افزونه کروم (ZIP)'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
