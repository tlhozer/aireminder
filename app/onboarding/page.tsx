'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Button from '../components/Button';
import Input from '../components/Input';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../components/Card';
import { saveUserInfo, saveDeviceInfo, getUserInfo } from '../lib/storage';

type FormData = {
  name: string;
  birthYear: string;
  gender: string;
  interests: string;
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    birthYear: '',
    gender: '',
    interests: '',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  // Sayfa yüklendiğinde cihaz bilgilerini kaydet ve mevcut kullanıcı bilgilerini kontrol et
  useEffect(() => {
    saveDeviceInfo();
    
    // Mevcut kullanıcı bilgilerini al
    const userInfo = getUserInfo();
    if (userInfo) {
      // Form verilerini doldur
      setFormData({
        name: userInfo.name || '',
        birthYear: userInfo.birthYear || '',
        gender: userInfo.gender || '',
        interests: userInfo.interests ? userInfo.interests.join(', ') : '',
      });
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep1 = () => {
    const newErrors: Partial<FormData> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'İsim alanı zorunludur';
    }
    if (!formData.birthYear.trim()) {
      newErrors.birthYear = 'Doğum yılı zorunludur';
    } else if (isNaN(Number(formData.birthYear)) || Number(formData.birthYear) < 1900 || Number(formData.birthYear) > new Date().getFullYear()) {
      newErrors.birthYear = 'Geçerli bir doğum yılı giriniz';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Partial<FormData> = {};
    if (!formData.gender.trim()) {
      newErrors.gender = 'Cinsiyet alanı zorunludur';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      // Kullanıcı bilgilerini kaydet
      const interests = formData.interests.split(',').map(item => item.trim()).filter(Boolean);
      
      saveUserInfo({
        name: formData.name,
        birthYear: formData.birthYear,
        gender: formData.gender,
        interests: interests.length > 0 ? interests : undefined
      });
      
      // Home sayfasına yönlendir
      router.push('/home');
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleGenderChange = (gender: string) => {
    setFormData((prev) => ({ ...prev, gender }));
    if (errors.gender) {
      setErrors((prev) => ({ ...prev, gender: '' }));
    }
  };

  // Yıl seçenekleri için dizi oluştur
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mx-auto"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-8 h-8 text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">AI Hatırlatıcı</h1>
          <p className="text-gray-600">Kişisel bilgilerinizi tamamlayın</p>
        </div>

        <Card className="shadow-lg border border-gray-200 bg-white">
          <CardHeader>
            <CardTitle className="text-center text-gray-800">
              {step === 1 ? 'Kişisel Bilgiler' : 'Tercihleriniz'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Adım {step}/2</span>
                <span className="text-sm text-gray-500">
                  {Math.round((step / 2) * 100)}% Tamamlandı
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: '50%' }}
                  animate={{ width: `${(step / 2) * 100}%` }}
                  className="bg-black h-2 rounded-full"
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">İsim</label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Adınızı girin"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800/50 focus:border-gray-800 text-gray-800"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500 animate-slide-down">
                        {errors.name}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Doğum Yılı</label>
                    <select
                      name="birthYear"
                      value={formData.birthYear}
                      onChange={(e) => setFormData((prev) => ({ ...prev, birthYear: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800/50 focus:border-gray-800 text-gray-800"
                    >
                      <option value="">Yıl Seçin</option>
                      {years.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                    {errors.birthYear && (
                      <p className="text-sm text-red-500 animate-slide-down">
                        {errors.birthYear}
                      </p>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Cinsiyet</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Erkek', 'Kadın', 'Diğer'].map((option) => (
                        <motion.div
                          key={option}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          <button
                            type="button"
                            onClick={() => handleGenderChange(option)}
                            className={`w-full flex items-center justify-center p-3 border rounded-md cursor-pointer transition-colors ${
                              formData.gender === option
                                ? 'bg-black text-white border-black shadow-md'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {option}
                            {formData.gender === option && (
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className="h-5 w-5 ml-2" 
                                viewBox="0 0 20 20" 
                                fill="currentColor"
                              >
                                <path 
                                  fillRule="evenodd" 
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                                  clipRule="evenodd" 
                                />
                              </svg>
                            )}
                          </button>
                        </motion.div>
                      ))}
                    </div>
                    {errors.gender && (
                      <p className="text-sm text-red-500 animate-slide-down">
                        {errors.gender}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">İlgi Alanları (isteğe bağlı)</label>
                    <input
                      type="text"
                      name="interests"
                      placeholder="Müzik, Spor, Teknoloji, vb."
                      value={formData.interests}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800/50 focus:border-gray-800 text-gray-800"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1}
              className={step === 1 ? 'opacity-50 cursor-not-allowed' : ''}
            >
              Geri
            </Button>
            <Button onClick={handleNext}>
              {step === 2 ? 'Tamamla' : 'Devam Et'}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </main>
  );
} 