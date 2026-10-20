import JSZip from 'jszip';
import {
  PortalSite,
  LOGO_ASSET_PATH,
  EXTENSION_TITLE,
  FOOTER_CREDIT,
  getOrbitalPosition,
} from '../data/defaultSites';
import { getTransparentLogoDataUrl } from '../utils/logoProcessor';

export async function generateChromeExtensionZip(sites: PortalSite[]): Promise<Blob> {
  const zip = new JSZip();

  // 1. Bundle the borderless transparent logo inside the extension as logo.png
  let logoBase64 = '';
  try {
    logoBase64 = await getTransparentLogoDataUrl();
    if (logoBase64.startsWith('data:image/png;base64,')) {
      const base64Content = logoBase64.replace(/^data:image\/png;base64,/, '');
      zip.file('logo.png', base64Content, { base64: true });
    } else {
      const response = await fetch(LOGO_ASSET_PATH);
      const blob = await response.blob();
      zip.file('logo.png', blob);
    }
  } catch (err) {
    console.warn('Could not bundle transparent logo binary:', err);
  }

  // 2. Try bundling Homa.woff font file (with fast timeout) so Homa font works even offline or under strict CSP
  let hasBundledHoma = false;
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 2500);
    const fontResp = await fetch('https://cdn.fontcdn.ir/Font/Persian/Homa/Homa.woff', {
      signal: controller.signal,
    });
    window.clearTimeout(timer);
    if (fontResp.ok) {
      const fontBlob = await fontResp.blob();
      if (fontBlob.size > 1000) {
        zip.file('homa.woff', fontBlob);
        hasBundledHoma = true;
      }
    }
  } catch {
    // Fallback to local('B Homa') / CDN URL in CSS
  }

  // 3. manifest.json (Manifest V3)
  // IMPORTANT:
  // - NO chrome_url_overrides.newtab -> Clicking New Tab (+) in Chrome will NEVER open the extension!
  // - NO default_popup -> Clicking the toolbar icon slides open the right-side sidebar on the page (or Chrome's right Side Panel on internal pages)
  const manifest = {
    manifest_version: 3,
    name: EXTENSION_TITLE,
    short_name: 'مثبت زندگی ۷۸۲۸',
    version: '4.0.0',
    description: `${EXTENSION_TITLE} — ${FOOTER_CREDIT}`,
    permissions: ['storage', 'scripting', 'tabs', 'sidePanel'],
    host_permissions: ['<all_urls>'],
    background: {
      service_worker: 'background.js',
    },
    icons: {
      '16': 'logo.png',
      '48': 'logo.png',
      '128': 'logo.png',
    },
    action: {
      default_title: `${EXTENSION_TITLE} (باز/بسته کردن سایدبار کشویی سمت راست)`,
      default_icon: 'logo.png',
    },
    side_panel: {
      default_path: 'sidepanel.html',
    },
    content_scripts: [
      {
        matches: ['<all_urls>'],
        css: ['content.css'],
        js: ['content.js'],
        run_at: 'document_end',
      },
    ],
    web_accessible_resources: [
      {
        resources: hasBundledHoma ? ['logo.png', 'homa.woff'] : ['logo.png'],
        matches: ['<all_urls>'],
      },
    ],
  };

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  // 4. background.js
  // - Immediately injects and opens the right-side sliding sidebar in all open web tabs as soon as the extension is enabled
  // - Toggles the right-side sliding sidebar when clicking the extension icon in Chrome toolbar
  // - Falls back to Chrome's right-side Side Panel if the user clicks the icon on a restricted chrome:// page
  const backgroundJs = `// ${EXTENSION_TITLE} - Background Service Worker (v4.0.0)
function injectIntoTab(tabId, autoOpen) {
  if (!tabId) return;
  chrome.scripting.insertCSS({
    target: { tabId: tabId },
    files: ['content.css']
  }).catch(function() {});

  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['content.js']
  }).then(function() {
    if (autoOpen) {
      chrome.tabs.sendMessage(tabId, { action: 'OPEN_MZ_SIDEBAR' }).catch(function() {});
    }
  }).catch(function() {});
}

function injectAllOpenWebTabs(autoOpen) {
  chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] }, function(tabs) {
    if (!tabs) return;
    tabs.forEach(function(tab) {
      if (tab && tab.id) {
        injectIntoTab(tab.id, autoOpen);
      }
    });
  });
}

chrome.runtime.onInstalled.addListener(function() {
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(function() {});
  }
  injectAllOpenWebTabs(true);
});

chrome.runtime.onStartup.addListener(function() {
  injectAllOpenWebTabs(false);
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tab && tab.url && /^https?:\\/\\//i.test(tab.url)) {
    injectIntoTab(tabId, false);
  }
});

chrome.action.onClicked.addListener(function(tab) {
  var isWebPage = tab && tab.url && /^https?:\\/\\//i.test(tab.url);
  if (!isWebPage) {
    // On restricted browser pages (like chrome://extensions or chrome://newtab), open Chrome's right-side Side Panel
    if (chrome.sidePanel && chrome.sidePanel.open && tab) {
      chrome.sidePanel.open({ windowId: tab.windowId }).catch(function() {});
    }
    return;
  }

  if (tab && tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE_MZ_SIDEBAR' }).catch(function() {
      injectIntoTab(tab.id, true);
    });
  }
});
`;
  zip.file('background.js', backgroundJs);

  // 5. content.css (Page-level @font-face + root container positioning)
  zip.file('content.css', buildContentCss());

  // 6. content.js (Shadow-DOM isolated right-side sliding sidebar with pure 3D logo handle, Homa font, stacked Persian clock/date, gear settings)
  zip.file('content.js', buildContentJs(sites));

  // 7. orbital.js & sidepanel.html (Used when opened via Chrome's native Right Side Panel on internal chrome:// pages)
  zip.file('orbital.js', buildOrbitalJs(sites));
  zip.file('sidepanel.html', createPreRenderedOrbitalHtml(sites, 'logo.png', true));

  // 8. README-INSTALL.txt
  const readmeText = `============================================================
راهنمای نصب و بروزرسانی «${EXTENSION_TITLE}» (نسخه ۴.۰ نهایی)
${FOOTER_CREDIT}
============================================================

مراحل نصب در مرورگر Google Chrome:
1. ابتدا فایل زیپ دانلود شده را در یک پوشه روی کامپیوتر خود از حالت فشرده خارج کنید (Extract).
2. در مرورگر گوگل کروم، به آدرس زیر بروید:
   chrome://extensions
3. بسیار مهم: اگر نسخه قبلی (نسخه 1 یا 2 یا 3) را نصب دارید، حتماً روی دکمه Remove کلیک کنید تا نسخه قدیمی کاملاً حذف شود.
4. گزینه Developer mode را در بالا سمت راست روشن کرده و روی دکمه Load unpacked کلیک کنید.
5. پوشه استخراج‌شده جدید را انتخاب نمایید.

ویژگی‌های نسخه ۴.۰:
- قرارگیری خودکار سایدبار کشویی و حباب لوگو در سمت راست صفحات وب به محض فعال کردن افزونه.
- باز شدن نرم و کشویی با بردن موس روی لوگوی سمت راست یا کلیک روی آن.
- عدم جایگزینی صفحه تب جدید کروم (New Tab)؛ تب جدید کروم کاملاً عادی باقی می‌ماند.
- فونت هما (Homa) برای توضیحات هدر و نوار پایین افزونه.
- ساعت و تاریخ فارسی زنده در سمت راست هدر (زیر هم).
- دکمه تنظیمات (آیکون چرخ‌دنده) در سمت چپ هدر شامل تنظیمات تم، افزودن کارت و تغییر حالت نمایش.
- نمایش کامل و بدون بریدگی تمامی عناوین طولانی (مانند سامانه صدای مشاور و دریافت شماره شبا).
`;

  zip.file('README-INSTALL.txt', readmeText);

  return await zip.generateAsync({ type: 'blob' });
}

