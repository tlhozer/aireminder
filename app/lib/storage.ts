'use client';

// Kullanıcı bilgileri tipi
export type UserInfo = {
  name: string;
  birthYear?: string;
  gender?: string;
  interests?: string[];
  deviceInfo?: string;
  lastLogin?: Date;
};

// Hatırlatıcı tipi
export type Reminder = {
  id: string;
  title: string;
  date: Date;
  time: string;
  description: string;
  completed: boolean;
};

// Kullanıcı bilgilerini kaydet
export const saveUserInfo = (userInfo: Partial<UserInfo>) => {
  try {
    // Mevcut bilgileri al
    const existingInfo = getUserInfo();
    
    // Yeni bilgilerle birleştir
    const updatedInfo = {
      ...existingInfo,
      ...userInfo,
      lastLogin: new Date(),
    };
    
    // LocalStorage'a kaydet
    localStorage.setItem('userInfo', JSON.stringify(updatedInfo));
    return true;
  } catch (error) {
    console.error('Kullanıcı bilgileri kaydedilirken hata oluştu:', error);
    return false;
  }
};

// Kullanıcı bilgilerini al
export const getUserInfo = (): UserInfo | null => {
  try {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) return null;
    
    const parsedInfo = JSON.parse(userInfo);
    
    // Date nesnesini düzelt
    if (parsedInfo.lastLogin) {
      parsedInfo.lastLogin = new Date(parsedInfo.lastLogin);
    }
    
    return parsedInfo;
  } catch (error) {
    console.error('Kullanıcı bilgileri alınırken hata oluştu:', error);
    return null;
  }
};

// Hatırlatıcıları kaydet
export const saveReminders = (reminders: Reminder[]) => {
  try {
    localStorage.setItem('reminders', JSON.stringify(reminders));
    return true;
  } catch (error) {
    console.error('Hatırlatıcılar kaydedilirken hata oluştu:', error);
    return false;
  }
};

// Hatırlatıcıları al
export const getReminders = (): Reminder[] => {
  try {
    const reminders = localStorage.getItem('reminders');
    if (!reminders) return [];
    
    const parsedReminders = JSON.parse(reminders);
    
    // Date nesnelerini düzelt
    return parsedReminders.map((reminder: any) => ({
      ...reminder,
      date: new Date(reminder.date)
    }));
  } catch (error) {
    console.error('Hatırlatıcılar alınırken hata oluştu:', error);
    return [];
  }
};

// Yeni hatırlatıcı ekle
export const addReminder = (reminder: Omit<Reminder, 'id' | 'completed'>) => {
  try {
    const reminders = getReminders();
    
    const newReminder: Reminder = {
      ...reminder,
      id: Date.now().toString(),
      completed: false
    };
    
    reminders.push(newReminder);
    saveReminders(reminders);
    
    return newReminder;
  } catch (error) {
    console.error('Hatırlatıcı eklenirken hata oluştu:', error);
    return null;
  }
};

// Hatırlatıcı güncelle
export const updateReminder = (id: string, updates: Partial<Reminder>) => {
  try {
    const reminders = getReminders();
    const index = reminders.findIndex(r => r.id === id);
    
    if (index === -1) return false;
    
    reminders[index] = {
      ...reminders[index],
      ...updates
    };
    
    saveReminders(reminders);
    return true;
  } catch (error) {
    console.error('Hatırlatıcı güncellenirken hata oluştu:', error);
    return false;
  }
};

// Hatırlatıcı sil
export const deleteReminder = (id: string) => {
  try {
    const reminders = getReminders();
    const filteredReminders = reminders.filter(r => r.id !== id);
    
    saveReminders(filteredReminders);
    return true;
  } catch (error) {
    console.error('Hatırlatıcı silinirken hata oluştu:', error);
    return false;
  }
};

// Cihaz bilgilerini kaydet
export const saveDeviceInfo = () => {
  try {
    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      timestamp: new Date().toISOString()
    };
    
    saveUserInfo({ deviceInfo: JSON.stringify(deviceInfo) });
    return true;
  } catch (error) {
    console.error('Cihaz bilgileri kaydedilirken hata oluştu:', error);
    return false;
  }
}; 