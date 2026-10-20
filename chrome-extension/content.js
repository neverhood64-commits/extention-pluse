(function() {
  if (document.getElementById('mz7828-root')) return;

  let sites = [{"id":"site-1","name":"سامانه جامع","subtitle":"پورتال سازمان بهزیستی کشور","url":"https://swo.behzisti.ir/","category":"پورتال‌های اصلی","iconName":"Building2","accentColor":"emerald","shortcutKey":1},{"id":"site-2","name":"سامانه لایف پلاس","subtitle":"مدیریت پرونده مراکز مثبت زندگی","url":"https://lifeplus.behzisti.net/","category":"خدمات الکترونیک","iconName":"HeartHandshake","accentColor":"rose","shortcutKey":2},{"id":"site-3","name":"سامانه ارمغان","subtitle":"درگاه یکپارچه خدمات بهزیستی","url":"https://ui.behzisti.net/#/login","category":"خدمات الکترونیک","iconName":"Sparkles","accentColor":"teal","shortcutKey":3},{"id":"site-4","name":"سامانه اشتغال","subtitle":"رصد و پیگیری تسهیلات اشتغال","url":"https://job.behzisti.net/account/login","category":"پورتال‌های اصلی","iconName":"Briefcase","accentColor":"sky","shortcutKey":4},{"id":"site-5","name":"استعلام دهک بندی","subtitle":"سامانه سام و دهک معیشتی","url":"https://sam.behzisti.net/Account/Login?ReturnUrl=%2F","category":"استعلام و پایش","iconName":"FileSearch","accentColor":"amber","shortcutKey":5},{"id":"site-6","name":"سامانه تیکتینگ","subtitle":"پشتیبانی و اتوماسیون فنی","url":"https://ticketing.behzisti.gov.ir/Dana/Shared/Public/SignIn.aspx#signIn","category":"پشتیبانی و مشاوره","iconName":"TicketCheck","accentColor":"indigo","shortcutKey":6},{"id":"site-7","name":"سامانه سما کارت","subtitle":"مدیریت کارت و خدمات رفاهی","url":"https://eservices.top.ir/login","category":"امور مالی و بانکی","iconName":"CreditCard","accentColor":"emerald","shortcutKey":7},{"id":"site-8","name":"دریافت شماره شبا","subtitle":"استعلام شبا بانک رفاه کارگران","url":"https://gsh.rb24.ir/sheba_new.aspx","category":"امور مالی و بانکی","iconName":"Landmark","accentColor":"rose","shortcutKey":8},{"id":"site-9","name":"سامانه صدای مشاور","subtitle":"ارتباط با مددجویان و مشاوره","url":"https://crm.behzisti.ir/","category":"پشتیبانی و مشاوره","iconName":"Headset","accentColor":"teal","shortcutKey":9}];
  try {
    const saved = localStorage.getItem('mz7828_ext_sites');
    if (saved) sites = JSON.parse(saved);
  } catch (e) {}

  let mode = 'orbital';
  let isLight = false;

  const logoUrl = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL
    ? chrome.runtime.getURL('logo.png')
    : 'logo.png';

  const root = document.createElement('div');
  root.id = 'mz7828-root';

  const sidebar = document.createElement('div');
  sidebar.id = 'mz7828-sidebar';
  // Open immediately on the right side when injected!
  sidebar.classList.add('mz-open');

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
    }, 400);
  };

  sidebar.addEventListener('mouseenter', openSidebar);
  sidebar.addEventListener('mouseleave', scheduleClose);

  function computePos(idx, total, rx, ry) {
    if (total === 9) {
      const layout = [
        [0, -1.0],
        [0.86, -0.66],
        [1.02, -0.12],
        [0.95, 0.45],
        [0.56, 0.96],
        [-0.56, 0.96],
        [-0.95, 0.45],
        [-1.02, -0.12],
        [-0.86, -0.66]
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

    const rx = 152;
    const ry = 172;
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
    '<div id="mz7828-handle" title="باز و بسته کردن کشویی افزونه">' +
      '<img src="' + logoUrl + '" alt="Logo" />' +
      '<span>سامانه‌ها</span>' +
    '</div>' +
    '<div id="mz7828-watermark"><img src="' + logoUrl + '" alt="" /></div>' +
    '<div class="mz-header">' +
      '<div class="mz-datetime">' +
        '<span class="mz-time" id="mz-clock">--:--</span>' +
        '<span class="mz-date" id="mz-date">----/--/--</span>' +
      '</div>' +
      '<h2 class="mz-title">افزونه سامانه های اداری مراکز مثبت زندگی</h2>' +
      '<button type="button" class="mz-gear-btn" id="mz-gear-btn" title="تنظیمات">&#9881;</button>' +
      '<div class="mz-settings-pop" id="mz-settings-pop">' +
        '<button type="button" class="mz-set-btn" id="mz-theme-btn">تغییر تم (تیره / روشن)</button>' +
        '<button type="button" class="mz-set-btn" id="mz-mode-btn">تغییر نمایش (مداری / لیستی)</button>' +
        '<div style="border-top:1px solid rgba(255,255,255,0.12);padding-top:6px;margin-top:2px;">' +
          '<div style="font-size:10px;margin-bottom:4px;color:#94a3b8;">افزودن کارت جدید:</div>' +
          '<input class="mz-input" id="mz-new-name" placeholder="نام سامانه" style="margin-bottom:4px;" />' +
          '<input class="mz-input" id="mz-new-url" placeholder="https://..." dir="ltr" style="margin-bottom:6px;" />' +
          '<button type="button" class="mz-set-btn" id="mz-add-btn" style="width:100%;background:#059669;text-align:center;">+ افزودن کارت</button>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="mz-orbit-stage"></div>' +
    '<div class="mz-footer">طرح و ایده مهدی افشار مرکز مثبت زندگی 7828 سیرجان</div>';

  root.appendChild(sidebar);
  document.body.appendChild(root);

  renderStage();

  // Wire handle click
  const handleEl = sidebar.querySelector('#mz7828-handle');
  if (handleEl) {
    handleEl.addEventListener('click', function() {
      const isOpen = sidebar.classList.contains('mz-open');
      if (isOpen) {
        isPinned = false;
        sidebar.classList.remove('mz-open');
      } else {
        isPinned = true;
        sidebar.classList.add('mz-open');
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