export function buildContentCss(): string {
  return `/* ${EXTENSION_TITLE} - ${FOOTER_CREDIT} */
@font-face {
  font-family: 'HomaExt';
  src: local('B Homa'), local('BHoma'), local('Homa'), local('2  Homa'), local('IPT Homa'),
       url('https://cdn.fontcdn.ir/Font/Persian/Homa/Homa.woff') format('woff');
  font-display: swap;
}

#mz7828-host {
  position: fixed !important;
  top: 0 !important;
  right: 0 !important;
  width: 0 !important;
  height: 0 !important;
  z-index: 2147483646 !important;
  pointer-events: none !important;
  border: none !important;
  margin: 0 !important;
  padding: 0 !important;
}
`;
}

export function buildShadowStyles(fontUrlExpr: string): string {
  return `
@font-face {
  font-family: 'HomaExt';
  src: local('B Homa'), local('BHoma'), local('Homa'), local('2  Homa'), local('IPT Homa'),
       url('${fontUrlExpr}') format('woff'),
       url('https://cdn.fontcdn.ir/Font/Persian/Homa/Homa.woff') format('woff');
  font-display: swap;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

#mz7828-sidebar {
  position: fixed;
  top: 8px;
  bottom: 8px;
  right: 0;
  width: 536px;
  max-width: calc(100vw - 58px);
  background: radial-gradient(circle at 50% 48%, rgba(30, 41, 59, 0.98) 0%, rgba(9, 13, 22, 0.99) 100%);
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
  border-left: 1px solid rgba(255, 255, 255, 0.18);
  border-top: 1px solid rgba(255, 255, 255, 0.14);
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 26px 0 0 26px;
  box-shadow: -22px 0 55px rgba(0, 0, 0, 0.72);
  transform: translateX(100%);
  transition: transform 0.34s cubic-bezier(0.16, 1, 0.3, 1), background 0.25s ease, color 0.25s ease, box-shadow 0.34s ease;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: #f8fafc;
  font-family: 'Vazirmatn', 'Tahoma', system-ui, -apple-system, sans-serif;
  direction: rtl;
  user-select: none;
}

#mz7828-sidebar:not(.mz-open) {
  box-shadow: none;
}

#mz7828-sidebar.mz-light {
  background: radial-gradient(circle at 50% 48%, rgba(255, 255, 255, 0.98) 0%, rgba(226, 232, 240, 0.99) 100%);
  color: #0f172a;
  border-color: rgba(148, 163, 184, 0.55);
}

#mz7828-sidebar.mz-light.mz-open {
  box-shadow: -18px 0 45px rgba(15, 23, 42, 0.24);
}

#mz7828-sidebar.mz-open {
  transform: translateX(0);
}

/* Right-Edge Pure Borderless 3D Logo Bubble Handle */
#mz7828-handle {
  position: absolute;
  left: -64px;
  top: 50%;
  transform: translateY(-50%);
  width: 64px;
  height: 76px;
  background: transparent;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  cursor: pointer;
  pointer-events: auto;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), filter 0.25s ease;
  z-index: 60;
}

#mz7828-handle::before {
  content: '';
  position: absolute;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.28) 0%, rgba(239, 68, 68, 0.16) 55%, rgba(0, 0, 0, 0) 75%);
  z-index: -1;
  transition: transform 0.25s ease, opacity 0.25s ease;
}

#mz7828-handle:hover {
  transform: translateY(-50%) scale(1.12);
}

#mz7828-handle:hover::before {
  transform: scale(1.22);
}

#mz7828-handle img {
  width: 50px;
  height: 50px;
  object-fit: contain;
  filter: drop-shadow(0 8px 16px rgba(239, 68, 68, 0.52));
  pointer-events: none;
}

#mz7828-handle span {
  font-family: 'B Homa', 'BHoma', 'Homa', 'HomaExt', 'Tahoma', sans-serif;
  font-size: 9.5px;
  font-weight: 700;
  color: #34d399;
  background: rgba(15, 23, 42, 0.88);
  padding: 1px 6px;
  border-radius: 999px;
  border: 1px solid rgba(16, 185, 129, 0.35);
  white-space: nowrap;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
}

#mz7828-sidebar.mz-light #mz7828-handle span {
  background: rgba(255, 255, 255, 0.94);
  color: #059669;
  border-color: rgba(5, 150, 105, 0.4);
}

/* Faint Pure Logo Watermark in Background */
#mz7828-watermark {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.08;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
  border-radius: 26px 0 0 26px;
}

#mz7828-watermark img {
  width: 330px;
  height: 330px;
  object-fit: contain;
}

/* Header: Right=Stacked Persian Clock & Date, Center=Homa Title, Left=Gear Icon Settings */
.mz-header {
  font-family: 'B Homa', 'BHoma', 'Homa', 'HomaExt', 'Tahoma', sans-serif;
  position: relative;
  z-index: 35;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(15, 23, 42, 0.82);
  border-radius: 26px 0 0 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

#mz7828-sidebar.mz-light .mz-header {
  background: rgba(255, 255, 255, 0.9);
  border-bottom-color: rgba(148, 163, 184, 0.35);
}

/* Right side of Header: Stacked Persian Clock & Date */
.mz-datetime {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  line-height: 1.25;
  flex-shrink: 0;
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 4px 9px;
  border-radius: 11px;
}

#mz7828-sidebar.mz-light .mz-datetime {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.mz-time {
  font-size: 12.5px;
  font-weight: 800;
  color: #10b981;
  font-variant-numeric: tabular-nums;
}

#mz7828-sidebar.mz-light .mz-time {
  color: #059669;
}

.mz-date {
  font-size: 10.5px;
  font-weight: 700;
  color: #cbd5e1;
}

#mz7828-sidebar.mz-light .mz-date {
  color: #475569;
}

/* Center of Header: Extension Title in Homa Font */
.mz-title {
  font-family: 'B Homa', 'BHoma', 'Homa', 'HomaExt', 'Tahoma', sans-serif;
  font-size: 15px;
  font-weight: 700;
  margin: 0;
  text-align: center;
  flex: 1;
  white-space: nowrap;
  color: inherit;
}

/* Left side of Header: Gear Settings Button + Pin Button */
.mz-header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.mz-icon-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(30, 41, 59, 0.9);
  color: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
}

#mz7828-sidebar.mz-light .mz-icon-btn {
  background: #f1f5f9;
  color: #0f172a;
  border-color: #cbd5e1;
}

.mz-icon-btn:hover,
.mz-icon-btn.mz-active {
  border-color: #10b981;
  color: #10b981;
}

.mz-icon-btn svg {
  width: 17px;
  height: 17px;
  stroke: currentColor;
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* Left Header Settings Dropdown Popover */
.mz-settings-pop {
  position: absolute;
  top: calc(100% + 6px);
  left: 12px;
  width: 268px;
  background: rgba(15, 23, 42, 0.98);
  color: #f8fafc;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 16px;
  padding: 12px;
  box-shadow: 0 22px 48px rgba(0, 0, 0, 0.78);
  display: none;
  flex-direction: column;
  gap: 8px;
  z-index: 100;
  font-family: 'Vazirmatn', 'Tahoma', sans-serif;
}

#mz7828-sidebar.mz-light .mz-settings-pop {
  background: #ffffff;
  color: #0f172a;
  border-color: #cbd5e1;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.22);
}

.mz-settings-pop.mz-show {
  display: flex;
}

.mz-settings-head {
  font-family: 'B Homa', 'BHoma', 'Homa', 'HomaExt', 'Tahoma', sans-serif;
  font-size: 13px;
  font-weight: 700;
  border-bottom: 1px solid rgba(148, 163, 184, 0.22);
  padding-bottom: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mz-set-btn {
  width: 100%;
  padding: 7.5px 10px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(30, 41, 59, 0.85);
  color: inherit;
  font-family: inherit;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  text-align: right;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: border-color 0.2s ease, background 0.2s ease;
}

#mz7828-sidebar.mz-light .mz-set-btn {
  background: #f1f5f9;
}

.mz-set-btn:hover {
  border-color: #10b981;
}

.mz-input {
  width: 100%;
  padding: 6.5px 9px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(2, 6, 23, 0.65);
  color: inherit;
  font-family: inherit;
  font-size: 11px;
  outline: none;
}

#mz7828-sidebar.mz-light .mz-input {
  background: #f8fafc;
}

.mz-input:focus {
  border-color: #10b981;
}

/* Main Orbital Stage */
.mz-orbit-stage {
  position: relative;
  z-index: 5;
  flex: 1;
  min-height: 465px;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.mz-orbit-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.mz-center-logo {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 92px;
  height: 92px;
  z-index: 8;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: mzFloatCenter 4.2s ease-in-out infinite;
}

@keyframes mzFloatCenter {
  0%, 100% { transform: translate(-50%, -50%); }
  50% { transform: translate(-50%, calc(-50% - 7px)); }
}

.mz-center-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 14px 26px rgba(239, 68, 68, 0.48));
}

/* 3D Orbital Portal Cards - Wide enough for complete non-truncated Persian titles & subtitles */
.mz-orbit-node {
  position: absolute;
  width: 162px;
  padding: 8px 10px;
  border-radius: 15px;
  text-decoration: none !important;
  color: #f8fafc !important;
  background: linear-gradient(145deg, rgba(30, 41, 59, 0.96), rgba(15, 23, 42, 0.99));
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow: 0 11px 22px -5px rgba(0, 0, 0, 0.65), 0 3.5px 0 0 rgba(51, 65, 85, 1);
  text-align: center;
  transform: translate(-50%, -50%);
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease, box-shadow 0.2s ease;
  z-index: 15;
  display: block;
}

#mz7828-sidebar.mz-light .mz-orbit-node {
  background: linear-gradient(145deg, #ffffff, #f1f5f9);
  color: #0f172a !important;
  border-color: #cbd5e1;
  box-shadow: 0 9px 18px rgba(15, 23, 42, 0.14), 0 3.5px 0 0 #cbd5e1;
}

.mz-orbit-node:hover {
  transform: translate(-50%, calc(-50% - 6px)) scale(1.08) perspective(450px) rotateX(7deg);
  border-color: #10b981;
  box-shadow: 0 16px 28px -6px rgba(16, 185, 129, 0.45), 0 4px 0 0 #10b981;
  z-index: 30;
}

.mz-node-badge {
  position: absolute;
  top: -7px;
  left: -7px;
  width: 19px;
  height: 19px;
  border-radius: 6px;
  background: #10b981;
  color: #022c22;
  font-size: 10px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}

/* Complete non-truncated title and subtitle */
.mz-node-name {
  font-size: 12px;
  font-weight: 800;
  line-height: 1.35;
  white-space: nowrap;
}

.mz-node-sub {
  font-size: 9.5px;
  line-height: 1.3;
  color: #94a3b8;
  margin-top: 2px;
  white-space: nowrap;
}

#mz7828-sidebar.mz-light .mz-node-sub {
  color: #64748b;
}

/* Cards Grid Mode */
.mz-cards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 16px;
}

.mz-card-item {
  position: relative;
  padding: 11px 13px;
  border-radius: 15px;
  text-decoration: none !important;
  color: inherit !important;
  background: linear-gradient(145deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.96));
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: 0 8px 18px -4px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  gap: 3px;
  transition: transform 0.18s ease, border-color 0.18s ease;
}

#mz7828-sidebar.mz-light .mz-card-item {
  background: #ffffff;
  border-color: #cbd5e1;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.08);
}

.mz-card-item:hover {
  transform: translateY(-3px);
  border-color: #10b981;
}

/* Bottom Footer Bar in Homa Font */
.mz-footer {
  font-family: 'B Homa', 'BHoma', 'Homa', 'HomaExt', 'Tahoma', sans-serif;
  position: relative;
  z-index: 15;
  padding: 9px 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(2, 6, 23, 0.88);
  text-align: center;
  font-size: 12.5px;
  color: #e2e8f0;
  font-weight: 700;
  border-radius: 0 0 0 26px;
}

#mz7828-sidebar.mz-light .mz-footer {
  background: rgba(255, 255, 255, 0.92);
  color: #1e293b;
  border-top-color: #cbd5e1;
}
`;
}

