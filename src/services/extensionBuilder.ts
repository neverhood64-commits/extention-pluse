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

  // 2. Try bundling Homa.woff font file (with fast timeout) so Homa font works offline and under strict CSP
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
  // - NO chrome_url_overrides.newtab -> Never hijacks Chrome's New Tab page
  // - NO sidePanel -> Never docks as part of Chrome's window frame
  // - Floating right-side sliding sidebar with vertically draggable handle (#mz7828-handle)
  const manifest = {
    manifest_version: 3,
    name: EXTENSION_TITLE,
    short_name: 'مثبت زندگی ۷۸۲۸',
    version: '5.0.0',
    description: `${EXTENSION_TITLE} — ${FOOTER_CREDIT}`,
    permissions: ['storage', 'scripting', 'tabs'],
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
      default_title: `${EXTENSION_TITLE}`,
      default_popup: 'popup.html',
      default_icon: 'logo.png',
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

  // 4. background.js (Immediately injects the right-side sliding sidebar into all open web tabs upon enabling/switching tabs)
  const backgroundJs = `// ${EXTENSION_TITLE} - Background Service Worker (v5.0.0)
function injectIntoTab(tabId) {
  if (!tabId) return;
  chrome.scripting.insertCSS({
    target: { tabId: tabId },
    files: ['content.css']
  }).catch(function() {});

  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['content.js']
  }).catch(function() {});
}

function injectAllOpenWebTabs() {
  chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] }, function(tabs) {
    if (!tabs) return;
    tabs.forEach(function(tab) {
      if (tab && tab.id) {
        injectIntoTab(tab.id);
      }
    });
  });
}

chrome.runtime.onInstalled.addListener(function() {
  injectAllOpenWebTabs();
});

chrome.runtime.onStartup.addListener(function() {
  injectAllOpenWebTabs();
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tab && tab.url && /^https?:\\/\\//i.test(tab.url)) {
    injectIntoTab(tabId);
  }
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
  if (!activeInfo || !activeInfo.tabId) return;
  chrome.tabs.get(activeInfo.tabId, function(tab) {
    if (chrome.runtime.lastError) return;
    if (tab && tab.url && /^https?:\\/\\//i.test(tab.url)) {
      injectIntoTab(tab.id);
    }
  });
});
`;
  zip.file('background.js', backgroundJs);

  // 5. content.css (Right-side sliding drawer + vertically draggable handle, Homa font, stacked clock/date, gear settings)
  zip.file('content.css', buildContentCss());

  // 6. content.js (Right-side sliding sidebar with vertically draggable handle up & down the screen)
  zip.file('content.js', buildContentJs(sites));

  // 7. orbital.js & popup.html
  zip.file('orbital.js', buildOrbitalJs(sites));
  zip.file('popup.html', createPreRenderedOrbitalHtml(sites, 'logo.png'));

  // 8. README-INSTALL.txt
  const readmeText = `============================================================
راهنمای نصب و بروزرسانی «${EXTENSION_TITLE}» (نسخه ۵.۰ نهایی)
${FOOTER_CREDIT}
============================================================

مراحل نصب در مرورگر Google Chrome:
1. ابتدا فایل زیپ دانلود شده را در یک پوشه روی کامپیوتر خود از حالت فشرده خارج کنید (Extract).
2. در مرورگر گوگل کروم، به آدرس زیر بروید:
   chrome://extensions
3. اگر نسخه قبلی را نصب دارید، روی دکمه Remove کلیک کنید تا حذف شود.
4. گزینه Developer mode را در بالا روشن کرده و روی دکمه Load unpacked کلیک کنید.
5. پوشه استخراج‌شده جدید را انتخاب نمایید.

ویژگی‌های جدید نسخه ۵.۰:
- قابلیت جابه‌جایی دستگیره کشویی افزونه به بالا و پایین صفحه (با نگه داشتن کلیک موس روی دستگیره و کشیدن به سمت بالا یا پایین، مکان آن ذخیره می‌شود).
- قرارگیری خودکار سایدبار کشویی در سمت راست صفحات وب به محض فعال کردن افزونه.
- باز شدن یکجا و کامل صفحه و تمام ۹ دکمه بدون هیچ‌گونه بریدگی.
- فونت هما (Homa) برای هدر و نوار پایین افزونه، ساعت و تاریخ فارسی زیر هم در سمت راست هدر، و دکمه چرخ‌دنده تنظیمات در سمت چپ هدر.
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

#mz7828-root {
  position: fixed !important;
  top: 0 !important;
  right: 0 !important;
  z-index: 2147483646 !important;
  font-family: 'Vazirmatn', 'Tahoma', system-ui, sans-serif !important;
  direction: rtl !important;
  pointer-events: none !important;
}

#mz7828-sidebar {
  position: fixed !important;
  top: 10px !important;
  bottom: 10px !important;
  right: 0 !important;
  width: 490px !important;
  max-width: calc(100vw - 68px) !important;
  background: rgba(15, 23, 42, 0.96) !important;
  border-left: 1px solid rgba(255, 255, 255, 0.18) !important;
  border-top: 1px solid rgba(255, 255, 255, 0.14) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14) !important;
  border-radius: 24px 0 0 24px !important;
  box-shadow: none !important;
  transform: translateX(100%) !important;
  transition: transform 0.34s cubic-bezier(0.16, 1, 0.3, 1), background 0.25s ease, color 0.25s ease !important;
  pointer-events: auto !important;
  display: flex !important;
  flex-direction: column !important;
  color: #f8fafc !important;
  box-sizing: border-box !important;
}

#mz7828-sidebar * {
  box-sizing: border-box !important;
}

#mz7828-sidebar.mz-light {
  background: rgba(248, 250, 252, 0.98) !important;
  color: #0f172a !important;
  border-color: rgba(148, 163, 184, 0.55) !important;
}

#mz7828-sidebar.mz-open {
  transform: translateX(0) !important;
  backdrop-filter: blur(20px) !important;
  box-shadow: -20px 0 50px rgba(0, 0, 0, 0.65) !important;
}

#mz7828-sidebar.mz-light.mz-open {
  box-shadow: -16px 0 40px rgba(15, 23, 42, 0.22) !important;
}

/* Vertically Draggable Right-Edge Sliding Handle (قابل جابه‌جایی به بالا و پایین صفحه) */
#mz7828-handle {
  position: absolute !important;
  left: -66px !important;
  top: 50%;
  transform: translateY(-50%) !important;
  width: 66px !important;
  height: 84px !important;
  background: rgba(15, 23, 42, 0.94) !important;
  border: 1px solid rgba(255, 255, 255, 0.24) !important;
  border-right: none !important;
  border-radius: 20px 0 0 20px !important;
  box-shadow: -10px 6px 24px rgba(0, 0, 0, 0.48) !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 3px !important;
  cursor: grab !important;
  pointer-events: auto !important;
  user-select: none !important;
  touch-action: none !important;
  transition: background 0.25s ease, box-shadow 0.25s ease !important;
  z-index: 60 !important;
}

#mz7828-sidebar.mz-light #mz7828-handle {
  background: rgba(255, 255, 255, 0.96) !important;
  border-color: rgba(148, 163, 184, 0.6) !important;
  box-shadow: -8px 6px 20px rgba(15, 23, 42, 0.18) !important;
}

#mz7828-handle:hover {
  background: rgba(16, 185, 129, 0.26) !important;
}

#mz7828-handle.mz-dragging {
  cursor: grabbing !important;
  background: rgba(16, 185, 129, 0.38) !important;
  box-shadow: -12px 8px 28px rgba(16, 185, 129, 0.45) !important;
}

#mz7828-handle img {
  width: 44px !important;
  height: 44px !important;
  object-fit: contain !important;
  filter: drop-shadow(0 6px 14px rgba(239, 68, 68, 0.48)) !important;
  pointer-events: none !important;
}

#mz7828-handle span {
  font-family: 'B Homa', 'BHoma', 'Homa', 'HomaExt', 'Tahoma', sans-serif !important;
  font-size: 9.5px !important;
  font-weight: 700 !important;
  color: #34d399 !important;
  pointer-events: none !important;
}

#mz7828-sidebar.mz-light #mz7828-handle span {
  color: #059669 !important;
}

#mz7828-watermark {
  position: absolute !important;
  inset: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  opacity: 0.08 !important;
  pointer-events: none !important;
  z-index: 0 !important;
  overflow: hidden !important;
  border-radius: 24px 0 0 24px !important;
}

#mz7828-watermark img {
  width: 300px !important;
  height: 300px !important;
  object-fit: contain !important;
}

.mz-header {
  font-family: 'B Homa', 'BHoma', 'Homa', 'HomaExt', 'Tahoma', sans-serif !important;
  position: relative !important;
  z-index: 30 !important;
  padding: 10px 14px !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 8px !important;
}

#mz7828-sidebar.mz-light .mz-header {
  border-bottom-color: rgba(148, 163, 184, 0.35) !important;
}

.mz-datetime {
  display: flex !important;
  flex-direction: column !important;
  align-items: flex-start !important;
  line-height: 1.25 !important;
  flex-shrink: 0 !important;
}

.mz-time {
  font-size: 12px !important;
  font-weight: 800 !important;
  color: #10b981 !important;
}

.mz-date {
  font-size: 10px !important;
  color: #94a3b8 !important;
}

#mz7828-sidebar.mz-light .mz-date {
  color: #475569 !important;
}

.mz-title {
  font-family: 'B Homa', 'BHoma', 'Homa', 'HomaExt', 'Tahoma', sans-serif !important;
  font-size: 14.5px !important;
  font-weight: 700 !important;
  margin: 0 !important;
  text-align: center !important;
  flex: 1 !important;
  white-space: nowrap !important;
  color: inherit !important;
}

.mz-gear-btn {
  width: 32px !important;
  height: 32px !important;
  border-radius: 10px !important;
  border: 1px solid rgba(255, 255, 255, 0.18) !important;
  background: rgba(30, 41, 59, 0.85) !important;
  color: #e2e8f0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
  flex-shrink: 0 !important;
  font-size: 16px !important;
}

#mz7828-sidebar.mz-light .mz-gear-btn {
  background: #f1f5f9 !important;
  color: #0f172a !important;
  border-color: #cbd5e1 !important;
}

.mz-gear-btn:hover {
  border-color: #10b981 !important;
  color: #10b981 !important;
}

.mz-settings-pop {
  position: absolute !important;
  top: 50px !important;
  left: 12px !important;
  width: 255px !important;
  background: #0f172a !important;
  color: #f8fafc !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 16px !important;
  padding: 12px !important;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.75) !important;
  display: none !important;
  flex-direction: column !important;
  gap: 8px !important;
  z-index: 80 !important;
}

#mz7828-sidebar.mz-light .mz-settings-pop {
  background: #ffffff !important;
  color: #0f172a !important;
  border-color: #cbd5e1 !important;
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.22) !important;
}

.mz-settings-pop.mz-show {
  display: flex !important;
}

.mz-set-btn {
  padding: 7px 10px !important;
  border-radius: 10px !important;
  border: 1px solid rgba(148, 163, 184, 0.25) !important;
  background: #1e293b !important;
  color: #f8fafc !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  cursor: pointer !important;
  text-align: right !important;
}

#mz7828-sidebar.mz-light .mz-set-btn {
  background: #f1f5f9 !important;
  color: #0f172a !important;
}

.mz-set-btn:hover {
  border-color: #10b981 !important;
}

.mz-input {
  width: 100% !important;
  padding: 6px 8px !important;
  border-radius: 8px !important;
  border: 1px solid rgba(148, 163, 184, 0.3) !important;
  background: #020617 !important;
  color: #fff !important;
  font-size: 11px !important;
}

#mz7828-sidebar.mz-light .mz-input {
  background: #f8fafc !important;
  color: #0f172a !important;
}

.mz-orbit-stage {
  position: relative !important;
  z-index: 2 !important;
  flex: 1 !important;
  min-height: 420px !important;
  width: 100% !important;
  overflow: hidden !important;
}

.mz-center-logo {
  position: absolute !important;
  left: 50% !important;
  top: 50% !important;
  transform: translate(-50%, -50%) !important;
  width: 82px !important;
  height: 82px !important;
  z-index: 5 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.mz-center-logo img {
  width: 100% !important;
  height: 100% !important;
  object-fit: contain !important;
  filter: drop-shadow(0 12px 24px rgba(239, 68, 68, 0.45)) !important;
}

.mz-orbit-node {
  position: absolute !important;
  width: 138px !important;
  padding: 6.5px 8px !important;
  border-radius: 14px !important;
  text-decoration: none !important;
  color: #f8fafc !important;
  background: linear-gradient(145deg, rgba(30, 41, 59, 0.96), rgba(15, 23, 42, 0.99)) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.6), 0 3px 0 0 rgba(51, 65, 85, 1) !important;
  text-align: center !important;
  transform: translate(-50%, -50%) !important;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease, box-shadow 0.2s ease !important;
  z-index: 10 !important;
}

#mz7828-sidebar.mz-light .mz-orbit-node {
  background: linear-gradient(145deg, #ffffff, #f1f5f9) !important;
  color: #0f172a !important;
  border-color: #cbd5e1 !important;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12), 0 3px 0 0 #cbd5e1 !important;
}

.mz-orbit-node:hover {
  transform: translate(-50%, calc(-50% - 6px)) scale(1.09) perspective(400px) rotateX(8deg) !important;
  border-color: #10b981 !important;
  box-shadow: 0 16px 28px -6px rgba(16, 185, 129, 0.4), 0 4px 0 0 #10b981 !important;
  z-index: 25 !important;
}

.mz-node-badge {
  position: absolute !important;
  top: -6px !important;
  left: -6px !important;
  width: 18px !important;
  height: 18px !important;
  border-radius: 5px !important;
  background: #10b981 !important;
  color: #022c22 !important;
  font-size: 10px !important;
  font-weight: 800 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.mz-node-name {
  font-size: 11px !important;
  font-weight: 800 !important;
  line-height: 1.3 !important;
  white-space: nowrap !important;
}

.mz-node-sub {
  font-size: 8.8px !important;
  color: #94a3b8 !important;
  white-space: nowrap !important;
  margin-top: 2px !important;
}

#mz7828-sidebar.mz-light .mz-node-sub {
  color: #64748b !important;
}

.mz-cards-grid {
  display: grid !important;
  grid-template-columns: 1fr 1fr !important;
  gap: 10px !important;
  padding: 14px !important;
}

.mz-card-item {
  padding: 10px 12px !important;
  border-radius: 14px !important;
  text-decoration: none !important;
  color: inherit !important;
  background: rgba(30, 41, 59, 0.85) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 3px !important;
}

#mz7828-sidebar.mz-light .mz-card-item {
  background: #ffffff !important;
  border-color: #cbd5e1 !important;
}

.mz-footer {
  font-family: 'B Homa', 'BHoma', 'Homa', 'HomaExt', 'Tahoma', sans-serif !important;
  position: relative !important;
  z-index: 2 !important;
  padding: 9px 14px !important;
  border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
  background: rgba(2, 6, 23, 0.85) !important;
  text-align: center !important;
  font-size: 12px !important;
  color: #e2e8f0 !important;
  font-weight: 700 !important;
  border-radius: 0 0 0 24px !important;
}

#mz7828-sidebar.mz-light .mz-footer {
  background: rgba(255, 255, 255, 0.92) !important;
  color: #1e293b !important;
  border-top-color: #cbd5e1 !important;
}
`;
}

