'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FcGoogle } from 'react-icons/fc';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUserInfo } from '../lib/storage';

export default function LoginPage() {
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
  
  const handleGoogleSignIn = () => {
    // Fake Google sign-in
    router.push('/onboarding');
  };
  
  // Yükleme durumunda basit bir yükleme göstergesi göster
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2v8"></path>
              <path d="M12 18v4"></path>
              <path d="M4.93 10.93l1.41 1.41"></path>
              <path d="M17.66 17.66l1.41 1.41"></path>
              <path d="M2 12h4"></path>
              <path d="M18 12h4"></path>
              <path d="M10.93 4.93l-1.41 1.41"></path>
              <path d="M17.66 6.34l-1.41 1.41"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">AI Reminder</h1>
          <p className="text-gray-600 text-center">
            Hesabınıza giriş yapın veya yeni bir hesap oluşturun
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-6 border border-gray-200">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">E-posta</label>
              <input
                type="email"
                placeholder="E-posta adresiniz"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800/50 focus:border-gray-800 text-gray-800"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Şifre</label>
              <input
                type="password"
                placeholder="Şifreniz"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800/50 focus:border-gray-800 text-gray-800"
              />
            </div>
            
            <button
              className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors"
              onClick={() => router.push('/dashboard')}
            >
              Giriş Yap
            </button>
            
            <div className="relative flex items-center justify-center">
              <div className="border-t border-gray-300 w-full"></div>
              <span className="bg-white px-2 text-sm text-gray-500">veya</span>
              <div className="border-t border-gray-300 w-full"></div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: '#f5f5f5' }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-md py-2 px-4 text-gray-700 hover:bg-gray-50 transition-all"
            >
              <FcGoogle className="text-xl" />
              <span>Google ile devam et</span>
            </motion.button>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Hesabınız yok mu? <Link href="/onboarding" className="text-gray-800 hover:underline">Kaydolun</Link>
            </p>
          </div>
        </div>
        
        <p className="text-center text-gray-600 text-sm">
          &copy; {new Date().getFullYear()} AI Reminder. Tüm hakları saklıdır.
        </p>
      </motion.div>
    </div>
  );
} 