export function buildContentJs(sites: PortalSite[]): string {
  const sitesJson = JSON.stringify(sites);
  const shadowCssTemplate = JSON.stringify(buildShadowStyles('__HOMA_FONT_URL__'));

  return `(function() {
  if (document.getElementById('mz7828-host')) return;

  const defaultSites = ${sitesJson};
  let sites = defaultSites.slice();
  let mode = 'orbital';
  let isLight = false;
  let isPinned = false;

  const logoUrl = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL)
    ? chrome.runtime.getURL('logo.png')
    : 'logo.png';

  const homaUrl = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL)
    ? chrome.runtime.getURL('homa.woff')
    : 'https://cdn.fontcdn.ir/Font/Persian/Homa/Homa.woff';

  const host = document.createElement('div');
  host.id = 'mz7828-host';
  const shadow = host.attachShadow({ mode: 'open' });

  const styleEl = document.createElement('style');
  styleEl.textContent = (${shadowCssTemplate}).replace('__HOMA_FONT_URL__', homaUrl);
  shadow.appendChild(styleEl);

  const sidebar = document.createElement('div');
  sidebar.id = 'mz7828-sidebar';
  // Immediately place and open on the right side upon activation
  sidebar.classList.add('mz-open');

  let closeTimer = null;
  let lastHoverOpenTime = Date.now();
  let ignoreHoverUntil = 0;

  function updateHandleLabel() {
    const labelEl = sidebar.querySelector('#mz-handle-label');
    if (labelEl) {
      labelEl.textContent = sidebar.classList.contains('mz-open') ? 'بستن' : 'سامانه‌ها';
    }
  }

  function openSidebar() {
    if (Date.now() < ignoreHoverUntil) return;
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    if (!sidebar.classList.contains('mz-open')) {
      lastHoverOpenTime = Date.now();
      sidebar.classList.add('mz-open');
      updateHandleLabel();
    }
  }

  function scheduleClose() {
    if (isPinned) return;
    if (closeTimer) clearTimeout(closeTimer);
    closeTimer = setTimeout(function() {
      const settingsPop = sidebar.querySelector('#mz-settings-pop');
      if (settingsPop) settingsPop.classList.remove('mz-show');
      sidebar.classList.remove('mz-open');
      updateHandleLabel();
    }, 380);
  }

  sidebar.addEventListener('mouseenter', openSidebar);
  sidebar.addEventListener('mouseleave', scheduleClose);

  function computePos(idx, total, rx, ry) {
    if (total === 9) {
      const layout = [
        [0, -1.0],
        [0.94, -0.67],
        [1.0, -0.11],
        [0.96, 0.44],
        [0.56, 0.96],
        [-0.56, 0.96],
        [-0.96, 0.44],
        [-1.0, -0.11],
        [-0.94, -0.67]
      ];
      return {
        x: Math.round(layout[idx][0] * rx),
        y: Math.round(layout[idx][1] * ry)
      };
    }
    const angle = (idx / Math.max(1, total)) * (2 * Math.PI) - Math.PI / 2;
    return {
      x: Math.round(Math.cos(angle) * rx),
      y: Math.round(Math.sin(angle) * ry)
    };
  }

  function saveState() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({
          mz7828_sites_v4: sites,
          mz7828_mode_v4: mode,
          mz7828_light_v4: isLight,
          mz7828_pinned_v4: isPinned
        });
      }
    } catch (e) {}
    try {
      localStorage.setItem('mz7828_sites_v4', JSON.stringify(sites));
      localStorage.setItem('mz7828_mode_v4', mode);
      localStorage.setItem('mz7828_light_v4', String(isLight));
    } catch (e) {}
  }

  function renderStage() {
    const stageEl = sidebar.querySelector('.mz-orbit-stage');
    if (!stageEl) return;

    if (mode === 'cards') {
      stageEl.innerHTML = '<div class="mz-cards-grid">' +
        sites.map(function(s, idx) {
          return '<a class="mz-card-item" href="' + s.url + '" target="_blank" rel="noopener noreferrer">' +
            '<div class="mz-node-name">' + (idx + 1) + '. ' + s.name + '</div>' +
            '<div class="mz-node-sub">' + s.subtitle + '</div>' +
          '</a>';
        }).join('') +
      '</div>';
      return;
    }

    const rx = 176;
    const ry = 186;
    const svgW = 536;
    const svgH = 465;
    const cx = svgW / 2;
    const cy = svgH / 2;

    const linesSvg = sites.map(function(_, idx) {
      const pos = computePos(idx, sites.length, rx, ry);
      return '<line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + pos.x) + '" y2="' + (cy + pos.y) + '" stroke="rgba(148,163,184,0.18)" stroke-width="1.2" stroke-dasharray="4 4" />';
    }).join('');

    const nodesHtml = sites.map(function(s, idx) {
      const pos = computePos(idx, sites.length, rx, ry);
      return '<a class="mz-orbit-node" href="' + s.url + '" target="_blank" rel="noopener noreferrer" style="left: calc(50% + ' + pos.x + 'px); top: calc(50% + ' + pos.y + 'px);">' +
        '<div class="mz-node-badge">' + (idx + 1) + '</div>' +
        '<div class="mz-node-name">' + s.name + '</div>' +
        '<div class="mz-node-sub">' + s.subtitle + '</div>' +
      '</a>';
    }).join('');

    stageEl.innerHTML =
      '<svg class="mz-orbit-svg" viewBox="0 0 ' + svgW + ' ' + svgH + '">' +
        '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="none" stroke="rgba(148,163,184,0.18)" stroke-width="1.5" stroke-dasharray="6 6" />' +
        linesSvg +
      '</svg>' +
      '<div class="mz-center-logo"><img src="' + logoUrl + '" alt="Logo" /></div>' +
      nodesHtml;

    // Attach 3D perspective mouse-tilt to each orbital button
    const nodeEls = stageEl.querySelectorAll('.mz-orbit-node');
    nodeEls.forEach(function(node) {
      node.addEventListener('mousemove', function(e) {
        const rect = node.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const tiltX = ((y - rect.height / 2) / (rect.height / 2)) * -9;
        const tiltY = ((x - rect.width / 2) / (rect.width / 2)) * 9;
        node.style.transform = 'translate(-50%, calc(-50% - 6px)) scale(1.08) perspective(500px) rotateX(' + tiltX.toFixed(1) + 'deg) rotateY(' + tiltY.toFixed(1) + 'deg)';
      });
      node.addEventListener('mouseleave', function() {
        node.style.transform = 'translate(-50%, -50%) scale(1)';
      });
    });
  }

  // Gear SVG & Pin SVG icons
  const gearSvg = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>';
  const pinSvg = '<svg viewBox="0 0 24 24"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>';

  sidebar.innerHTML =
    '<button type="button" id="mz7828-handle" title="باز و بسته کردن سایدبار کشویی سمت راست">' +
      '<img src="' + logoUrl + '" alt="Logo" />' +
      '<span id="mz-handle-label">بستن</span>' +
    '</button>' +
    '<div id="mz7828-watermark"><img src="' + logoUrl + '" alt="" /></div>' +
    '<div class="mz-header">' +
      '<!-- Right Side of Header: Stacked Persian Clock & Date -->' +
      '<div class="mz-datetime">' +
        '<span class="mz-time" id="mz-clock">--:--:--</span>' +
        '<span class="mz-date" id="mz-date">----/--/--</span>' +
      '</div>' +
      '<!-- Center of Header: Extension Title in Homa Font -->' +
      '<h2 class="mz-title">${EXTENSION_TITLE}</h2>' +
      '<!-- Left Side of Header: Pin & Gear Settings Icon -->' +
      '<div class="mz-header-actions">' +
        '<button type="button" class="mz-icon-btn" id="mz-pin-btn" title="ثابت نگه داشتن پنل کشویی">' + pinSvg + '</button>' +
        '<button type="button" class="mz-icon-btn" id="mz-gear-btn" title="تنظیمات افزونه (تم، افزودن کارت، تنظیم نمایش)">' + gearSvg + '</button>' +
      '</div>' +
      '<div class="mz-settings-pop" id="mz-settings-pop">' +
        '<div class="mz-settings-head">' +
          '<span>تنظیمات افزونه</span>' +
        '</div>' +
        '<button type="button" class="mz-set-btn" id="mz-theme-btn">' +
          '<span>تنظیمات تم (تیره / روشن)</span>' +
          '<span>&#9728;</span>' +
        '</button>' +
        '<button type="button" class="mz-set-btn" id="mz-mode-btn">' +
          '<span>تنظیم نمایش (مداری / کارت‌ها)</span>' +
          '<span>&#9638;</span>' +
        '</button>' +
        '<div style="border-top:1px solid rgba(148,163,184,0.2);padding-top:7px;margin-top:2px;display:flex;flex-direction:column;gap:5px;">' +
          '<div style="font-size:10.5px;font-weight:700;color:#10b981;">اضافه کردن کارت جدید:</div>' +
          '<input class="mz-input" id="mz-new-name" placeholder="نام سامانه (مثلاً: پورتال استان)" />' +
          '<input class="mz-input" id="mz-new-sub" placeholder="توضیح کوتاه سامانه" />' +
          '<input class="mz-input" id="mz-new-url" placeholder="https://..." dir="ltr" />' +
          '<button type="button" class="mz-set-btn" id="mz-add-btn" style="background:#059669;color:#fff;justify-content:center;border-color:#059669;">+ افزودن کارت جدید</button>' +
          '<button type="button" class="mz-set-btn" id="mz-reset-btn" style="justify-content:center;font-size:10px;opacity:0.85;">بازنشانی ۹ سامانه پیش‌فرض</button>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="mz-orbit-stage"></div>' +
    '<div class="mz-footer">${FOOTER_CREDIT}</div>';

  shadow.appendChild(sidebar);
  document.body.appendChild(host);

  // Load saved state from chrome.storage.local (with localStorage fallback)
  function applyLoadedState(data) {
    if (data && Array.isArray(data.mz7828_sites_v4) && data.mz7828_sites_v4.length > 0) {
      sites = data.mz7828_sites_v4;
    }
    if (data && (data.mz7828_mode_v4 === 'orbital' || data.mz7828_mode_v4 === 'cards')) {
      mode = data.mz7828_mode_v4;
    }
    if (data && typeof data.mz7828_light_v4 === 'boolean') {
      isLight = data.mz7828_light_v4;
      sidebar.classList.toggle('mz-light', isLight);
    }
    if (data && typeof data.mz7828_pinned_v4 === 'boolean') {
      isPinned = data.mz7828_pinned_v4;
      const pinBtn = sidebar.querySelector('#mz-pin-btn');
      if (pinBtn) pinBtn.classList.toggle('mz-active', isPinned);
    }
    renderStage();
  }

  try {
    const savedSites = localStorage.getItem('mz7828_sites_v4');
    if (savedSites) sites = JSON.parse(savedSites);
    const savedMode = localStorage.getItem('mz7828_mode_v4');
    if (savedMode === 'orbital' || savedMode === 'cards') mode = savedMode;
    const savedLight = localStorage.getItem('mz7828_light_v4');
    if (savedLight === 'true') {
      isLight = true;
      sidebar.classList.add('mz-light');
    }
  } catch (e) {}

  renderStage();

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['mz7828_sites_v4', 'mz7828_mode_v4', 'mz7828_light_v4', 'mz7828_pinned_v4'], function(res) {
      applyLoadedState(res);
    });
    chrome.storage.onChanged.addListener(function(changes) {
      if (changes.mz7828_sites_v4 && changes.mz7828_sites_v4.newValue) {
        sites = changes.mz7828_sites_v4.newValue;
      }
      if (changes.mz7828_mode_v4 && changes.mz7828_mode_v4.newValue) {
        mode = changes.mz7828_mode_v4.newValue;
      }
      if (changes.mz7828_light_v4 !== undefined) {
        isLight = Boolean(changes.mz7828_light_v4.newValue);
        sidebar.classList.toggle('mz-light', isLight);
      }
      renderStage();
    });
  }

  // Listen for toolbar icon click messages from background.js
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener(function(msg) {
      if (!msg) return;
      if (msg.action === 'OPEN_MZ_SIDEBAR') {
        ignoreHoverUntil = 0;
        sidebar.classList.add('mz-open');
        updateHandleLabel();
      } else if (msg.action === 'TOGGLE_MZ_SIDEBAR') {
        if (sidebar.classList.contains('mz-open')) {
          isPinned = false;
          ignoreHoverUntil = Date.now() + 600;
          sidebar.classList.remove('mz-open');
        } else {
          ignoreHoverUntil = 0;
          isPinned = true;
          sidebar.classList.add('mz-open');
        }
        const pinBtn = sidebar.querySelector('#mz-pin-btn');
        if (pinBtn) pinBtn.classList.toggle('mz-active', isPinned);
        updateHandleLabel();
      }
    });
  }

  // Handle click on the right-edge 3D logo bubble handle (without hover-click conflict)
  const handleEl = sidebar.querySelector('#mz7828-handle');
  if (handleEl) {
    handleEl.addEventListener('click', function(e) {
      e.stopPropagation();
      const isOpen = sidebar.classList.contains('mz-open');
      const justOpenedByHover = isOpen && !isPinned && (Date.now() - lastHoverOpenTime < 650);

      if (justOpenedByHover) {
        // User hovered the handle and clicked to keep/pin it open
        isPinned = true;
        sidebar.classList.add('mz-open');
      } else if (isOpen) {
        // Already open -> close smoothly and pause hover-reopen briefly
        isPinned = false;
        ignoreHoverUntil = Date.now() + 650;
        sidebar.classList.remove('mz-open');
      } else {
        ignoreHoverUntil = 0;
        isPinned = true;
        sidebar.classList.add('mz-open');
      }
      const pinBtn = sidebar.querySelector('#mz-pin-btn');
      if (pinBtn) pinBtn.classList.toggle('mz-active', isPinned);
      updateHandleLabel();
      saveState();
    });
  }

  const pinBtn = sidebar.querySelector('#mz-pin-btn');
  if (pinBtn) {
    pinBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      isPinned = !isPinned;
      pinBtn.classList.toggle('mz-active', isPinned);
      saveState();
    });
  }

  // Gear settings menu in Left Header
  const gearBtn = sidebar.querySelector('#mz-gear-btn');
  const settingsPop = sidebar.querySelector('#mz-settings-pop');
  if (gearBtn && settingsPop) {
    gearBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      settingsPop.classList.toggle('mz-show');
      gearBtn.classList.toggle('mz-active', settingsPop.classList.contains('mz-show'));
    });
    sidebar.addEventListener('click', function(e) {
      if (!settingsPop.contains(e.target) && e.target !== gearBtn) {
        settingsPop.classList.remove('mz-show');
        gearBtn.classList.remove('mz-active');
      }
    });
  }

  const themeBtn = sidebar.querySelector('#mz-theme-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', function() {
      isLight = !isLight;
      sidebar.classList.toggle('mz-light', isLight);
      saveState();
    });
  }

  const modeBtn = sidebar.querySelector('#mz-mode-btn');
  if (modeBtn) {
    modeBtn.addEventListener('click', function() {
      mode = mode === 'orbital' ? 'cards' : 'orbital';
      renderStage();
      saveState();
    });
  }

  const addBtn = sidebar.querySelector('#mz-add-btn');
  if (addBtn) {
    addBtn.addEventListener('click', function() {
      const nameInp = sidebar.querySelector('#mz-new-name');
      const subInp = sidebar.querySelector('#mz-new-sub');
      const urlInp = sidebar.querySelector('#mz-new-url');
      const nameVal = nameInp ? nameInp.value.trim() : '';
      const subVal = (subInp && subInp.value.trim()) ? subInp.value.trim() : 'سامانه سفارشی';
      let urlVal = urlInp ? urlInp.value.trim() : '';
      if (!nameVal || !urlVal) return;
      if (!urlVal.startsWith('http://') && !urlVal.startsWith('https://')) {
        urlVal = 'https://' + urlVal;
      }
      sites.push({
        id: 'site-' + Date.now(),
        name: nameVal,
        subtitle: subVal,
        url: urlVal
      });
      if (nameInp) nameInp.value = '';
      if (subInp) subInp.value = '';
      if (urlInp) urlInp.value = '';
      if (sites.length > 9) mode = 'cards';
      renderStage();
      saveState();
    });
  }

  const resetBtn = sidebar.querySelector('#mz-reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      sites = defaultSites.slice();
      mode = 'orbital';
      renderStage();
      saveState();
    });
  }

  // Live Persian Clock & Date stacked vertically on the Right side of the Header
  function updateClock() {
    const now = new Date();
    const clockEl = sidebar.querySelector('#mz-clock');
    const dateEl = sidebar.querySelector('#mz-date');
    if (clockEl) {
      clockEl.textContent = new Intl.DateTimeFormat('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(now);
    }
    if (dateEl) {
      dateEl.textContent = new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(now);
    }
  }
  updateClock();
  setInterval(updateClock, 1000);
})();
`;
}