export function buildContentJs(sites: PortalSite[]): string {
  const sitesJson = JSON.stringify(sites);
  return `(function() {
  if (document.getElementById('mz7828-root')) return;

  let sites = ${sitesJson};
  try {
    const saved = localStorage.getItem('mz7828_ext_sites');
    if (saved) sites = JSON.parse(saved);
  } catch (e) {}

  let mode = 'orbital';
  let isLight = false;
  let handleTopPct = 50;
  try {
    const savedTop = localStorage.getItem('mz7828_handle_top_pct');
    if (savedTop && !isNaN(parseFloat(savedTop))) {
      handleTopPct = Math.min(90, Math.max(10, parseFloat(savedTop)));
    }
  } catch (e) {}

  const logoUrl = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL
    ? chrome.runtime.getURL('logo.png')
    : 'logo.png';

  const root = document.createElement('div');
  root.id = 'mz7828-root';

  const sidebar = document.createElement('div');
  sidebar.id = 'mz7828-sidebar';
  // Start closed on page load; only open when user clicks the handle!

  // Dragging state for moving the handle up & down the screen
  let isDragging = false;
  let dragStartY = 0;
  let dragMoved = false;

  function computePos(idx, total, rx, ry) {
    if (total === 9) {
      const layout = [
        [0, -1.0],
        [0.92, -0.66],
        [1.0, -0.11],
        [0.95, 0.44],
        [0.54, 0.96],
        [-0.54, 0.96],
        [-0.95, 0.44],
        [-1.0, -0.11],
        [-0.92, -0.66]
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

  function renderStage() {
    const stageEl = sidebar.querySelector('.mz-orbit-stage');
    if (!stageEl) return;

    if (mode === 'cards') {
      stageEl.innerHTML = '<div class="mz-cards-grid">' +
        sites.map((s, idx) =>
          '<a class="mz-card-item" href="' + s.url + '" target="_blank" rel="noopener noreferrer">' +
            '<div class="mz-node-name">' + (idx + 1) + '. ' + s.name + '</div>' +
            '<div class="mz-node-sub">' + s.subtitle + '</div>' +
          '</a>'
        ).join('') +
      '</div>';
      return;
    }

    const stageW = stageEl.clientWidth || 490;
    const stageH = stageEl.clientHeight || 430;
    const rx = Math.max(115, Math.min(152, Math.floor(stageW / 2) - 78));
    const ry = Math.max(135, Math.min(172, Math.floor(stageH / 2) - 32));

    const nodesHtml = sites.map((s, idx) => {
      const pos = computePos(idx, sites.length, rx, ry);
      return '<a class="mz-orbit-node" href="' + s.url + '" target="_blank" rel="noopener noreferrer" style="left: calc(50% + ' + pos.x + 'px); top: calc(50% + ' + pos.y + 'px);">' +
        '<div class="mz-node-badge">' + (idx + 1) + '</div>' +
        '<div class="mz-node-name">' + s.name + '</div>' +
        '<div class="mz-node-sub">' + s.subtitle + '</div>' +
      '</a>';
    }).join('');

    stageEl.innerHTML =
      '<div class="mz-center-logo"><img src="' + logoUrl + '" alt="Logo" /></div>' +
      nodesHtml;
  }

  sidebar.innerHTML =
    '<div id="mz7828-handle" style="top: ' + handleTopPct + '%;" title="نگه دارید و به بالا/پایین بکشید | فقط با کلیک باز و بسته می‌شود">' +
      '<img src="' + logoUrl + '" alt="Logo" />' +
      '<span id="mz-handle-text">سامانه‌ها</span>' +
    '</div>' +
    '<div id="mz7828-watermark"><img src="' + logoUrl + '" alt="" /></div>' +
    '<div class="mz-header">' +
      '<div class="mz-datetime">' +
        '<span class="mz-time" id="mz-clock">--:--</span>' +
        '<span class="mz-date" id="mz-date">----/--/--</span>' +
      '</div>' +
      '<h2 class="mz-title">${EXTENSION_TITLE}</h2>' +
      '<button type="button" class="mz-gear-btn" id="mz-gear-btn" title="تنظیمات">&#9881;</button>' +
      '<div class="mz-settings-pop" id="mz-settings-pop">' +
        '<button type="button" class="mz-set-btn" id="mz-theme-btn">تغییر تم (تیره / روشن)</button>' +
        '<button type="button" class="mz-set-btn" id="mz-mode-btn">تغییر نمایش (مداری / لیستی)</button>' +
        '<div style="border-top:1px solid rgba(148,163,184,0.2);padding-top:6px;margin-top:2px;">' +
          '<div style="font-size:10px;margin-bottom:4px;color:#10b981;font-weight:700;">افزودن کارت جدید:</div>' +
          '<input class="mz-input" id="mz-new-name" placeholder="نام سامانه" style="margin-bottom:4px;" />' +
          '<input class="mz-input" id="mz-new-url" placeholder="https://..." dir="ltr" style="margin-bottom:6px;" />' +
          '<button type="button" class="mz-set-btn" id="mz-add-btn" style="width:100%;background:#059669;color:#fff;text-align:center;">+ افزودن کارت</button>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="mz-orbit-stage"></div>' +
    '<div class="mz-footer">${FOOTER_CREDIT}</div>';

  root.appendChild(sidebar);
  (document.body || document.documentElement).appendChild(root);

  renderStage();
  window.addEventListener('resize', renderStage);

  // Load saved handle position from chrome.storage.local if available
  const handleEl = sidebar.querySelector('#mz7828-handle');
  const handleTextEl = sidebar.querySelector('#mz-handle-text');
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['mz7828_handle_top_pct'], function(res) {
      if (res && typeof res.mz7828_handle_top_pct === 'number' && handleEl) {
        handleTopPct = Math.min(90, Math.max(10, res.mz7828_handle_top_pct));
        handleEl.style.top = handleTopPct + '%';
      }
    });
  }

  // Wire vertical dragging (up and down the screen) + click-only toggle on #mz7828-handle
  if (handleEl) {
    handleEl.addEventListener('pointerdown', function(e) {
      if (e.button !== undefined && e.button !== 0) return;
      isDragging = true;
      dragStartY = e.clientY;
      dragMoved = false;
      handleEl.classList.add('mz-dragging');
      if (handleEl.setPointerCapture && e.pointerId !== undefined) {
        try { handleEl.setPointerCapture(e.pointerId); } catch (err) {}
      }
    });

    window.addEventListener('pointermove', function(e) {
      if (!isDragging) return;
      if (Math.abs(e.clientY - dragStartY) > 4) {
        dragMoved = true;
      }
      if (!dragMoved) return;

      const rect = sidebar.getBoundingClientRect();
      const relY = e.clientY - rect.top;
      handleTopPct = Math.min(90, Math.max(10, (relY / Math.max(1, rect.height)) * 100));
      handleEl.style.top = handleTopPct + '%';
    });

    const stopDragging = function(e) {
      if (!isDragging) return;
      isDragging = false;
      handleEl.classList.remove('mz-dragging');
      if (handleEl.releasePointerCapture && e && e.pointerId !== undefined) {
        try { handleEl.releasePointerCapture(e.pointerId); } catch (err) {}
      }
      if (dragMoved) {
        try { localStorage.setItem('mz7828_handle_top_pct', String(handleTopPct)); } catch (err) {}
        try {
          if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({ mz7828_handle_top_pct: handleTopPct });
          }
        } catch (err) {}
      }
    };

    window.addEventListener('pointerup', stopDragging);
    window.addEventListener('pointercancel', stopDragging);

    handleEl.addEventListener('click', function(e) {
      e.stopPropagation();
      // If user dragged the handle up/down, do not toggle sidebar open/close
      if (dragMoved) {
        dragMoved = false;
        return;
      }

      const willOpen = !sidebar.classList.contains('mz-open');
      sidebar.classList.toggle('mz-open', willOpen);
      if (handleTextEl) {
        handleTextEl.textContent = willOpen ? 'بستن' : 'سامانه‌ها';
      }
    });
  }

  // Wire gear settings menu
  const gearBtn = sidebar.querySelector('#mz-gear-btn');
  const settingsPop = sidebar.querySelector('#mz-settings-pop');
  if (gearBtn && settingsPop) {
    gearBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      settingsPop.classList.toggle('mz-show');
    });
  }

  const themeBtn = sidebar.querySelector('#mz-theme-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', function() {
      isLight = !isLight;
      sidebar.classList.toggle('mz-light', isLight);
    });
  }

  const modeBtn = sidebar.querySelector('#mz-mode-btn');
  if (modeBtn) {
    modeBtn.addEventListener('click', function() {
      mode = mode === 'orbital' ? 'cards' : 'orbital';
      renderStage();
    });
  }

  const addBtn = sidebar.querySelector('#mz-add-btn');
  if (addBtn) {
    addBtn.addEventListener('click', function() {
      const nameInp = sidebar.querySelector('#mz-new-name');
      const urlInp = sidebar.querySelector('#mz-new-url');
      const nameVal = nameInp ? nameInp.value.trim() : '';
      let urlVal = urlInp ? urlInp.value.trim() : '';
      if (!nameVal || !urlVal) return;
      if (!urlVal.startsWith('http')) urlVal = 'https://' + urlVal;
      sites.push({ name: nameVal, subtitle: 'سامانه سفارشی', url: urlVal });
      try { localStorage.setItem('mz7828_ext_sites', JSON.stringify(sites)); } catch(e) {}
      if (nameInp) nameInp.value = '';
      if (urlInp) urlInp.value = '';
      renderStage();
    });
  }

  // Live Persian Clock & Date in Header Right
  function updateClock() {
    const now = new Date();
    const clockEl = sidebar.querySelector('#mz-clock');
    const dateEl = sidebar.querySelector('#mz-date');
    if (clockEl) {
      clockEl.textContent = new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now);
    }
    if (dateEl) {
      dateEl.textContent = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
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
    const saved = localStorage.getItem('mz7828_ext_sites_v3');
    if (saved) sites = JSON.parse(saved);
  } catch (e) {}

  let displayMode = localStorage.getItem('mz7828_ext_mode') || 'orbital';
  let isLight = localStorage.getItem('mz7828_ext_light') === 'true';

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

  // Theme Toggle inside Gear Settings
  const themeBtn = document.getElementById('toggle-theme-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', function() {
      isLight = !isLight;
      document.body.classList.toggle('light-mode', isLight);
      try { localStorage.setItem('mz7828_ext_light', String(isLight)); } catch (e) {}
    });
  }

  // Display Mode Toggle (Orbital vs Grid Cards) inside Gear Settings
  const modeBtn = document.getElementById('toggle-mode-btn');
  const stageEl = document.getElementById('orbital-stage');
  if (modeBtn && stageEl) {
    if (displayMode === 'grid') {
      stageEl.classList.add('grid-mode');
    }
    modeBtn.addEventListener('click', function() {
      displayMode = displayMode === 'orbital' ? 'grid' : 'orbital';
      stageEl.classList.toggle('grid-mode', displayMode === 'grid');
      try { localStorage.setItem('mz7828_ext_mode', displayMode); } catch (e) {}
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
      try { localStorage.setItem('mz7828_ext_sites_v3', JSON.stringify(sites)); } catch (e) {}
      const a = document.createElement('a');
      a.className = 'node';
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.innerHTML = '<div class="node-badge">' + sites.length + '</div>' +
                    '<div class="node-title">' + name + '</div>' +
                    '<div class="node-sub">' + sub + '</div>';
      stageEl.appendChild(a);
      stageEl.classList.add('grid-mode');
      if (nameInput) nameInput.value = '';
      if (subInput) subInput.value = '';
      if (urlInput) urlInput.value = '';
    });
  }

  // Reset Default 9 Sites
  const resetBtn = document.getElementById('reset-cards-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      try {
        localStorage.removeItem('mz7828_ext_sites_v3');
        localStorage.removeItem('mz7828_ext_mode');
      } catch (e) {}
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
  logoSrc: string
): string {
  const radiusX = 152;
  const radiusY = 172;
  const svgW = 500;
  const svgH = 445;
  const cx = svgW / 2;
  const cy = svgH / 2;

  const svgLines = sites
    .map((_, i) => {
      const { x, y } = getOrbitalPosition(i, sites.length, radiusX, radiusY);
      return `<line x1="${cx}" y1="${cy}" x2="${cx + x}" y2="${cy + y}" stroke="rgba(255,255,255,0.11)" stroke-width="1.2" stroke-dasharray="4 4" />`;
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
      height: 540px;
      width: 500px;
      overflow: hidden;
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
      width: 300px;
      height: 300px;
      object-fit: contain;
    }
    header {
      font-family: 'B Homa', 'BHoma', 'Homa', 'HomaExt', 'Tahoma', sans-serif;
      position: relative;
      z-index: 40;
      padding: 9px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      background: rgba(15, 23, 42, 0.78);
      backdrop-filter: blur(14px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    }
    body.light-mode header {
      background: rgba(255, 255, 255, 0.88);
      border-bottom-color: rgba(148, 163, 184, 0.4);
    }
    .header-datetime {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      line-height: 1.25;
      flex-shrink: 0;
    }
    .header-time {
      font-size: 12px;
      font-weight: 800;
      color: #10b981;
      font-variant-numeric: tabular-nums;
    }
    .header-date {
      font-size: 10px;
      color: #cbd5e1;
      font-weight: 600;
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
      width: 32px;
      height: 32px;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.2);
      background: rgba(30, 41, 59, 0.9);
      color: #f8fafc;
      font-size: 16px;
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
    .settings-panel {
      position: absolute;
      top: calc(100% + 6px);
      left: 14px;
      width: 255px;
      background: rgba(15, 23, 42, 0.98);
      color: #f8fafc;
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 16px;
      padding: 12px;
      box-shadow: 0 20px 45px rgba(0,0,0,0.7);
      display: none;
      flex-direction: column;
      gap: 8px;
      z-index: 100;
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
      padding: 7px 10px;
      border-radius: 10px;
      border: 1px solid rgba(148,163,184,0.25);
      background: rgba(30, 41, 59, 0.8);
      color: inherit;
      font-size: 11px;
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
      height: 100%;
    }
    .stage.grid-mode {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      padding: 14px 18px;
      align-content: center;
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
      width: 82px;
      height: 82px;
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
      width: 138px;
      padding: 6.5px 8px;
      border-radius: 14px;
      text-decoration: none;
      color: #f8fafc;
      background: linear-gradient(145deg, rgba(30, 41, 59, 0.96), rgba(15, 23, 42, 0.99));
      border: 1px solid rgba(255,255,255,0.2);
      box-shadow: 0 11px 22px -6px rgba(0,0,0,0.65), 0 3.5px 0 0 rgba(51,65,85,1);
      text-align: center;
      transform: translate(-50%, -50%);
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, border-color 0.2s ease;
      z-index: 15;
    }
    body.light-mode .node {
      background: linear-gradient(145deg, #ffffff, #f1f5f9);
      color: #0f172a;
      border-color: #cbd5e1;
      box-shadow: 0 9px 18px -6px rgba(15,23,42,0.15), 0 3.5px 0 0 #cbd5e1;
    }
    .node:hover {
      transform: translate(-50%, calc(-50% - 6px)) scale(1.08) perspective(500px) rotateX(7deg);
      border-color: #10b981;
      box-shadow: 0 16px 30px -6px rgba(16, 185, 129, 0.45), 0 4px 0 0 #10b981;
      z-index: 30;
    }
    .node-badge {
      position: absolute;
      top: -6px;
      left: -6px;
      width: 18px;
      height: 18px;
      border-radius: 5px;
      background: #10b981;
      color: #022c22;
      font-size: 10px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    }
    .node-title {
      font-size: 11px;
      font-weight: 800;
      margin-bottom: 2px;
      white-space: nowrap;
    }
    .node-sub {
      font-size: 8.8px;
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
      padding: 8px 14px;
      text-align: center;
      font-size: 12px;
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
    <div class="header-datetime">
      <span class="header-time" id="ext-time">۱۲:۰۰:۰۰</span>
      <span class="header-date" id="ext-date">۱۴۰۵/۰۷/۲۸</span>
    </div>
    <h1>${EXTENSION_TITLE}</h1>
    <button type="button" class="gear-btn" id="gear-btn" title="تنظیمات افزونه">&#9881;</button>
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
      <ellipse cx="${cx}" cy="${cy}" rx="${radiusX}" ry="${radiusY}" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" stroke-dasharray="6 6" />
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
