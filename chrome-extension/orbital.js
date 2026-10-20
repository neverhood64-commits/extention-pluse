(function() {
  const defaultSites = [{"id":"site-1","name":"سامانه جامع","subtitle":"پورتال سازمان بهزیستی کشور","url":"https://swo.behzisti.ir/","category":"پورتال‌های اصلی","iconName":"Building2","accentColor":"emerald","shortcutKey":1},{"id":"site-2","name":"سامانه لایف پلاس","subtitle":"مدیریت پرونده مراکز مثبت زندگی","url":"https://lifeplus.behzisti.net/","category":"خدمات الکترونیک","iconName":"HeartHandshake","accentColor":"rose","shortcutKey":2},{"id":"site-3","name":"سامانه ارمغان","subtitle":"درگاه یکپارچه خدمات بهزیستی","url":"https://ui.behzisti.net/#/login","category":"خدمات الکترونیک","iconName":"Sparkles","accentColor":"teal","shortcutKey":3},{"id":"site-4","name":"سامانه اشتغال","subtitle":"رصد و پیگیری تسهیلات اشتغال","url":"https://job.behzisti.net/account/login","category":"پورتال‌های اصلی","iconName":"Briefcase","accentColor":"sky","shortcutKey":4},{"id":"site-5","name":"استعلام دهک بندی","subtitle":"سامانه سام و دهک معیشتی","url":"https://sam.behzisti.net/Account/Login?ReturnUrl=%2F","category":"استعلام و پایش","iconName":"FileSearch","accentColor":"amber","shortcutKey":5},{"id":"site-6","name":"سامانه تیکتینگ","subtitle":"پشتیبانی و اتوماسیون فنی","url":"https://ticketing.behzisti.gov.ir/Dana/Shared/Public/SignIn.aspx#signIn","category":"پشتیبانی و مشاوره","iconName":"TicketCheck","accentColor":"indigo","shortcutKey":6},{"id":"site-7","name":"سامانه سما کارت","subtitle":"مدیریت کارت و خدمات رفاهی","url":"https://eservices.top.ir/login","category":"امور مالی و بانکی","iconName":"CreditCard","accentColor":"emerald","shortcutKey":7},{"id":"site-8","name":"دریافت شماره شبا","subtitle":"استعلام شبا بانک رفاه کارگران","url":"https://gsh.rb24.ir/sheba_new.aspx","category":"امور مالی و بانکی","iconName":"Landmark","accentColor":"rose","shortcutKey":8},{"id":"site-9","name":"سامانه صدای مشاور","subtitle":"ارتباط با مددجویان و مشاوره","url":"https://crm.behzisti.ir/","category":"پشتیبانی و مشاوره","iconName":"Headset","accentColor":"teal","shortcutKey":9}];
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
        weekday: 'short',
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
      node.style.transform = 'translate(-50%, calc(-50% - 7px)) scale(1.09) perspective(550px) rotateX(' + rx.toFixed(1) + 'deg) rotateY(' + ry.toFixed(1) + 'deg)';
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
