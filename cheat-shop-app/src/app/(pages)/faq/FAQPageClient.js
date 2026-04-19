'use client';

import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/i18n/LanguageContext';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import InstructionModal from '@/components/InstructionModal';
import { ArrowDownRight } from 'lucide-react';

export default function FAQPage({ lang: initialLang }) {
  const { t, language } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);

  // Используем переданный язык или текущий из контекста
  const currentLang = initialLang || language;

  // Debug: проверяем текущий язык
  useEffect(() => {
    console.log('FAQ Page - Current language:', currentLang);
  }, [currentLang]);

  return (
    <>
      <Header />
      
      {/* Background Image */}
      <div
        className="absolute top-0 left-0 w-full h-full bg-cover bg-top bg-no-repeat pointer-events-none z-0"
        style={{ backgroundImage: 'url(/images/backgrounds/grid.png)' }}
      />
      
      <div className="min-h-screen pt-20 relative z-10">
        {/* Hero Section */}
        <div className="relative">
          <div className="w-full px-4 sm:px-8 lg:px-48 py-8">
            <div className="text-left max-w-4xl">
              <motion.h1
                className="text-4xl lg:text-5xl font-bold text-white mb-3"
                style={{ fontFamily: 'var(--font-manrope)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {t('faq.title', 'FAQ & Help')}
              </motion.h1>
              <motion.p
                className="text-lg text-slate-400 mb-4"
                style={{ fontFamily: 'var(--font-inter)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {t('faq.subtitle', 'Find answers to common questions about our products and services')}
              </motion.p>
            </div>
          </div>
        </div>
        
        {/* Support Section */}
        <section className="py-8">
          <div className="w-full px-4 sm:px-8 lg:px-48">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Telegram Support */}
              <motion.div
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/30 rounded-2xl p-6 flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Image src="/icons/faq/tg.png" alt="Telegram" width={40} height={40} unoptimized />
                  <h3 className="text-xl font-semibold text-white">
                    {t('faq.telegramTitle', 'Telegram Bot Support')}
                  </h3>
                </div>
                <p className="text-slate-400 mb-4 flex-grow">
                  {t('faq.telegramDescription', 'Contact our support team through the Telegram bot. Click the button below for instructions.')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => {
                      setModalType('telegram');
                      setModalOpen(true);
                    }}
                    className="flex-1 border border-white/10 text-white hover:bg-white/10 font-medium py-3 px-4 rounded-lg text-left transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <span>{t('faq.goToTelegram', 'Go to Telegram')}</span>
                    <ArrowDownRight className="h-4 w-4 text-white" />
                  </button>
                </div>
              </motion.div>
              
              {/* Discord Support */}
              <motion.div
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/30 rounded-2xl p-6 flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Image src="/icons/faq/ds.png" alt="Discord" width={40} height={40} unoptimized />
                  <h3 className="text-xl font-semibold text-white">
                    {t('faq.discordTitle', 'Discord Server Support')}
                  </h3>
                </div>
                <p className="text-slate-400 mb-4 flex-grow">
                  {t('faq.discordDescription', 'Join our Discord server for support. Click the button below for instructions.')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => {
                      setModalType('discord');
                      setModalOpen(true);
                    }}
                    className="flex-1 border border-white/10 text-white hover:bg-white/10 font-medium py-3 px-4 rounded-lg text-left transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <span>{t('faq.goToDiscord', 'Go to Discord')}</span>
                    <ArrowDownRight className="h-4 w-4 text-white" />
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
        
        {/* Software Section */}
        <section className="py-8">
          <div className="w-full px-4 sm:px-8 lg:px-48">
            <motion.h2
              className="text-2xl font-bold text-white mb-6"
              style={{ fontFamily: 'var(--font-manrope)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              {t('faq.softwareTitle', 'Required Software')}
            </motion.h2>
            <motion.p
              className="text-slate-400 mb-8"
              style={{ fontFamily: 'var(--font-inter)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              {t('faq.softwareDescription', 'Download and install the necessary software for our products to work correctly:')}
            </motion.p>
            
            {/* Drivers Section */}
            <motion.div
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/30 rounded-2xl p-6 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <h3 className="text-xl font-semibold text-white mb-4">
                {t('faq.driversTitle', 'Drivers')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <a
                  href="https://www.techpowerup.com/download/visual-c-redistributable-runtime-package-all-in-one/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-700/30 hover:bg-slate-600/30 p-4 rounded-lg transition-colors cursor-pointer relative"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Image src="/icons/faq/software/vs.png" alt="Visual C++" width={40} height={40} unoptimized />
                    <h4 className="text-white font-medium">Microsoft Visual C++ 2005-2019</h4>
                  </div>
                  <p className="text-slate-400 text-sm mb-3">
                    {t('faq.visualCppDescription', 'Essential runtime components for many Windows applications and games')}
                  </p>
                  <div className="text-cyan-400 text-sm hover:underline flex items-center justify-end pr-2 pb-2">
                    <ArrowDownRight className="h-4 w-4 text-white" />
                  </div>
                </a>
                
                <a
                  href="https://download.microsoft.com/download/1/7/1/1718CCC4-6315-4D8E-9543-8E28A4E18C4C/dxwebsetup.exe"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-700/30 hover:bg-slate-600/30 p-4 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Image src="/icons/faq/software/directx.png" alt="DirectX" width={40} height={40} unoptimized />
                    <h4 className="text-white font-medium">DirectX 12</h4>
                  </div>
                  <p className="text-slate-400 text-sm mb-3">
                    {t('faq.directxDescription', 'Latest multimedia API for games and high-performance applications')}
                  </p>
                  <div className="text-cyan-400 text-sm hover:underline flex items-center justify-end pr-2 pb-2">
                    <ArrowDownRight className="h-4 w-4 text-white" />
                  </div>
                </a>
                
                <a
                  href="https://dotnet.microsoft.com/en-us/download/dotnet-framework"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-700/30 hover:bg-slate-600/30 p-4 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Image src="/icons/faq/software/net.png" alt=".NET Framework" width={40} height={40} unoptimized />
                    <h4 className="text-white font-medium">Microsoft .NET Framework</h4>
                  </div>
                  <p className="text-slate-400 text-sm mb-3">
                    {t('faq.netFrameworkDescription', 'Required framework for many Windows applications and software')}
                  </p>
                  <div className="text-cyan-400 text-sm hover:underline flex items-center justify-end pr-2 pb-2">
                    <ArrowDownRight className="h-4 w-4 text-white" />
                  </div>
                </a>
                
                <a
                  href="https://www.nvidia.com/en-eu/drivers/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-700/30 hover:bg-slate-600/30 p-4 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Image src="/icons/faq/software/nvidia.png" alt="NVIDIA" width={40} height={40} unoptimized />
                    <h4 className="text-white font-medium">{t('faq.nvidiaDrivers', 'NVIDIA Drivers')}</h4>
                  </div>
                  <p className="text-slate-400 text-sm mb-3">
                    {t('faq.nvidiaDescription', 'Latest graphics drivers for NVIDIA video cards')}
                  </p>
                  <div className="text-cyan-400 text-sm hover:underline flex items-center justify-end pr-2 pb-2">
                    <ArrowDownRight className="h-4 w-4 text-white" />
                  </div>
                </a>
                
                <a
                  href="https://www.amd.com/en/support/download/drivers.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-700/30 hover:bg-slate-600/30 p-4 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Image src="/icons/faq/software/amd.png" alt="AMD" width={40} height={40} unoptimized />
                    <h4 className="text-white font-medium">{t('faq.amdDrivers', 'AMD Drivers')}</h4>
                  </div>
                  <p className="text-slate-400 text-sm mb-3">
                    {t('faq.amdDescription', 'Latest graphics drivers for AMD video cards')}
                  </p>
                  <div className="text-cyan-400 text-sm hover:underline flex items-center justify-end pr-2 pb-2">
                    <ArrowDownRight className="h-4 w-4 text-white" />
                  </div>
                </a>
              </div>
            </motion.div>
            
            {/* Protection Section */}
            <motion.div
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/30 rounded-2xl p-6 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <h3 className="text-xl font-semibold text-white mb-4">
                {t('faq.protectionTitle', 'Protection Disable')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <a
                  href="https://www.sordum.org/9480/defender-control-v2-1/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-700/30 hover:bg-slate-600/30 p-4 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Image src="/icons/faq/software/defender.png" alt="Defender" width={40} height={40} unoptimized />
                    <h4 className="text-white font-medium">{t('faq.defenderControl', 'Defender Control Disable')}</h4>
                  </div>
                  <p className="text-slate-400 text-sm mb-3">
                    {t('faq.defenderDescription', 'Disable Windows Defender (password: sordum)')}
                  </p>
                  <div className="text-cyan-400 text-sm hover:underline flex items-center justify-end pr-2 pb-2">
                    <ArrowDownRight className="h-4 w-4 text-white" />
                  </div>
                </a>
                
                <a
                  href="https://www.youtube.com/watch?v=RjwT85icNHg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-700/30 hover:bg-slate-600/30 p-4 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Image src="/icons/faq/software/bios.png" alt="BIOS" width={40} height={40} unoptimized />
                    <h4 className="text-white font-medium">{t('faq.secureBootTitle', 'How to disable Secure Boot')}</h4>
                  </div>
                  <p className="text-slate-400 text-sm mb-3">
                    {t('faq.secureBootDescription', 'Video instruction for disabling Secure Boot in BIOS/UEFI')}
                  </p>
                  <div className="text-cyan-400 text-sm hover:underline flex items-center justify-end pr-2 pb-2">
                    <ArrowDownRight className="h-4 w-4 text-white" />
                  </div>
                </a>
                
                <a
                  href="https://learn.microsoft.com/ru-ru/windows/deployment/mbr-to-gpt?source=recommendations"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-700/30 hover:bg-slate-600/30 p-4 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Image src="/icons/faq/software/uefi.png" alt="UEFI" width={40} height={40} unoptimized />
                    <h4 className="text-white font-medium">{t('faq.uefiTitle', 'How to enable UEFI')}</h4>
                  </div>
                  <p className="text-slate-400 text-sm mb-3">
                    {t('faq.uefiDescription', 'Official Microsoft guide for enabling UEFI mode')}
                  </p>
                  <div className="text-cyan-400 text-sm hover:underline flex items-center justify-end pr-2 pb-2">
                    <ArrowDownRight className="h-4 w-4 text-white" />
                  </div>
                </a>
              </div>
            </motion.div>
            
            {/* Programs Section */}
            <motion.div
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/30 rounded-2xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
            >
              <h3 className="text-xl font-semibold text-white mb-4">
                {t('faq.programsTitle', 'Programs for Support')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <a
                  href="https://app.prntscr.com/en/download.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-700/30 hover:bg-slate-600/30 p-4 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Image src="/icons/faq/software/lightshot.png" alt="Lightshot" width={40} height={40} unoptimized />
                    <h4 className="text-white font-medium">Lightshot</h4>
                  </div>
                  <p className="text-slate-400 text-sm mb-3">
                    {t('faq.lightshotDescription', 'Lightweight screenshot tool with quick sharing capabilities')}
                  </p>
                  <div className="text-cyan-400 text-sm hover:underline flex items-center justify-end pr-2 pb-2">
                    <ArrowDownRight className="h-4 w-4 text-white" />
                  </div>
                </a>
                
                <a
                  href="https://github.com/rustdesk/rustdesk/releases/tag/1.4.5"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-700/30 hover:bg-slate-600/30 p-4 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Image src="/icons/faq/software/rustdesk.png" alt="RustDesk" width={40} height={40} unoptimized />
                    <h4 className="text-white font-medium">RustDesk</h4>
                  </div>
                  <p className="text-slate-400 text-sm mb-3">
                    {t('faq.rustdeskDescription', 'Open-source remote desktop software for technical support')}
                  </p>
                  <div className="text-cyan-400 text-sm hover:underline flex items-center justify-end pr-2 pb-2">
                    <ArrowDownRight className="h-4 w-4 text-white" />
                  </div>
                </a>
                
                <a
                  href="https://anydesk.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-700/30 hover:bg-slate-600/30 p-4 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Image src="/icons/faq/software/anydesk.png" alt="AnyDesk" width={40} height={40} unoptimized />
                    <h4 className="text-white font-medium">AnyDesk</h4>
                  </div>
                  <p className="text-slate-400 text-sm mb-3">
                    {t('faq.anydeskDescription', 'Fast and secure remote access software for support sessions')}
                  </p>
                  <div className="text-cyan-400 text-sm hover:underline flex items-center justify-end pr-2 pb-2">
                    <ArrowDownRight className="h-4 w-4 text-white" />
                  </div>
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
      
      <Footer />
      
      {/* Instruction Modal */}
      <InstructionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalType === 'telegram' ? t('faq.telegramTitle', 'Telegram Bot Support') : t('faq.discordTitle', 'Discord Server Support')}
        steps={modalType === 'telegram' 
          ? (currentLang === 'ru' 
            ? ['Запустить бота @atomcheats_bot', 'Выбрать язык', 'Нажать на кнопку создания тикета', 'Указать проблему']
            : ['Go to the bot @atomcheats_bot', 'Launch the bot using the START button', 'Select the bot language', 'Click on the button to create a new ticket', 'Describe your problem'])
          : (currentLang === 'ru'
            ? ['Присоединиться к Discord серверу', 'Верифицироваться на сервере', 'Выбрать язык (ru/en)', 'Создать тикет']
            : ['Join our Discord server', 'Verify your account on the server', 'Select your language (Russian or English)', 'Go to the support channel and create a ticket'])
        }
        linkText={modalType === 'telegram' ? t('faq.openTelegram', 'Open Telegram Bot') : t('faq.joinDiscord', 'Join Discord Server')}
        linkUrl={modalType === 'telegram' ? 'https://t.me/atomcheats_bot' : 'https://discord.gg/atomcheats'}
      />
    </>
  );
}