'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Button from '../components/Button';
import Navbar from '../components/Navbar';
import DeviceInfo from '../components/DeviceInfo';
import { getUserInfo, getReminders, Reminder } from '../lib/storage';

type WeatherData = {
  temperature: number;
  condition: string;
  icon: string;
  location: string;
};

type UpcomingReminder = {
  id: string;
  title: string;
  time: string;
  date: string;
};

export default function HomePage() {
  const router = useRouter();
  const [greeting, setGreeting] = useState('');
  const [userName, setUserName] = useState('Kullanıcı');
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [weather, setWeather] = useState<WeatherData>({
    temperature: 22,
    condition: 'Güneşli',
    icon: '☀️',
    location: 'İstanbul',
  });
  
  const [upcomingReminders, setUpcomingReminders] = useState<UpcomingReminder[]>([]);

  useEffect(() => {
    // Kullanıcı bilgilerini al
    const userInfo = getUserInfo();
    if (userInfo && userInfo.name) {
      setUserName(userInfo.name);
    }
    
    // Günün saatine göre selamlama mesajı
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting('Günaydın');
    } else if (hour >= 12 && hour < 18) {
      setGreeting('İyi günler');
    } else {
      setGreeting('İyi akşamlar');
    }
    
    // Tarih ve saat bilgisini ayarla
    updateDateTime();
    
    // Her dakika tarih ve saati güncelle
    const interval = setInterval(updateDateTime, 60000);
    
    // Hatırlatıcıları yükle
    loadReminders();
    
    return () => clearInterval(interval);
  }, []);
  
  const updateDateTime = () => {
    const now = new Date();
    
    // Saat formatı: 14:30
    setCurrentTime(now.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    }));
    
    // Tarih formatı: Pazartesi, 11 Mart
    setCurrentDate(now.toLocaleDateString('tr-TR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    }));
  };
  
  const loadReminders = () => {
    const reminders = getReminders();
    
    // Bugünün tarihi
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Yarının tarihi
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Yaklaşan hatırlatıcıları formatla
    const upcoming = reminders
      .filter(reminder => !reminder.completed)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5)
      .map(reminder => {
        const reminderDate = new Date(reminder.date);
        reminderDate.setHours(0, 0, 0, 0);
        
        let dateText = '';
        if (reminderDate.getTime() === today.getTime()) {
          dateText = 'Bugün';
        } else if (reminderDate.getTime() === tomorrow.getTime()) {
          dateText = 'Yarın';
        } else {
          dateText = reminderDate.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long'
          });
        }
        
        return {
          id: reminder.id,
          title: reminder.title,
          time: reminder.time,
          date: dateText
        };
      });
    
    setUpcomingReminders(upcoming);
  };
  
  const navigateToChat = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <Navbar showHomeButton={false} />
      
      <main className="container mx-auto px-4 py-6 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          {/* Karşılama Bölümü */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">
              {greeting}
              <br />
              <span className="text-orange-500">{userName}</span>
            </h1>
            <p className="text-lg text-gray-600 mt-2">{currentDate}</p>
          </div>
          
          {/* Hava Durumu Kartı */}
          <motion.div 
            className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 shadow-sm mb-8"
            whileHover={{ y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">{weather.location}</h2>
                <p className="text-gray-600">{weather.condition}</p>
              </div>
              <div className="flex items-center">
                <span className="text-4xl mr-2">{weather.icon}</span>
                <span className="text-3xl font-bold text-gray-800">{weather.temperature}°C</span>
              </div>
            </div>
          </motion.div>
          
          {/* Cihaz Bilgileri */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <DeviceInfo />
          </motion.div>
          
          {/* Yaklaşan Hatırlatıcılar */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Yaklaşan Hatırlatıcılar</h2>
            {upcomingReminders.length > 0 ? (
              <div className="space-y-3">
                {upcomingReminders.map(reminder => (
                  <motion.div 
                    key={reminder.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-800">{reminder.title}</h3>
                        <p className="text-sm text-gray-500">{reminder.date} • {reminder.time}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-600">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-600 py-4 bg-white rounded-lg p-4 shadow-sm">
                Yaklaşan hatırlatıcı bulunmuyor
              </p>
            )}
          </div>
          
          {/* Hızlı Erişim Butonları */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <motion.button
              onClick={navigateToChat}
              className="bg-black text-white rounded-xl p-6 flex flex-col items-center justify-center shadow-sm"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
              <span className="font-medium">Sohbet</span>
            </motion.button>
            
            <motion.button
              className="bg-gray-100 text-gray-800 rounded-xl p-6 flex flex-col items-center justify-center shadow-sm"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Hatırlatıcı Ekle</span>
            </motion.button>
          </div>
          
          {/* Son Eklenen Planlar */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Son Eklenen Planlar</h2>
              <div className="flex space-x-2">
                <button className="p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                  </svg>
                </button>
                <button className="p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
              </div>
            </div>
            
            <motion.div 
              className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
              whileHover={{ y: -5 }}
            >
              <div className="flex">
                <div className="w-1/3">
                  <img 
                    src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80" 
                    alt="Istanbul" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="w-2/3 p-4">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 mr-2">
                      <img 
                        src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1760&q=80" 
                        alt="User" 
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    <span className="font-medium text-gray-800">Ahmet</span>
                    <span className="text-gray-500 ml-2">ziyaret ediyor</span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-1">İstanbul, Türkiye</h3>
                  <p className="text-gray-600 mb-3">Hafta sonu gezisi!</p>
                  
                  <div className="flex items-center text-gray-500 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                    <span>15 - 17 Mart</span>
                    <span className="mx-2">•</span>
                    <span>3 günlük gezi</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
} 