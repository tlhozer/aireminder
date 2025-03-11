'use client';

import { motion } from 'framer-motion';
import GoogleSignInButton from './components/GoogleSignInButton';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserInfo } from './lib/storage';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Kullanıcı bilgilerini kontrol et
    const checkUserInfo = () => {
      const userInfo = getUserInfo();
      
      // Kullanıcı bilgileri varsa Home sayfasına yönlendir
      if (userInfo && userInfo.name) {
        router.push('/home');
      } else {
        setIsLoading(false);
      }
    };
    
    // Sayfa yüklendiğinde kontrol et
    checkUserInfo();
  }, [router]);

  // Yükleme durumunda basit bir yükleme göstergesi göster
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mx-auto space-y-8"
      >
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 20 }}
            className="mx-auto bg-black rounded-full w-24 h-24 flex items-center justify-center mb-4 shadow-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-12 h-12 text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
              />
            </svg>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-gray-800"
          >
            AI Hatırlatıcı
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 text-lg"
          >
            Yapay zeka destekli kişisel hatırlatıcı asistanınız
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="bg-white rounded-lg border border-gray-200 p-8 shadow-md"
        >
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-center text-gray-800">Hoş Geldiniz</h2>
            <p className="text-sm text-gray-600 text-center">
              Devam etmek için Google hesabınızla giriş yapın
            </p>
            <div className="pt-2">
              <GoogleSignInButton />
            </div>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-xs text-center text-gray-600"
        >
          Giriş yaparak, <a href="#" className="underline hover:text-gray-800">Kullanım Şartları</a> ve{' '}
          <a href="#" className="underline hover:text-gray-800">Gizlilik Politikası</a>'nı kabul etmiş olursunuz.
        </motion.p>
      </motion.div>
    </main>
  );
}
