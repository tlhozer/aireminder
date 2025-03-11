'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import ChatBox from '../components/ChatBox';
import ReminderCard, { Reminder } from '../components/ReminderCard';
import Button from '../components/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../components/Card';
import { toast } from 'react-hot-toast';
import { getReminders, deleteReminder, updateReminder } from '../lib/storage';
import AppList from '../components/AppList';

type TabType = 'chat' | 'reminders' | 'apps';

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [reminders, setReminders] = useState<Reminder[]>([]);

  // Hatırlatıcıları yükle
  useEffect(() => {
    loadReminders();
  }, []);

  // Hatırlatıcıları yeniden yükle
  const loadReminders = () => {
    const savedReminders = getReminders();
    
    // Hatırlatıcıları ReminderCard bileşeninin beklediği formata dönüştür
    const formattedReminders = savedReminders.map(reminder => ({
      id: reminder.id,
      title: reminder.title,
      date: reminder.date,
      description: reminder.description,
      completed: reminder.completed,
      priority: determinePriority(reminder.date) // Tarihe göre öncelik belirle
    }));
    
    setReminders(formattedReminders);
  };

  // Tarihe göre öncelik belirle
  const determinePriority = (date: Date): 'low' | 'medium' | 'high' => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);
    
    if (diffDays < 1) return 'high';
    if (diffDays < 3) return 'medium';
    return 'low';
  };

  const handleToggleComplete = (id: string) => {
    // Hatırlatıcıyı bul
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;
    
    // Hatırlatıcıyı güncelle
    const success = updateReminder(id, { completed: !reminder.completed });
    
    if (success) {
      // UI'ı güncelle
      setReminders(prev =>
        prev.map(r => r.id === id ? { ...r, completed: !r.completed } : r)
      );
      toast.success('Hatırlatıcı durumu güncellendi');
    } else {
      toast.error('Hatırlatıcı güncellenirken bir hata oluştu');
    }
  };

  const handleDeleteReminder = (id: string) => {
    // Hatırlatıcıyı sil
    const success = deleteReminder(id);
    
    if (success) {
      // UI'ı güncelle
      setReminders(prev => prev.filter(r => r.id !== id));
      toast.success('Hatırlatıcı silindi');
    } else {
      toast.error('Hatırlatıcı silinirken bir hata oluştu');
    }
  };

  const navigateToHome = () => {
    router.push('/home');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar />
      
      <main className="container mx-auto px-4 py-6 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6 bg-white rounded-t-lg p-2 shadow-sm">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-2 font-medium text-sm rounded-md transition-colors ${
                activeTab === 'chat'
                  ? 'text-white bg-black'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Sohbet
            </button>
            <button
              onClick={() => setActiveTab('reminders')}
              className={`px-4 py-2 font-medium text-sm rounded-md transition-colors ${
                activeTab === 'reminders'
                  ? 'text-white bg-black'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Hatırlatıcılar
            </button>
            <button
              onClick={() => setActiveTab('apps')}
              className={`px-4 py-2 font-medium text-sm rounded-md transition-colors ${
                activeTab === 'apps'
                  ? 'text-white bg-black'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Uygulamalar
            </button>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'chat' && (
              <div className="max-w-4xl mx-auto">
                <ChatBox />
              </div>
            )}

            {activeTab === 'reminders' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4 bg-white p-4 rounded-lg shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-800">Hatırlatıcılar</h2>
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => {
                      setActiveTab('chat');
                      toast.success('Hatırlatıcı oluşturmak için sohbet asistanını kullanabilirsiniz');
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5 mr-1"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
                    Yeni Hatırlatıcı
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reminders.map((reminder) => (
                    <ReminderCard
                      key={reminder.id}
                      reminder={reminder}
                      onToggleComplete={handleToggleComplete}
                      onDelete={handleDeleteReminder}
                    />
                  ))}
                  {reminders.length === 0 && (
                    <p className="text-center text-gray-600 py-4 col-span-2 bg-white rounded-lg p-4 shadow-sm">
                      Henüz hatırlatıcı bulunmuyor. Sohbet asistanı ile hatırlatıcı oluşturabilirsiniz.
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'apps' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4 bg-white p-4 rounded-lg shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-800">Uygulamalar</h2>
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => {
                      setActiveTab('chat');
                      toast.success('Uygulamaları açmak için sohbet asistanını da kullanabilirsiniz');
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5 mr-1"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                      />
                    </svg>
                    Sohbete Dön
                  </Button>
                </div>
                
                <div className="max-w-4xl mx-auto">
                  <AppList className="mb-4" />
                  
                  <div className="bg-white rounded-lg shadow-sm p-4 mt-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Nasıl Kullanılır?</h2>
                    <ul className="space-y-3 text-sm text-gray-600">
                      <li className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Uygulamalara tıklayarak doğrudan açabilirsiniz.</span>
                      </li>
                      <li className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Sohbet asistanına "YouTube aç" gibi komutlar verebilirsiniz.</span>
                      </li>
                      <li className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Cihazınızda yüklü uygulamalar doğrudan açılır, yüklü olmayanlar web sayfasında açılır.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
} 