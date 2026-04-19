'use client';

import { useState, useEffect } from 'react';
import { FaTelegram, FaDiscord, FaYoutube, FaVk } from 'react-icons/fa';
import { useLanguage } from '../i18n/LanguageContext';
import { usePathname } from 'next/navigation';
import LanguageSwitcherWrapper from './LanguageSwitcherWrapper';

export default function Footer() {
  const { t, language } = useLanguage();
  const pathname = usePathname();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  // Определяем язык на основе URL для избежания проблем с гидратацией
  const getLanguageFromPath = () => {
    if (pathname?.startsWith('/ru')) return 'ru';
    if (pathname?.startsWith('/en')) return 'en';
    return 'en'; // по умолчанию английский
  };

  const currentLanguage = getLanguageFromPath();

  const footerSections = [
    {
      titleKey: 'footer.navigation.title',
      links: [
        { key: 'footer.navigation.catalog', href: `/${currentLanguage}/catalog` },
        { key: 'footer.navigation.faqHelp', href: `/${currentLanguage}/faq` },
        { key: 'footer.navigation.reviews', href: 'https://www.trustpilot.com/review/atomcheats.com', external: true }
      ]
    },
    {
      titleKey: 'footer.service.documents',
      links: [
        { key: 'footer.service.userAgreement', href: `/${currentLanguage}/tos` }
      ]
    },
    {
      titleKey: 'footer.news.partners',
      links: [
        { key: 'footer.news.yougame', href: 'https://yougame.biz/members/1821766/', external: true },
        { key: 'footer.news.cheatix', href: 'https://cheatix.to/marketplace/1328-atomcheats', external: true },
        { key: 'footer.news.elitepvpers', href: 'https://www.elitepvpers.com/forum/members/8995945-atomcheats.html', external: true },
        { key: 'footer.news.lolzteam', href: 'https://lolz.live/members/10111431/', external: true }
      ]
    }
  ];

  const companyInfo = {
    name: t('footer.companyInfo.name', 'ОсОО «Глобал Бридж»'),
    address: t('footer.companyInfo.address', 'Адрес компании:'),
    fullAddress: t('footer.companyInfo.fullAddress', 'Кыргызская Республика, г. Бишкек, Октябрьский район, улица Юнусалиева 185/1'),
    ogrn: t('footer.companyInfo.ogrn', 'Номер ОГРН: 309678-3301-ООО'),
    inn: t('footer.companyInfo.inn', 'ИНН: 9909704508')
  };

  const socialLinks = [
    {
      name: 'Telegram',
      icon: <FaTelegram className="w-5 h-5 lg:w-4 lg:h-4" />,
      href: 'https://t.me/atomcheats_support'
    },
    {
      name: 'Discord',
      icon: <FaDiscord className="w-5 h-5 lg:w-4 lg:h-4" />,
      href: 'https://discord.gg/atomcheats'
    },
    {
      name: 'YouTube',
      icon: <FaYoutube className="w-5 h-5 lg:w-4 lg:h-4" />,
      href: 'https://www.youtube.com/@atom-cheats'
    },
    {
      name: 'VK',
      icon: <FaVk className="w-5 h-5 lg:w-4 lg:h-4" />,
      href: 'https://vk.com/atomcheats'
    }
  ];

  return (
    <footer className="bg-transparent backdrop-blur-2xl">
      <div className="w-full px-3 sm:px-6 lg:px-48 py-6 lg:py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6 lg:gap-8 mb-6 lg:mb-8">
          {/* Logo and social networks - 3 columns */}
          <div className="lg:col-span-3 mb-4 lg:mb-0">
            <div className="flex items-center space-x-2 mb-2 lg:mb-3">
              <span className="text-white font-bold text-lg lg:text-2xl" style={{ fontFamily: 'var(--font-manrope)' }}>
                AtomCheats
              </span>
            </div>
            <p className="text-slate-400 text-xs lg:text-lg mb-4 lg:mb-6 leading-relaxed" style={{ fontFamily: 'var(--font-inter)' }}>
              {t('footer.description', 'The best shop for your needs. Quality, reliability and excellent service.')}
            </p>
            <div className="mb-3 lg:mb-6">
              <div className="flex space-x-2 lg:space-x-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    className="w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors"
                    aria-label={social.name}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Empty block for shifting right - 1 column */}
          <div className="hidden lg:block lg:col-span-1"></div>

          {/* Navigation sections - 3 columns and left-aligned */}
          {footerSections.map((section, index) => (
            <div key={index} className="lg:col-span-1 text-left mb-4 lg:mb-0">
              <h3 className="text-white font-semibold text-sm lg:text-lg mb-2 lg:mb-3" style={{ fontFamily: 'var(--font-inter)' }}>
                {t(section.titleKey, section.titleKey)}
              </h3>
              <ul className="space-y-2 lg:space-y-1">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex} className="py-1">
                    <a
                      href={link.href}
                      className="text-slate-400 cursor-pointer block text-xs lg:text-sm hover:text-slate-300 transition-colors py-1 lg:py-1"
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      {t(link.key, link.key)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Company Information */}
        <div className="border-t border-slate-800 pt-4 lg:pt-5 mb-4 lg:mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-white font-semibold text-sm mb-2" style={{ fontFamily: 'var(--font-inter)' }}>
                {companyInfo.name}
              </h4>
              <p className="text-slate-400 text-xs leading-relaxed mb-1" style={{ fontFamily: 'var(--font-inter)' }}>
                {companyInfo.address}
              </p>
              <p className="text-slate-400 text-xs leading-relaxed mb-2" style={{ fontFamily: 'var(--font-inter)' }}>
                {companyInfo.fullAddress}
              </p>
            </div>
            <div className="md:text-right">
              <p className="text-slate-400 text-xs leading-relaxed mb-1" style={{ fontFamily: 'var(--font-inter)' }}>
                {companyInfo.ogrn}
              </p>
              <p className="text-slate-400 text-xs leading-relaxed" style={{ fontFamily: 'var(--font-inter)' }}>
                {companyInfo.inn}
              </p>
            </div>
          </div>
        </div>

        {/* Divider line */}
        <div className="border-t border-slate-800 mb-4 lg:mb-6"></div>

        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-slate-500 text-xs lg:text-sm text-center md:text-left" style={{ fontFamily: 'var(--font-inter)' }}>
            © {currentYear} AtomCheats. {t('footer.copyright', 'All rights reserved.')}
          </div>

          <div className="flex items-center space-x-4 lg:space-x-6">
            <a
              href="https://discord.gg/skritipoolgfx"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 text-xs lg:text-sm cursor-pointer hover:text-slate-300 transition-colors"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              {t('footer.gfx', 'Gustoy')}
            </a>

            <LanguageSwitcherWrapper variant="footer" />
          </div>
        </div>
      </div>
    </footer>
  );
}
