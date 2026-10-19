import JSZip from 'jszip';
import { PortalSite, LOGO_ASSET_PATH, EXTENSION_TITLE, FOOTER_CREDIT } from '../data/defaultSites';
import { getTransparentLogoDataUrl } from '../utils/logoProcessor';

export async function generateChromeExtensionZip(sites: PortalSite[]): Promise<Blob> {
  const zip = new JSZip();

  // Bundle the borderless transparent logo inside the extension as logo.png
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

  // 1. manifest.json (Manifest V3)
  const manifest = {
    manifest_version: 3,
    name: EXTENSION_TITLE,
    short_name: 'مثبت زندگی ۷۸۲۸',
    version: '1.3.0',
    description: `${EXTENSION_TITLE} — ${FOOTER_CREDIT}`,
    icons: {
      '16': 'logo.png',
      '48': 'logo.png',
      '128': 'logo.png',
    },
    action: {
      default_title: EXTENSION_TITLE,
      default_popup: 'popup.html',
      default_icon: 'logo.png',
    },
    chrome_url_overrides: {
      newtab: 'newtab.html',
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
        resources: ['logo.png'],
        matches: ['<all_urls>'],
      },
    ],
  };

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  // 2. content.css (Right-side pure borderless logo + slide-out sidebar on all Chrome pages)
  const contentCss = `
/* ${EXTENSION_TITLE} - ${FOOTER_CREDIT} */
#mz7828-root {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 2147483646;
  font-family: 'Tahoma', 'Vazirmatn', system-ui, sans-serif;
  direction: rtl;
  pointer-events: none;
}

#mz7828-bubble-dock {
  position: fixed;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  width: 64px;
  height: 64px;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: auto;
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 2147483647;
}

#mz7828-bubble-dock:hover {
  transform: translateY(-50%) scale(1.16) translateX(-6px);
}

#mz7828-bubble-dock img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 12px 22px rgba(239, 68, 68, 0.42));
  pointer-events: none;
}

#mz7828-sidebar {
  position: fixed;
  top: 12px;
  bottom: 12px;
  right: 0;
  width: 380px;
  max-width: 92vw;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(20px);
  border-left: 1px solid rgba(255,255,255,0.18);
  border-top: 1px solid rgba(255,255,255,0.14);
  border-bottom: 1px solid rgba(255,255,255,0.14);
  border-radius: 24px 0 0 24px;
  box-shadow: -20px 0 50px rgba(0, 0, 0, 0.55);
  transform: translateX(105%);
  transition: transform 0.34s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #f8fafc;
}

#mz7828-sidebar.mz-open {
  transform: translateX(0);
}

#mz7828-watermark {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.09;
  pointer-events: none;
  z-index: 0;
}

#mz7828-watermark img {
  width: 280px;
  height: 280px;
  object-fit: contain;
  filter: blur(1px);
}

.mz-header {
  position: relative;
  z-index: 2;
  padding: 16px 18px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
}

.mz-center-bubble {
  width: 76px;
  height: 76px;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mz-center-bubble img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 10px 20px rgba(239, 68, 68, 0.4));
}

.mz-title {
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
}

.mz-list {
  position: relative;
  z-index: 2;
  flex: 1;
  overflow-y: auto;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mz-btn-3d {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 14px;
  border-radius: 14px;
  text-decoration: none;
  color: #f8fafc;
  background: linear-gradient(145deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.96));
  border: 1px solid rgba(255,255,255,0.14);
  box-shadow: 0 8px 18px -6px rgba(0,0,0,0.5), 0 3px 0 0 rgba(51,65,85,0.9);
  transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s ease, border-color 0.18s ease;
}

.mz-btn-3d:hover {
  transform: translateY(-4px) scale(1.02) perspective(500px) rotateX(4deg);
  border-color: rgba(16, 185, 129, 0.65);
  box-shadow: 0 14px 26px -6px rgba(16, 185, 129, 0.32), 0 4px 0 0 rgba(16, 185, 129, 0.55);
}

.mz-btn-name {
  font-size: 13px;
  font-weight: 700;
  color: #f8fafc;
}

.mz-btn-sub {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

.mz-badge {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: rgba(16, 185, 129, 0.18);
  color: #34d399;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mz-footer {
  position: relative;
  z-index: 2;
  padding: 10px 14px;
  border-top: 1px solid rgba(255,255,255,0.1);
  background: rgba(2, 6, 23, 0.75);
  text-align: center;
  font-size: 11px;
  color: #cbd5e1;
  font-weight: 600;
}
`;

  zip.file('content.css', contentCss);

  // 3. content.js
  const sitesJson = JSON.stringify(sites);
  const contentJs = `
(function() {
  if (document.getElementById('mz7828-root')) return;

  const sites = ${sitesJson};
  const logoUrl = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL
    ? chrome.runtime.getURL('logo.png')
    : '${logoBase64}';

  const root = document.createElement('div');
  root.id = 'mz7828-root';

  const bubble = document.createElement('div');
  bubble.id = 'mz7828-bubble-dock';
  bubble.title = '${EXTENSION_TITLE}';
  bubble.innerHTML = '<img src="' + logoUrl + '" alt="Logo" />';

  const sidebar = document.createElement('div');
  sidebar.id = 'mz7828-sidebar';

  let isPinned = false;
  let closeTimer = null;

  const openSidebar = () => {
    if (closeTimer) clearTimeout(closeTimer);
    sidebar.classList.add('mz-open');
  };

  const scheduleClose = () => {
    if (isPinned) return;
    closeTimer = setTimeout(() => {
      sidebar.classList.remove('mz-open');
    }, 320);
  };

  bubble.addEventListener('mouseenter', openSidebar);
  bubble.addEventListener('click', () => {
    isPinned = !isPinned;
    if (isPinned) {
      openSidebar();
    } else {
      sidebar.classList.remove('mz-open');
    }
  });

  sidebar.addEventListener('mouseenter', () => {
    if (closeTimer) clearTimeout(closeTimer);
  });
  sidebar.addEventListener('mouseleave', scheduleClose);

  const buttonsHtml = sites.map((s, idx) => \`
    <a class="mz-btn-3d" href="\${s.url}" target="_blank" rel="noopener noreferrer">
      <div>
        <div class="mz-btn-name">\${s.name}</div>
        <div class="mz-btn-sub">\${s.subtitle}</div>
      </div>
      <div class="mz-badge">\${idx + 1}</div>
    </a>
  \`).join('');

  sidebar.innerHTML = \`
    <div id="mz7828-watermark"><img src="\${logoUrl}" alt="" /></div>
    <div class="mz-header">
      <div class="mz-center-bubble"><img src="\${logoUrl}" alt="Logo" /></div>
      <h2 class="mz-title">${EXTENSION_TITLE}</h2>
    </div>
    <div class="mz-list">\${buttonsHtml}</div>
    <div class="mz-footer">${FOOTER_CREDIT}</div>
  \`;

  root.appendChild(bubble);
  root.appendChild(sidebar);
  document.body.appendChild(root);
})();
`;

  zip.file('content.js', contentJs);

  // 4. newtab.html & popup.html
  const newtabHtml = createStandaloneOrbitalHtml(sites, logoBase64 || 'logo.png', false);
  const popupHtml = createStandaloneOrbitalHtml(sites, logoBase64 || 'logo.png', true);

  zip.file('newtab.html', newtabHtml);
  zip.file('popup.html', popupHtml);

  // 5. Persian installation guide
  const readmeText = `============================================================
راهنمای نصب «${EXTENSION_TITLE}» در گوگل کروم
${FOOTER_CREDIT}
============================================================

مراحل نصب در مرورگر Google Chrome:
1. ابتدا فایل زیپ دانلود شده را در یک پوشه روی کامپیوتر خود از حالت فشرده خارج کنید (Extract).
2. در مرورگر گوگل کروم، عبارت زیر را در نوار آدرس تایپ کرده و Enter بزنید:
   chrome://extensions
3. در گوشه بالا سمت راست (یا چپ) صفحه، گزینه «Developer mode» (حالت توسعه‌دهنده) را فعال کنید.
4. روی دکمه «Load unpacked» (بارگذاری بازشده) کلیک کنید.
5. پوشه‌ای که در مرحله ۱ استخراج کردید را انتخاب نمایید.
`;

  zip.file('README-INSTALL.txt', readmeText);

  return await zip.generateAsync({ type: 'blob' });
}

