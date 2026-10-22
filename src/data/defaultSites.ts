export interface PortalSite {
  id: string;
  name: string;
  subtitle: string;
  url: string;
  category: 'پورتال‌های اصلی' | 'خدمات الکترونیک' | 'استعلام و پایش' | 'امور مالی و بانکی' | 'پشتیبانی و مشاوره';
  iconName: string;
  accentColor: 'emerald' | 'rose' | 'amber' | 'sky' | 'indigo' | 'teal';
  shortcutKey: number;
}

export const LOGO_ASSET_PATH = '/assets/aistudio/ChatGPT_Image_Sep_5__2026__10_08_04_PM_710bedc2.png';

export const EXTENSION_TITLE = 'افزونه سامانه های اداری مراکز مثبت زندگی';
export const FOOTER_CREDIT = 'طرح و ایده مهدی افشار مرکز مثبت زندگی 7828 سیرجان';

/**
 * Computes well-spaced orbital coordinates around (0,0) so that all 9 cards
 * fit inside a single compact view with zero horizontal or vertical clipping.
 */
export function getOrbitalPosition(
  index: number,
  total: number,
  radiusX: number,
  radiusY: number
): { x: number; y: number } {
  if (total === 9) {
    const ninePointLayout: Array<[number, number]> = [
      [0, -1.0],      // 1. سامانه جامع (بالا وسط)
      [0.92, -0.66],  // 2. سامانه لایف پلاس (بالا راست)
      [1.0, -0.11],   // 3. سامانه ارمغان (میانه راست بالا)
      [0.95, 0.44],   // 4. سامانه اشتغال (میانه راست پایین)
      [0.54, 0.96],   // 5. استعلام دهک بندی (پایین راست)
      [-0.54, 0.96],  // 6. سامانه تیکتینگ (پایین چپ)
      [-0.95, 0.44],  // 7. سامانه سما کارت (میانه چپ پایین)
      [-1.0, -0.11],  // 8. دریافت شماره شبا (میانه چپ بالا)
      [-0.92, -0.66], // 9. سامانه صدای مشاور (بالا چپ)
    ];
    const [nx, ny] = ninePointLayout[index];
    return {
      x: Math.round(nx * radiusX),
      y: Math.round(ny * radiusY),
    };
  }

  const angle = (index / Math.max(1, total)) * (2 * Math.PI) - Math.PI / 2;
  return {
    x: Math.round(Math.cos(angle) * radiusX),
    y: Math.round(Math.sin(angle) * radiusY),
  };
}

export const DEFAULT_PORTAL_SITES: PortalSite[] = [
  {
    id: 'site-1',
    name: 'سامانه جامع',
    subtitle: 'پورتال سازمان بهزیستی',
    url: 'https://swo.behzisti.ir/',
    category: 'پورتال‌های اصلی',
    iconName: 'Building2',
    accentColor: 'emerald',
    shortcutKey: 1,
  },
  {
    id: 'site-2',
    name: 'سامانه لایف پلاس',
    subtitle: 'خدمات مراکز مثبت زندگی',
    url: 'https://lifeplus.behzisti.net/',
    category: 'خدمات الکترونیک',
    iconName: 'HeartHandshake',
    accentColor: 'rose',
    shortcutKey: 2,
  },
  {
    id: 'site-3',
    name: 'سامانه ارمغان',
    subtitle: 'درگاه خدمات بهزیستی',
    url: 'https://ui.behzisti.net/#/login',
    category: 'خدمات الکترونیک',
    iconName: 'Sparkles',
    accentColor: 'teal',
    shortcutKey: 3,
  },
  {
    id: 'site-4',
    name: 'سامانه اشتغال',
    subtitle: 'پیگیری تسهیلات اشتغال',
    url: 'https://job.behzisti.net/account/login',
    category: 'پورتال‌های اصلی',
    iconName: 'Briefcase',
    accentColor: 'sky',
    shortcutKey: 4,
  },
  {
    id: 'site-5',
    name: 'استعلام دهک بندی',
    subtitle: 'سامانه سام و دهک معیشتی',
    url: 'https://sam.behzisti.net/Account/Login?ReturnUrl=%2F',
    category: 'استعلام و پایش',
    iconName: 'FileSearch',
    accentColor: 'amber',
    shortcutKey: 5,
  },
  {
    id: 'site-6',
    name: 'سامانه تیکتینگ',
    subtitle: 'پشتیبانی و اتوماسیون',
    url: 'https://ticketing.behzisti.gov.ir/Dana/Shared/Public/SignIn.aspx#signIn',
    category: 'پشتیبانی و مشاوره',
    iconName: 'TicketCheck',
    accentColor: 'indigo',
    shortcutKey: 6,
  },
  {
    id: 'site-7',
    name: 'سامانه سما کارت',
    subtitle: 'کارت و خدمات رفاهی تاپ',
    url: 'https://eservices.top.ir/login',
    category: 'امور مالی و بانکی',
    iconName: 'CreditCard',
    accentColor: 'emerald',
    shortcutKey: 7,
  },
  {
    id: 'site-8',
    name: 'دریافت شماره شبا',
    subtitle: 'استعلام شبا بانک رفاه',
    url: 'https://gsh.rb24.ir/sheba_new.aspx',
    category: 'امور مالی و بانکی',
    iconName: 'Landmark',
    accentColor: 'rose',
    shortcutKey: 8,
  },
  {
    id: 'site-9',
    name: 'سامانه صدای مشاور',
    subtitle: 'ارتباط و مشاوره مددجویان',
    url: 'https://crm.behzisti.ir/',
    category: 'پشتیبانی و مشاوره',
    iconName: 'Headset',
    accentColor: 'teal',
    shortcutKey: 9,
  },
];
