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

export const DEFAULT_PORTAL_SITES: PortalSite[] = [
  {
    id: 'site-1',
    name: 'سامانه جامع',
    subtitle: 'پورتال جامع سازمان بهزیستی کشور',
    url: 'https://swo.behzisti.ir/',
    category: 'پورتال‌های اصلی',
    iconName: 'Building2',
    accentColor: 'emerald',
    shortcutKey: 1,
  },
  {
    id: 'site-2',
    name: 'سامانه لایف پلاس',
    subtitle: 'مدیریت پرونده و خدمات مراکز مثبت زندگی',
    url: 'https://lifeplus.behzisti.net/',
    category: 'خدمات الکترونیک',
    iconName: 'HeartHandshake',
    accentColor: 'rose',
    shortcutKey: 2,
  },
  {
    id: 'site-3',
    name: 'سامانه ارمغان',
    subtitle: 'درگاه یکپارچه خدمات بهزیستی',
    url: 'https://ui.behzisti.net/#/login',
    category: 'خدمات الکترونیک',
    iconName: 'Sparkles',
    accentColor: 'teal',
    shortcutKey: 3,
  },
  {
    id: 'site-4',
    name: 'سامانه اشتغال',
    subtitle: 'رصد، ثبت و پیگیری تسهیلات اشتغال',
    url: 'https://job.behzisti.net/account/login',
    category: 'پورتال‌های اصلی',
    iconName: 'Briefcase',
    accentColor: 'sky',
    shortcutKey: 4,
  },
  {
    id: 'site-5',
    name: 'استعلام دهک بندی',
    subtitle: 'سامانه سام و بررسی وضعیت دهک معیشتی',
    url: 'https://sam.behzisti.net/Account/Login?ReturnUrl=%2F',
    category: 'استعلام و پایش',
    iconName: 'FileSearch',
    accentColor: 'amber',
    shortcutKey: 5,
  },
  {
    id: 'site-6',
    name: 'سامانه تیکتینگ',
    subtitle: 'ثبت درخواست پشتیبانی و اتوماسیون فنی',
    url: 'https://ticketing.behzisti.gov.ir/Dana/Shared/Public/SignIn.aspx#signIn',
    category: 'پشتیبانی و مشاوره',
    iconName: 'TicketCheck',
    accentColor: 'indigo',
    shortcutKey: 6,
  },
  {
    id: 'site-7',
    name: 'سامانه سما کارت',
    subtitle: 'مدیریت کارت و خدمات رفاهی تاپ',
    url: 'https://eservices.top.ir/login',
    category: 'امور مالی و بانکی',
    iconName: 'CreditCard',
    accentColor: 'emerald',
    shortcutKey: 7,
  },
  {
    id: 'site-8',
    name: 'دریافت شماره شبا',
    subtitle: 'محاسبه و استعلام شبا بانک رفاه کارگران',
    url: 'https://gsh.rb24.ir/sheba_new.aspx',
    category: 'امور مالی و بانکی',
    iconName: 'Landmark',
    accentColor: 'rose',
    shortcutKey: 8,
  },
  {
    id: 'site-9',
    name: 'سامانه صدای مشاور',
    subtitle: 'مدیریت ارتباط با مددجویان و مشاوره CRM',
    url: 'https://crm.behzisti.ir/',
    category: 'پشتیبانی و مشاوره',
    iconName: 'Headset',
    accentColor: 'teal',
    shortcutKey: 9,
  },
];