function createStandaloneOrbitalHtml(sites: PortalSite[], logoSrc: string, isPopup: boolean): string {
  const sitesData = JSON.stringify(sites);
  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>${EXTENSION_TITLE}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Vazirmatn', 'Tahoma', system-ui, sans-serif;
      background: radial-gradient(circle at 50% 45%, #1e293b 0%, #090d16 100%);
      color: #f8fafc;
      min-height: ${isPopup ? '560px' : '100vh'};
      width: ${isPopup ? '420px' : '100vw'};
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
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
      width: ${isPopup ? '280px' : '500px'};
      height: ${isPopup ? '280px' : '500px'};
      object-fit: contain;
    }
    header {
      position: relative;
      z-index: 10;
      padding: 16px 24px;
      text-align: center;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    header h1 {
      font-size: ${isPopup ? '15px' : '20px'};
      font-weight: 800;
      color: #f8fafc;
    }
    .stage {
      position: relative;
      z-index: 5;
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .center-bubble {
      width: ${isPopup ? '92px' : '145px'};
      height: ${isPopup ? '92px' : '145px'};
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 6;
      animation: float 4s ease-in-out infinite;
    }
    .center-bubble img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      filter: drop-shadow(0 16px 28px rgba(239, 68, 68, 0.42));
    }
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-8px); }
    }
    .node {
      position: absolute;
      width: ${isPopup ? '122px' : '185px'};
      padding: ${isPopup ? '8px 10px' : '12px 16px'};
      border-radius: 16px;
      text-decoration: none;
      color: #f8fafc;
      background: linear-gradient(145deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.96));
      border: 1px solid rgba(255,255,255,0.18);
      box-shadow: 0 12px 24px -6px rgba(0,0,0,0.6), 0 4px 0 0 rgba(51,65,85,1);
      text-align: center;
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, border-color 0.2s ease;
    }
    .node:hover {
      border-color: #10b981;
      box-shadow: 0 18px 34px -6px rgba(16, 185, 129, 0.4), 0 6px 0 0 #10b981;
      z-index: 20;
    }
    .node-title {
      font-size: ${isPopup ? '11px' : '14px'};
      font-weight: 700;
      margin-bottom: 3px;
    }
    .node-sub {
      font-size: ${isPopup ? '9px' : '11px'};
      color: #94a3b8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    footer {
      position: relative;
      z-index: 10;
      padding: 10px 20px;
      text-align: center;
      font-size: 12px;
      font-weight: 600;
      color: #cbd5e1;
      background: rgba(2, 6, 23, 0.8);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
  </style>
</head>
<body>
  <div class="bg-watermark"><img src="${logoSrc}" alt="" /></div>
  <header>
    <h1>${EXTENSION_TITLE}</h1>
  </header>
  <div class="stage" id="orbital-stage">
    <div class="center-bubble"><img src="${logoSrc}" alt="Logo" /></div>
  </div>
  <footer>${FOOTER_CREDIT}</footer>
  <script>
    const sites = ${sitesData};
    const stage = document.getElementById('orbital-stage');
    const radiusX = ${isPopup ? 138 : 290};
    const radiusY = ${isPopup ? 175 : 225};
    sites.forEach((site, i) => {
      const angle = (i / sites.length) * (2 * Math.PI) - Math.PI / 2;
      const x = Math.cos(angle) * radiusX;
      const y = Math.sin(angle) * radiusY;
      const a = document.createElement('a');
      a.className = 'node';
      a.href = site.url;
      a.target = '_blank';
      a.style.transform = \`translate(\${x}px, \${y}px)\`;
      a.addEventListener('mouseenter', () => {
        a.style.transform = \`translate(\${x}px, \${y - 8}px) scale(1.09) perspective(500px) rotateX(6deg)\`;
      });
      a.addEventListener('mouseleave', () => {
        a.style.transform = \`translate(\${x}px, \${y}px)\`;
      });
      a.innerHTML = \`
        <div class="node-title">\${site.name}</div>
        <div class="node-sub">\${site.subtitle}</div>
      \`;
      stage.appendChild(a);
    });
  </script>
</body>
</html>`;
}