export function buildOrbitalJs(sites: PortalSite[]): string {
  const sitesJson = JSON.stringify(sites);
  return `(function() {
  const defaultSites = ${sitesJson};
  let sites = defaultSites.slice();
  try {
    const saved = localStorage.getItem('mz7828_sites_v4');
    if (saved) sites = JSON.parse(saved);
  } catch (e) {}

  let displayMode = localStorage.getItem('mz7828_mode_v4') || 'orbital';
  let isLight = localStorage.getItem('mz7828_light_v4') === 'true';

  if (isLight) {
    document.body.classList.add('light-mode');
  }

  // 1. Live Persian Clock & Date stacked on the right side of header
  function updateDateTime() {
    const now = new Date();
    const timeEl = document.getElementById('ext-time');
    const dateEl = document.getElementById('ext-date');
    if (timeEl) {
      timeEl.textContent = new Intl.DateTimeFormat('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(now);
    }
    if (dateEl) {
      dateEl.textContent = new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(now);
    }
  }
  updateDateTime();
  setInterval(updateDateTime, 1000);

  // 2. Settings Gear Menu on the left side of header
  const gearBtn = document.getElementById('gear-btn');
  const settingsPanel = document.getElementById('settings-panel');
  if (gearBtn && settingsPanel) {
    gearBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      settingsPanel.classList.toggle('open');
    });
    document.addEventListener('click', function(e) {
      if (!settingsPanel.contains(e.target) && e.target !== gearBtn) {
        settingsPanel.classList.remove('open');
      }
    });
  }

  function syncStorage() {
    try {
      localStorage.setItem('mz7828_sites_v4', JSON.stringify(sites));
      localStorage.setItem('mz7828_mode_v4', displayMode);
      localStorage.setItem('mz7828_light_v4', String(isLight));
    } catch (e) {}
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({
          mz7828_sites_v4: sites,
          mz7828_mode_v4: displayMode,
          mz7828_light_v4: isLight
        });
      }
    } catch (e) {}
  }

  // Theme Toggle inside Gear Settings
  const themeBtn = document.getElementById('toggle-theme-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', function() {
      isLight = !isLight;
      document.body.classList.toggle('light-mode', isLight);
      syncStorage();
    });
  }

  // Display Mode Toggle (Orbital vs Grid Cards) inside Gear Settings
  const modeBtn = document.getElementById('toggle-mode-btn');
  const stageEl = document.getElementById('orbital-stage');
  if (modeBtn && stageEl) {
    if (displayMode === 'cards') {
      stageEl.classList.add('grid-mode');
    }
    modeBtn.addEventListener('click', function() {
      displayMode = displayMode === 'orbital' ? 'cards' : 'orbital';
      stageEl.classList.toggle('grid-mode', displayMode === 'cards');
      syncStorage();
    });
  }

  // Add New Card inside Gear Settings
  const addCardBtn = document.getElementById('add-card-btn');
  if (addCardBtn && stageEl) {
    addCardBtn.addEventListener('click', function() {
      const nameInput = document.getElementById('new-card-name');
      const subInput = document.getElementById('new-card-sub');
      const urlInput = document.getElementById('new-card-url');
      const name = nameInput ? nameInput.value.trim() : '';
      const sub = subInput && subInput.value.trim() ? subInput.value.trim() : 'سامانه سفارشی';
      let url = urlInput ? urlInput.value.trim() : '';
      if (!name || !url) return;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      sites.push({ name: name, subtitle: sub, url: url });
      const a = document.createElement('a');
      a.className = 'node';
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.innerHTML = '<div class="node-badge">' + sites.length + '</div>' +
                    '<div class="node-title">' + name + '</div>' +
                    '<div class="node-sub">' + sub + '</div>';
      stageEl.appendChild(a);
      displayMode = 'cards';
      stageEl.classList.add('grid-mode');
      syncStorage();
      if (nameInput) nameInput.value = '';
      if (subInput) subInput.value = '';
      if (urlInput) urlInput.value = '';
    });
  }

  // Reset Default 9 Sites
  const resetBtn = document.getElementById('reset-cards-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      sites = defaultSites.slice();
      displayMode = 'orbital';
      syncStorage();
      window.location.reload();
    });
  }

  // Keyboard shortcuts 1-9
  window.addEventListener('keydown', function(e) {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    const num = parseInt(e.key, 10);
    if (num >= 1 && num <= 9 && sites[num - 1]) {
      window.open(sites[num - 1].url, '_blank', 'noopener,noreferrer');
    }
  });

  // Interactive 3D perspective mouse tilt on each orbital node
  const nodes = document.querySelectorAll('.node');
  nodes.forEach(function(node) {
    node.addEventListener('mousemove', function(e) {
      if (stageEl && stageEl.classList.contains('grid-mode')) return;
      const rect = node.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rx = ((y - rect.height / 2) / (rect.height / 2)) * -10;
      const ry = ((x - rect.width / 2) / (rect.width / 2)) * 10;
      node.style.transform = 'translate(-50%, calc(-50% - 7px)) scale(1.08) perspective(550px) rotateX(' + rx.toFixed(1) + 'deg) rotateY(' + ry.toFixed(1) + 'deg)';
    });
    node.addEventListener('mouseleave', function() {
      if (stageEl && stageEl.classList.contains('grid-mode')) {
        node.style.transform = '';
        return;
      }
      node.style.transform = 'translate(-50%, -50%) scale(1)';
    });
  });
})();
`;
}

