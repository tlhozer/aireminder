'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';
import { sendChatMessage, textToSpeech, speechToText } from '../lib/api';
import { toast } from 'react-hot-toast';
import { App, checkForAppCommand, openApp, apps } from '../lib/apps';
import Image from 'next/image';

type Message = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
};

type Reminder = {
  id: string;
  title: string;
  date: Date;
  time: string;
  description: string;
  completed: boolean;
};

type PendingReminder = {
  title: string;
  date: string;
  time: string;
  description: string;
};

// Bekleyen uygulama açma isteği
type PendingAppOpen = {
  app: App;
  command: string;
};

// Mesajları localStorage'dan yükle
const loadMessagesFromStorage = (): Message[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const savedMessages = localStorage.getItem('chatMessages');
    if (!savedMessages) {
      return [
        {
          id: '1',
          content: 'Merhaba! Ben AI asistanınız. Size nasıl yardımcı olabilirim?',
          role: 'assistant',
          timestamp: new Date(),
        },
      ];
    }
    
    const parsedMessages = JSON.parse(savedMessages);
    // Date nesnelerini düzelt
    return parsedMessages.map((message: any) => ({
      ...message,
      timestamp: new Date(message.timestamp)
    }));
  } catch (error) {
    console.error('Mesajlar yüklenirken hata oluştu:', error);
    return [
      {
        id: '1',
        content: 'Merhaba! Ben AI asistanınız. Size nasıl yardımcı olabilirim?',
        role: 'assistant',
        timestamp: new Date(),
      },
    ];
  }
};

const ChatBox = () => {
  const [messages, setMessages] = useState<Message[]>(loadMessagesFromStorage);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingReminder, setPendingReminder] = useState<PendingReminder | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [pendingAppOpen, setPendingAppOpen] = useState<PendingAppOpen | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isProcessingSpeech, setIsProcessingSpeech] = useState(false);
  const [hasShownMicHelp, setHasShownMicHelp] = useState(false);

  // LocalStorage'dan hatırlatıcıları yükle
  useEffect(() => {
    try {
      const savedReminders = localStorage.getItem('reminders');
      if (savedReminders) {
        const parsedReminders = JSON.parse(savedReminders);
        // Date nesnelerini düzelt
        const fixedReminders = parsedReminders.map((reminder: any) => ({
          ...reminder,
          date: new Date(reminder.date)
        }));
        setReminders(fixedReminders);
      }
    } catch (error) {
      console.error('Hatırlatıcılar yüklenirken hata oluştu:', error);
    }
  }, []);

  // Hatırlatıcıları LocalStorage'a kaydet
  useEffect(() => {
    if (reminders.length > 0) {
      localStorage.setItem('reminders', JSON.stringify(reminders));
    }
  }, [reminders]);
  
  // Mesajları LocalStorage'a kaydet
  useEffect(() => {
    // Mesajlar boş değilse kaydet
    if (messages && messages.length > 0) {
      try {
        localStorage.setItem('chatMessages', JSON.stringify(messages));
        console.log('Mesajlar kaydedildi:', messages.length);
      } catch (error) {
        console.error('Mesajlar kaydedilirken hata oluştu:', error);
      }
    }
  }, [messages]);

  // Ses çalma durumunu izle
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => {
        setIsSpeaking(null);
      };
    }
  }, [audioRef.current]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, pendingReminder]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Kullanıcı mesajını ekle
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date(),
    };
    
    // Mesajları güncelle ve localStorage'a kaydet
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    // Uygulama açma komutu var mı kontrol et
    const appCommand = checkForAppCommand(input);
    if (appCommand) {
      setPendingAppOpen(appCommand);
      setIsLoading(false);
      return;
    }

    try {
      // API'ye gönderilecek mesajları hazırla
      const apiMessages = updatedMessages
        .map(({ content, role }) => ({ content, role }));

      // API'ye istek gönder
      const response = await sendChatMessage(apiMessages);

      // AI yanıtını ekle
      if (response.message) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response.message.content,
          role: 'assistant',
          timestamp: new Date(),
        };
        
        // Mesajları güncelle
        setMessages(prev => [...prev, aiMessage]);

        // Hatırlatıcı oluşturma isteği var mı kontrol et
        checkForReminderCreation(response.message.content);
        
        // AI yanıtında uygulama açma komutu var mı kontrol et
        checkForAppOpeningInAIResponse(response.message.content);
      }
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      // Hata durumunda kullanıcıya bildir
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Metni sese dönüştür
  const handleTextToSpeech = async (messageId: string, text: string) => {
    // Eğer zaten konuşuyorsa durdur
    if (isSpeaking === messageId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsSpeaking(null);
      return;
    }
    
    try {
      setIsSpeaking(messageId);
      
      // TTS API'sine istek gönder
      const response = await textToSpeech(text);
      
      if (response.error || !response.audio) {
        throw new Error(response.error || 'Ses oluşturulamadı');
      }
      
      // Base64 formatındaki ses verisini çal
      const audio = new Audio(`data:audio/mp3;base64,${response.audio}`);
      audioRef.current = audio;
      
      audio.play();
      
      // Ses bittiğinde durumu güncelle
      audio.onended = () => {
        setIsSpeaking(null);
      };
    } catch (error) {
      console.error('TTS hatası:', error);
      toast.error('Ses oluşturulurken bir hata oluştu');
      setIsSpeaking(null);
    }
  };

  // AI yanıtında hatırlatıcı oluşturma isteği var mı kontrol et
  const checkForReminderCreation = (content: string) => {
    // Hatırlatıcı formatını kontrol et
    const titleMatch = content.match(/Başlık: (.*?)(\n|$)/);
    const dateMatch = content.match(/Tarih: (.*?)(\n|$)/);
    const timeMatch = content.match(/Saat: (.*?)(\n|$)/);
    const descriptionMatch = content.match(/Açıklama: (.*?)(\n|$)/);

    // Eğer hatırlatıcı formatı varsa
    if (titleMatch && dateMatch && timeMatch) {
      const title = titleMatch[1].trim();
      const date = dateMatch[1].trim();
      const time = timeMatch[1].trim();
      const description = descriptionMatch ? descriptionMatch[1].trim() : '';

      // Bekleyen hatırlatıcıyı ayarla
      setPendingReminder({
        title,
        date,
        time,
        description
      });
    }
  };

  // AI yanıtında uygulama açma komutu var mı kontrol et
  const checkForAppOpeningInAIResponse = (content: string) => {
    // AI yanıtında "açmak istediğinizi anlıyorum" veya "açmak için onay" gibi ifadeler var mı
    const appOpeningPhrases = [
      /açmak istediğinizi anlıyorum/i,
      /açmak için onay/i,
      /uygulamasını açmak/i,
      /açmak istiyor musunuz/i
    ];
    
    // Eğer bu ifadelerden biri varsa
    if (appOpeningPhrases.some(phrase => phrase.test(content))) {
      // Desteklenen uygulamaları kontrol et
      for (const app of apps) {
        // Eğer uygulama adı AI yanıtında geçiyorsa
        if (content.toLowerCase().includes(app.name.toLowerCase())) {
          // Uygulama açma onayı göster
          setPendingAppOpen({ app, command: 'aç' });
          return;
        }
      }
    }
  };

  const handleConfirmReminder = () => {
    if (!pendingReminder) return;

    // Yeni hatırlatıcı oluştur
    const newReminder: Reminder = {
      id: Date.now().toString(),
      title: pendingReminder.title,
      date: new Date(pendingReminder.date),
      time: pendingReminder.time,
      description: pendingReminder.description,
      completed: false
    };

    // Hatırlatıcıları güncelle
    setReminders(prev => [...prev, newReminder]);

    // Onay mesajı ekle
    const confirmationMessage: Message = {
      id: Date.now().toString(),
      content: `Hatırlatıcı başarıyla oluşturuldu:\n- ${pendingReminder.title}\n- ${pendingReminder.date} ${pendingReminder.time}\n- ${pendingReminder.description}`,
      role: 'assistant',
      timestamp: new Date(),
    };
    
    // Mesajları güncelle ve localStorage'a kaydet
    setMessages(prev => [...prev, confirmationMessage]);
    
    // Bekleyen hatırlatıcıyı temizle
    setPendingReminder(null);
  };

  const handleRejectReminder = () => {
    if (!pendingReminder) return;

    // Red mesajı ekle
    const rejectionMessage: Message = {
      id: Date.now().toString(),
      content: 'Hatırlatıcı oluşturma iptal edildi.',
      role: 'assistant',
      timestamp: new Date(),
    };
    
    // Mesajları güncelle ve localStorage'a kaydet
    setMessages(prev => [...prev, rejectionMessage]);
    
    // Bekleyen hatırlatıcıyı temizle
    setPendingReminder(null);
  };

  // Uygulama açma onayı
  const handleConfirmAppOpen = async () => {
    if (!pendingAppOpen) return;
    
    try {
      const isNativeAppOpened = await openApp(pendingAppOpen.app);
      
      // Başarı mesajı
      const successMessage: Message = {
        id: Date.now().toString(),
        content: isNativeAppOpened 
          ? `${pendingAppOpen.app.name} uygulaması açıldı.` 
          : `${pendingAppOpen.app.name} web sayfası açıldı.`,
        role: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, successMessage]);
      
      // Bildirim göster
      if (isNativeAppOpened) {
        toast.success(`${pendingAppOpen.app.name} uygulaması açıldı`);
      } else {
        toast.success(`${pendingAppOpen.app.name} web sayfası açıldı`);
      }
    } catch (error) {
      console.error('App opening error:', error);
      
      // Hata mesajı
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: `${pendingAppOpen.app.name} açılırken bir hata oluştu.`,
        role: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      toast.error(`${pendingAppOpen.app.name} açılırken bir hata oluştu`);
    } finally {
      setPendingAppOpen(null);
    }
  };

  // Uygulama açma reddi
  const handleRejectAppOpen = () => {
    if (!pendingAppOpen) return;
    
    // Red mesajı
    const rejectMessage: Message = {
      id: Date.now().toString(),
      content: `${pendingAppOpen.app.name} açma işlemi iptal edildi.`,
      role: 'assistant',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, rejectMessage]);
    setPendingAppOpen(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Safari için mikrofon izni kontrolü
  const checkSafariPermission = async (): Promise<boolean> => {
    // Safari tarayıcısı kontrolü
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (isSafari) {
      try {
        // Safari'de izin istemek için bir kullanıcı etkileşimi gerekiyor
        toast.loading('Safari için mikrofon izni isteniyor...', { id: 'safari-mic-permission' });
        
        // Safari'de izin durumunu kontrol etmek için getUserMedia kullanılır
        await navigator.mediaDevices.getUserMedia({ audio: true });
        
        toast.success('Mikrofon izni verildi', { id: 'safari-mic-permission' });
        return true;
      } catch (error) {
        console.error('Safari mikrofon izni hatası:', error);
        
        toast.error('Mikrofon izni reddedildi', { id: 'safari-mic-permission' });
        
        // Kullanıcıya Safari için özel yardım mesajı
        const helpMessage: Message = {
          id: Date.now().toString(),
          content: 'Safari tarayıcısında mikrofon izni vermek için: Ayarlar > Safari > Kamera ve Mikrofon Erişimi bölümünden bu web sitesine izin vermeniz gerekiyor.',
          role: 'assistant',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, helpMessage]);
        
        return false;
      }
    }
    
    return true; // Safari değilse true döndür
  };

  // iOS için mikrofon izni iste
  const requestIOSMicrophonePermission = async (): Promise<boolean> => {
    // iOS 13+ için özel izin isteği
    if (typeof navigator !== 'undefined' && 
        typeof navigator.mediaDevices !== 'undefined' && 
        typeof navigator.mediaDevices.getUserMedia !== 'undefined') {
      
      try {
        // iOS'ta izin istemek için bir kullanıcı etkileşimi gerekiyor
        // Bu nedenle bir toast mesajı gösterip, kullanıcıyı bilgilendiriyoruz
        toast.loading('Mikrofon izni isteniyor...', { id: 'ios-mic-permission' });
        
        // Mikrofon izni iste
        await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // İzin verildi
        toast.success('Mikrofon izni verildi', { id: 'ios-mic-permission' });
        return true;
      } catch (error) {
        console.error('iOS mikrofon izni hatası:', error);
        
        // İzin reddedildi veya bir hata oluştu
        toast.error('Mikrofon izni reddedildi', { id: 'ios-mic-permission' });
        
        // Kullanıcıya yardımcı mesaj ekle
        const helpMessage: Message = {
          id: Date.now().toString(),
          content: 'iOS cihazlarda mikrofon izni vermek için Safari ayarlarından "Kamera ve Mikrofon Erişimi" bölümünü kontrol edin. Ayarlar > Safari > Kamera ve Mikrofon Erişimi yolunu izleyebilirsiniz.',
          role: 'assistant',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, helpMessage]);
        
        return false;
      }
    }
    
    return false;
  };

  // Ses kaydını başlat/durdur
  const toggleRecording = async () => {
    // Eğer zaten kayıt işleniyor ise, işlemi engelle
    if (isProcessingSpeech) return;
    
    // İlk kez mikrofon butonuna tıklandığında yardım mesajı göster
    if (!hasShownMicHelp) {
      const helpMessage: Message = {
        id: Date.now().toString(),
        content: 'Sesli komut vermek için mikrofon izni vermeniz gerekiyor. Tarayıcınızın izin isteğini onaylayın. Konuşmanız otomatik olarak metne çevrilip gönderilecektir.',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, helpMessage]);
      setHasShownMicHelp(true);
      
      // Kullanıcıya zaman tanı
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Eğer kayıt yapılıyorsa, kaydı durdur
    if (isRecording) {
      setIsRecording(false);
      
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      
      return;
    }
    
    try {
      // Safari tarayıcısı kontrolü
      const safariPermissionResult = await checkSafariPermission();
      if (!safariPermissionResult) return;
      
      // iOS cihazlar için özel izin kontrolü
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      
      if (isIOS) {
        const hasPermission = await requestIOSMicrophonePermission();
        if (!hasPermission) return;
      } else {
        // Mikrofon izni kontrolü (diğer cihazlar için)
        if (typeof navigator !== 'undefined' && navigator.permissions) {
          try {
            // Mevcut izin durumunu kontrol et
            const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
            
            if (permissionStatus.state === 'denied') {
              // İzin reddedilmiş, kullanıcıya bilgi ver
              toast.error('Mikrofon izni reddedilmiş. Lütfen tarayıcı ayarlarından izin verin.', {
                duration: 5000,
              });
              
              // Kullanıcıya yardımcı mesaj ekle
              const helpMessage: Message = {
                id: Date.now().toString(),
                content: 'Mikrofon izni reddedilmiş görünüyor. Sesli komut vermek için tarayıcı ayarlarından mikrofon iznini etkinleştirmeniz gerekiyor. Mobil cihazlarda genellikle adres çubuğunun yanındaki kilit simgesine tıklayarak izinleri yönetebilirsiniz.',
                role: 'assistant',
                timestamp: new Date(),
              };
              setMessages(prev => [...prev, helpMessage]);
              
              return;
            }
            
            if (permissionStatus.state === 'prompt') {
              // Kullanıcıya izin isteneceğini bildir
              toast.loading('Mikrofon izni isteniyor...', { id: 'mic-permission' });
            }
          } catch (error) {
            console.error('İzin kontrolü hatası:', error);
            // Hata durumunda devam et, getUserMedia zaten izin isteyecek
          }
        }
      }
      
      // Mikrofon erişimi iste
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // İzin toast'ını kapat
      toast.dismiss('mic-permission');
      toast.success('Mikrofon izni verildi. Kayıt başlatılıyor...');
      
      // Desteklenen MIME tiplerini kontrol et - OpenAI'nin desteklediği formatları kullan
      let mimeType = 'audio/mp3';
      
      // Tarayıcı desteğini kontrol et
      if (MediaRecorder.isTypeSupported('audio/mp3')) {
        mimeType = 'audio/mp3';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      } else if (MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/wav';
      }
      
      console.log('Kullanılan ses formatı:', mimeType);
      
      // MediaRecorder oluştur
      try {
        const options = { mimeType };
        let mediaRecorder;
        
        try {
          mediaRecorder = new MediaRecorder(stream, options);
        } catch (mimeError) {
          console.warn('Belirtilen MIME tipi desteklenmiyor, varsayılan ayarlar kullanılıyor:', mimeError);
          mediaRecorder = new MediaRecorder(stream);
        }
        
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        
        // Veri geldiğinde topla
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        
        // Kayıt bittiğinde
        mediaRecorder.onstop = async () => {
          try {
            // Ses verilerini birleştir
            const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
            console.log('Ses kaydı tamamlandı, boyut:', audioBlob.size, 'tip:', audioBlob.type);
            
            if (audioBlob.size === 0) {
              throw new Error('Ses kaydı boş');
            }
            
            // Whisper API'ye gönder
            setIsProcessingSpeech(true);
            toast.loading('Konuşma işleniyor...', { id: 'speech-processing' });
            
            try {
              const result = await speechToText(audioBlob);
              
              if (result.error || !result.text) {
                throw new Error(result.error || 'Ses tanıma başarısız oldu');
              }
              
              // Başarılı ise, metni input alanına yerleştir ve mesajı gönder
              setInput(result.text);
              
              // Otomatik olarak mesajı gönder
              if (result.text.trim()) {
                // Kullanıcı mesajını ekle
                const userMessage: Message = {
                  id: Date.now().toString(),
                  content: result.text,
                  role: 'user',
                  timestamp: new Date(),
                };
                
                // Mesajları güncelle ve localStorage'a kaydet
                const updatedMessages = [...messages, userMessage];
                setMessages(updatedMessages);
                
                // Uygulama açma komutu var mı kontrol et
                const appCommand = checkForAppCommand(result.text);
                if (appCommand) {
                  setPendingAppOpen(appCommand);
                  
                  // Eğer müzik açma komutu ise hemen bir yanıt ekle
                  if (appCommand.query) {
                    const musicResponseMessage: Message = {
                      id: (Date.now() + 1).toString(),
                      content: appCommand.app.id === 'youtube' 
                        ? `YouTube'dan "${appCommand.query}" açmak istediğinizi anladım. Onaylıyor musunuz?` 
                        : `Spotify'dan "${appCommand.query}" açmak istediğinizi anladım. Onaylıyor musunuz?`,
                      role: 'assistant',
                      timestamp: new Date(),
                    };
                    setMessages(prev => [...prev, musicResponseMessage]);
                  }
                  
                  toast.success('Ses başarıyla tanındı', { id: 'speech-processing' });
                  setIsProcessingSpeech(false);
                  return;
                }
                
                // API'ye istek gönder
                setIsLoading(true);
                try {
                  // API'ye gönderilecek mesajları hazırla
                  const apiMessages = updatedMessages
                    .map(({ content, role }) => ({ content, role }));
                  
                  // API'ye istek gönder
                  const response = await sendChatMessage(apiMessages);
                  
                  // AI yanıtını ekle
                  if (response.message) {
                    const aiMessage: Message = {
                      id: (Date.now() + 1).toString(),
                      content: response.message.content,
                      role: 'assistant',
                      timestamp: new Date(),
                    };
                    
                    // Mesajları güncelle
                    setMessages(prev => [...prev, aiMessage]);
                    
                    // Hatırlatıcı oluşturma isteği var mı kontrol et
                    checkForReminderCreation(response.message.content);
                    
                    // AI yanıtında uygulama açma komutu var mı kontrol et
                    checkForAppOpeningInAIResponse(response.message.content);
                  }
                } catch (error) {
                  console.error('Mesaj gönderme hatası:', error);
                  // Hata durumunda kullanıcıya bildir
                  const errorMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    content: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
                    role: 'assistant',
                    timestamp: new Date(),
                  };
                  setMessages(prev => [...prev, errorMessage]);
                } finally {
                  setIsLoading(false);
                }
              }
              
              toast.success('Ses başarıyla tanındı', { id: 'speech-processing' });
            } catch (error) {
              console.error('Ses tanıma hatası:', error);
              toast.error('Ses tanıma sırasında bir hata oluştu', { id: 'speech-processing' });
              
              // Kullanıcıya hata mesajı ekle
              const errorMessage: Message = {
                id: Date.now().toString(),
                content: 'Ses tanıma sırasında bir hata oluştu. Lütfen tekrar deneyin veya yazarak mesaj gönderin.',
                role: 'assistant',
                timestamp: new Date(),
              };
              setMessages(prev => [...prev, errorMessage]);
            } finally {
              setIsProcessingSpeech(false);
            }
          } catch (error) {
            console.error('Ses kaydı işleme hatası:', error);
            toast.error('Ses kaydı işlenirken bir hata oluştu', { id: 'speech-processing' });
            setIsProcessingSpeech(false);
          }
          
          // Mikrofon stream'ini kapat
          stream.getTracks().forEach(track => track.stop());
        };
        
        // Kaydı başlat
        mediaRecorder.start();
        setIsRecording(true);
        toast.success('Ses kaydı başladı. Konuşmayı bitirdiğinizde tekrar tıklayın.');
      } catch (recorderError) {
        console.error('MediaRecorder oluşturma hatası:', recorderError);
        toast.error('Ses kaydı başlatılamadı. Tarayıcınız bu özelliği desteklemiyor olabilir.');
        
        // Mikrofon stream'ini kapat
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (error) {
      console.error('Mikrofon erişim hatası:', error);
      
      // İzin toast'ını kapat
      toast.dismiss('mic-permission');
      
      // Hata mesajını göster
      toast.error('Mikrofon erişimi sağlanamadı. Lütfen izinleri kontrol edin.');
      
      // Kullanıcıya yardımcı mesaj ekle
      const helpMessage: Message = {
        id: Date.now().toString(),
        content: 'Sesli komut vermek için mikrofon izni vermeniz gerekiyor. Tarayıcınızın izin isteğini onaylayın. Eğer izin penceresi görünmüyorsa, adres çubuğunun yanındaki izin simgesine tıklayarak izinleri yönetebilirsiniz.',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, helpMessage]);
    }
  };
  
  // Mesajları temizle
  const clearMessages = () => {
    // Karşılama mesajını koru, diğerlerini temizle
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      content: 'Merhaba! Ben AI asistanınız. Size nasıl yardımcı olabilirim?',
      role: 'assistant',
      timestamp: new Date(),
    };
    
    setMessages([welcomeMessage]);
    localStorage.setItem('chatMessages', JSON.stringify([welcomeMessage]));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      <div className="flex justify-between items-center p-3 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">AI Asistanı</h2>
        <button 
          onClick={clearMessages}
          className="text-gray-500 hover:text-gray-700 text-sm flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
          Temizle
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              } mb-4`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center mr-2 flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 text-white"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                    />
                  </svg>
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                
                {/* Ses butonu - sadece AI mesajları için göster */}
                {message.role === 'assistant' && (
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => handleTextToSpeech(message.id, message.content)}
                      className={`p-1 rounded-full ${
                        isSpeaking === message.id
                          ? 'bg-red-100 text-red-600'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      } transition-colors`}
                      title={isSpeaking === message.id ? 'Sesi durdur' : 'Sesli dinle'}
                    >
                      {isSpeaking === message.id ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                        </svg>
                      )}
                    </button>
                  </div>
                )}
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center ml-2 flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 text-white"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                    />
                  </svg>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start mb-4"
          >
            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center mr-2 flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 text-white"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                />
              </svg>
            </div>
            <div className="bg-gray-100 text-gray-800 rounded-lg px-4 py-2 border border-gray-200">
              <div className="flex space-x-1">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: 0 }}
                  className="w-2 h-2 bg-gray-500 rounded-full"
                />
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
                  className="w-2 h-2 bg-gray-500 rounded-full"
                />
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
                  className="w-2 h-2 bg-gray-500 rounded-full"
                />
              </div>
            </div>
          </motion.div>
        )}

        {pendingReminder && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50"
          >
            <div className="bg-black border border-gray-800 rounded-lg p-6 w-full max-w-md text-white shadow-xl">
              <h3 className="text-xl font-semibold mb-6">Hatırlatıcı Oluştur</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex flex-col">
                  <span className="text-gray-400 text-sm mb-1">Başlık</span>
                  <span className="text-white font-medium">{pendingReminder.title}</span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-gray-400 text-sm mb-1">Tarih</span>
                  <span className="text-white font-medium">{pendingReminder.date}</span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-gray-400 text-sm mb-1">Saat</span>
                  <span className="text-white font-medium">{pendingReminder.time}</span>
                </div>
                
                {pendingReminder.description && (
                  <div className="flex flex-col">
                    <span className="text-gray-400 text-sm mb-1">Açıklama</span>
                    <span className="text-white font-medium">{pendingReminder.description}</span>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleConfirmReminder}
                  className="flex-1 py-3 px-4 bg-black text-white border border-white rounded-md hover:bg-gray-900 transition-colors font-medium"
                >
                  Onayla
                </button>
                <button
                  onClick={handleRejectReminder}
                  className="flex-1 py-3 px-4 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors font-medium"
                >
                  İptal
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {pendingAppOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50"
          >
            <div className="bg-black border border-gray-800 rounded-lg p-6 w-full max-w-md text-white shadow-xl">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 relative flex-shrink-0">
                  <Image
                    src={pendingAppOpen.app.icon}
                    alt={pendingAppOpen.app.name}
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{pendingAppOpen.app.name}</h3>
                  <p className="text-gray-400">{pendingAppOpen.app.description}</p>
                </div>
              </div>
              
              <p className="mb-6 text-gray-300">
                "{pendingAppOpen.app.name}" uygulamasını açmak istiyor musunuz?
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleConfirmAppOpen}
                  className="flex-1 py-3 px-4 bg-black text-white border border-white rounded-md hover:bg-gray-900 transition-colors font-medium"
                >
                  Evet, Aç
                </button>
                <button
                  onClick={handleRejectAppOpen}
                  className="flex-1 py-3 px-4 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors font-medium"
                >
                  Hayır
                </button>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ChatGPT tarzı input alanı */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="relative flex items-center max-w-4xl mx-auto">
          <div className="relative flex-1 flex items-center bg-white border border-gray-300 rounded-full shadow-sm overflow-hidden">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Mesajınızı yazın..."
              className="flex-1 min-h-10 max-h-32 py-3 pl-4 pr-10 bg-transparent text-base font-medium text-gray-800 placeholder:text-gray-500 focus:outline-none resize-none"
              style={{ fontSize: '16px' }}
              disabled={isLoading || !!pendingReminder || !!pendingAppOpen}
              rows={1}
            />
            
            {/* Kamera butonu */}
            <button 
              className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none absolute left-1 bottom-1 hidden"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            </button>
            
            {/* Mikrofon butonu */}
            <button 
              onClick={toggleRecording}
              className={`p-2 rounded-full focus:outline-none absolute right-1 bottom-1 transition-all duration-300 ${
                isRecording 
                  ? 'bg-red-500 text-white animate-pulse shadow-lg' 
                  : isProcessingSpeech 
                    ? 'bg-yellow-500 text-white shadow-md' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              disabled={isLoading || !!pendingReminder || !!pendingAppOpen || isProcessingSpeech}
              title={
                isRecording 
                  ? 'Kaydı durdur' 
                  : isProcessingSpeech 
                    ? 'Konuşma işleniyor...' 
                    : 'Sesli mesaj gönder (mikrofon izni gerektirir)'
              }
            >
              {isRecording ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
                </svg>
              ) : isProcessingSpeech ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                </motion.div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>
          </div>
          
          {/* Gönder butonu */}
          <button 
            onClick={handleSendMessage}
            className={`ml-2 p-2 rounded-full ${input.trim() && !isLoading && !pendingReminder && !pendingAppOpen ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'} focus:outline-none`}
            disabled={!input.trim() || isLoading || !!pendingReminder || !!pendingAppOpen}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
        
        {/* Önerilen sorular */}
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          <button 
            onClick={() => setInput("Bugün için hatırlatıcı oluştur")}
            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-3 rounded-full transition-colors"
            disabled={isLoading || !!pendingReminder || !!pendingAppOpen}
          >
            Bugün için hatırlatıcı oluştur
          </button>
          <button 
            onClick={() => setInput("Alışveriş listesi oluştur")}
            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-3 rounded-full transition-colors"
            disabled={isLoading || !!pendingReminder || !!pendingAppOpen}
          >
            Alışveriş listesi oluştur
          </button>
          <button 
            onClick={() => setInput("Toplantı notları al")}
            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-3 rounded-full transition-colors"
            disabled={isLoading || !!pendingReminder || !!pendingAppOpen}
          >
            Toplantı notları al
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox; 