export function createPreRenderedOrbitalHtml(
  sites: PortalSite[],
  logoSrc: string,
  isSidePanel: boolean
): string {
  // Spacious radii so bottom nodes (5 & 6) and top nodes (9, 1, 2) never overlap
  const radiusX = isSidePanel ? 174 : 315;
  const radiusY = isSidePanel ? 186 : 215;
  const svgW = isSidePanel ? 536 : 920;
  const svgH = isSidePanel ? 470 : 540;
  const cx = svgW / 2;
  const cy = svgH / 2;

  const svgLines = sites
    .map((_, i) => {
      const { x, y } = getOrbitalPosition(i, sites.length, radiusX, radiusY);
      return `<line x1="${cx}" y1="${cy}" x2="${cx + x}" y2="${cy + y}" stroke="rgba(148,163,184,0.18)" stroke-width="1.2" stroke-dasharray="4 4" />`;
    })
    .join('\n        ');

  const preRenderedNodes = sites
    .map((site, i) => {
      const { x, y } = getOrbitalPosition(i, sites.length, radiusX, radiusY);
      return `<a class="node" href="${site.url}" target="_blank" rel="noopener noreferrer" style="left: calc(50% + ${x}px); top: calc(50% + ${y}px);">
        <div class="node-badge">${i + 1}</div>
        <div class="node-title">${site.name}</div>
        <div class="node-sub">${site.subtitle}</div>
      </a>`;
    })
    .join('\n      ');

  const gearSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`;

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>${EXTENSION_TITLE}</title>
  <style>
    @font-face {
      font-family: 'HomaExt';
      src: local('B Homa'), local('BHoma'), local('Homa'), local('2  Homa'),
           url('homa.woff') format('woff'),
           url('https://cdn.fontcdn.ir/Font/Persian/Homa/Homa.woff') format('woff');
      font-display: swap;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Vazirmatn', 'Tahoma', system-ui, sans-serif;
      background: radial-gradient(circle at 50% 48%, #1e293b 0%, #090d16 100%);
      color: #f8fafc;
      height: 100vh;
      width: 100vw;
      overflow-x: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      transition: background 0.25s ease, color 0.25s ease;
    }
    body.light-mode {
      background: radial-gradient(circle at 50% 48%, #ffffff 0%, #e2e8f0 100%);
      color: #0f172a;
    }
    .bg-watermark {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.08;
      pointer-events: none;
      z-index: 0;
    }
    .bg-watermark img {
      width: 320px;
      height: 320px;
      object-fit: contain;
    }
    /* Header in Homa Font: Right=Stacked Persian Clock & Date, Center=Homa Title, Left=Gear Settings Button */
    header {
      font-family: 'B Homa', 'BHoma', 'Homa', 'HomaExt', 'Tahoma', sans-serif;
      position: relative;
      z-index: 40;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      background: rgba(15, 23, 42, 0.82);
      backdrop-filter: blur(14px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    }
    body.light-mode header {
      background: rgba(255, 255, 255, 0.9);
      border-bottom-color: rgba(148, 163, 184, 0.4);
    }
    .header-datetime {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      line-height: 1.25;
      flex-shrink: 0;
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 4px 9px;
      border-radius: 11px;
    }
    body.light-mode .header-datetime {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }
    .header-time {
      font-size: 12.5px;
      font-weight: 800;
      color: #10b981;
      font-variant-numeric: tabular-nums;
    }
    body.light-mode .header-time {
      color: #059669;
    }
    .header-date {
      font-size: 10.5px;
      color: #cbd5e1;
      font-weight: 700;
    }
    body.light-mode .header-date {
      color: #475569;
    }
    header h1 {
      font-family: 'B Homa', 'BHoma', 'Homa', 'HomaExt', 'Tahoma', sans-serif;
      font-size: 15px;
      font-weight: 700;
      text-align: center;
      flex: 1;
      white-space: nowrap;
    }
    .gear-btn {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.2);
      background: rgba(30, 41, 59, 0.9);
      color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }
    body.light-mode .gear-btn {
      background: #f1f5f9;
      color: #0f172a;
      border-color: #cbd5e1;
    }
    .gear-btn:hover {
      border-color: #10b981;
      color: #10b981;
      transform: rotate(35deg);
    }
    /* Settings Popover on Left Side of Header */
    .settings-panel {
      position: absolute;
      top: calc(100% + 6px);
      left: 12px;
      width: 265px;
      background: rgba(15, 23, 42, 0.98);
      color: #f8fafc;
      border: 1px solid rgba(255,255,255,0.22);
      border-radius: 16px;
      padding: 12px;
      box-shadow: 0 20px 45px rgba(0,0,0,0.75);
      display: none;
      flex-direction: column;
      gap: 8px;
      z-index: 100;
      font-family: 'Vazirmatn', 'Tahoma', sans-serif;
    }
    body.light-mode .settings-panel {
      background: #ffffff;
      color: #0f172a;
      border-color: #cbd5e1;
      box-shadow: 0 18px 36px rgba(15,23,42,0.2);
    }
    .settings-panel.open {
      display: flex;
    }
    .settings-title {
      font-family: 'B Homa', 'BHoma', 'Homa', 'HomaExt', 'Tahoma', sans-serif;
      font-size: 13px;
      font-weight: 700;
      border-bottom: 1px solid rgba(148,163,184,0.2);
      padding-bottom: 6px;
    }
    .set-action-btn {
      width: 100%;
      padding: 7.5px 10px;
      border-radius: 10px;
      border: 1px solid rgba(148,163,184,0.25);
      background: rgba(30, 41, 59, 0.85);
      color: inherit;
      font-size: 11.5px;
      font-weight: 700;
      cursor: pointer;
      text-align: right;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    body.light-mode .set-action-btn {
      background: #f1f5f9;
    }
    .set-action-btn:hover {
      border-color: #10b981;
    }
    .set-input {
      width: 100%;
      padding: 6px 8px;
      border-radius: 8px;
      border: 1px solid rgba(148,163,184,0.3);
      background: rgba(2, 6, 23, 0.6);
      color: inherit;
      font-size: 11px;
    }
    body.light-mode .set-input {
      background: #f8fafc;
    }
    .stage {
      position: relative;
      z-index: 5;
      flex: 1;
      width: 100%;
      min-height: 465px;
    }
    /* Grid Mode when toggled from settings */
    .stage.grid-mode {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      padding: 16px;
      align-content: start;
      overflow-y: auto;
    }
    .stage.grid-mode .orbit-svg,
    .stage.grid-mode .center-bubble {
      display: none;
    }
    .stage.grid-mode .node {
      position: relative !important;
      left: auto !important;
      top: auto !important;
      width: 100% !important;
      transform: none !important;
    }
    .orbit-svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
    .center-bubble {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 92px;
      height: 92px;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 6;
      animation: floatCenter 4s ease-in-out infinite;
    }
    .center-bubble img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      filter: drop-shadow(0 16px 28px rgba(239, 68, 68, 0.45));
    }
    @keyframes floatCenter {
      0%, 100% { transform: translate(-50%, -50%); }
      50% { transform: translate(-50%, calc(-50% - 7px)); }
    }
    .node {
      position: absolute;
      width: 162px;
      padding: 8px 10px;
      border-radius: 15px;
      text-decoration: none;
      color: #f8fafc;
      background: linear-gradient(145deg, rgba(30, 41, 59, 0.96), rgba(15, 23, 42, 0.99));
      border: 1px solid rgba(255,255,255,0.22);
      box-shadow: 0 11px 22px -5px rgba(0,0,0,0.65), 0 3.5px 0 0 rgba(51,65,85,1);
      text-align: center;
      transform: translate(-50%, -50%);
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, border-color 0.2s ease;
      z-index: 15;
    }
    body.light-mode .node {
      background: linear-gradient(145deg, #ffffff, #f1f5f9);
      color: #0f172a;
      border-color: #cbd5e1;
      box-shadow: 0 9px 18px -5px rgba(15,23,42,0.14), 0 3.5px 0 0 #cbd5e1;
    }
    .node:hover {
      transform: translate(-50%, calc(-50% - 6px)) scale(1.08) perspective(500px) rotateX(7deg);
      border-color: #10b981;
      box-shadow: 0 16px 28px -6px rgba(16, 185, 129, 0.45), 0 4px 0 0 #10b981;
      z-index: 30;
    }
    .node-badge {
      position: absolute;
      top: -7px;
      left: -7px;
      width: 19px;
      height: 19px;
      border-radius: 6px;
      background: #10b981;
      color: #022c22;
      font-size: 10px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    }
    /* Complete non-truncated titles & subtitles */
    .node-title {
      font-size: 12px;
      font-weight: 800;
      line-height: 1.35;
      margin-bottom: 2px;
      white-space: nowrap;
    }
    .node-sub {
      font-size: 9.5px;
      line-height: 1.3;
      color: #94a3b8;
      white-space: nowrap;
    }
    body.light-mode .node-sub {
      color: #64748b;
    }
    footer {
      font-family: 'B Homa', 'BHoma', 'Homa', 'HomaExt', 'Tahoma', sans-serif;
      position: relative;
      z-index: 10;
      padding: 9px 14px;
      text-align: center;
      font-size: 12.5px;
      font-weight: 700;
      color: #e2e8f0;
      background: rgba(2, 6, 23, 0.88);
      border-top: 1px solid rgba(255, 255, 255, 0.12);
    }
    body.light-mode footer {
      background: rgba(255, 255, 255, 0.9);
      color: #1e293b;
      border-top-color: #cbd5e1;
    }
  </style>
</head>
<body>
  <div class="bg-watermark"><img src="${logoSrc}" alt="" /></div>
  <header>
    <!-- Right Side of Header: Persian Clock & Date Stacked Vertically -->
    <div class="header-datetime">
      <span class="header-time" id="ext-time">۱۲:۰۰:۰۰</span>
      <span class="header-date" id="ext-date">۱۴۰۵/۰۷/۲۸</span>
    </div>

    <!-- Center of Header: Title in Homa Font -->
    <h1>${EXTENSION_TITLE}</h1>

    <!-- Left Side of Header: Gear Icon Settings Button -->
    <button type="button" class="gear-btn" id="gear-btn" title="تنظیمات افزونه">${gearSvg}</button>

    <!-- Settings Dropdown Menu -->
    <div class="settings-panel" id="settings-panel">
      <div class="settings-title">تنظیمات افزونه</div>
      <button type="button" class="set-action-btn" id="toggle-theme-btn">
        <span>تنظیمات تم (تیره / روشن)</span>
        <span>&#9728;</span>
      </button>
      <button type="button" class="set-action-btn" id="toggle-mode-btn">
        <span>تنظیم نمایش (مداری / کارت‌ها)</span>
        <span>&#9638;</span>
      </button>
      <div style="border-top:1px solid rgba(148,163,184,0.2);padding-top:6px;display:flex;flex-direction:column;gap:5px;">
        <span style="font-size:10px;font-weight:700;color:#10b981;">اضافه کردن کارت جدید:</span>
        <input class="set-input" id="new-card-name" placeholder="نام سامانه (مثلاً: پورتال استان)" />
        <input class="set-input" id="new-card-sub" placeholder="توضیح کوتاه" />
        <input class="set-input" id="new-card-url" dir="ltr" placeholder="https://..." />
        <button type="button" class="set-action-btn" id="add-card-btn" style="background:#059669;color:#fff;justify-content:center;">
          + افزودن کارت جدید
        </button>
        <button type="button" class="set-action-btn" id="reset-cards-btn" style="justify-content:center;font-size:10px;opacity:0.8;">
          بازنشانی ۹ سامانه پیش‌فرض
        </button>
      </div>
    </div>
  </header>
  <div class="stage" id="orbital-stage">
    <svg class="orbit-svg" viewBox="0 0 ${svgW} ${svgH}">
      <ellipse cx="${cx}" cy="${cy}" rx="${radiusX}" ry="${radiusY}" fill="none" stroke="rgba(148,163,184,0.18)" stroke-width="1.5" stroke-dasharray="6 6" />
      ${svgLines}
    </svg>
    <div class="center-bubble"><img src="${logoSrc}" alt="Logo" /></div>
    ${preRenderedNodes}
  </div>
  <footer>${FOOTER_CREDIT}</footer>
  <script src="orbital.js"></script>
</body>
</html>`;
}
