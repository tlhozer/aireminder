'use client';

import { addReminder } from './storage';

// API istekleri için yardımcı fonksiyonlar

export type Message = {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
};

export type ChatRequest = {
  messages: Omit<Message, 'id' | 'timestamp'>[];
};

export type ChatResponse = {
  message: {
    content: string;
    role: 'assistant';
  };
  error?: string;
};

export type TTSResponse = {
  audio: string;
  error?: string;
};

export type WhisperResponse = {
  text: string;
  error?: string;
};

/**
 * Sohbet mesajını API'ye gönderir
 */
export async function sendChatMessage(messages: Omit<Message, 'id' | 'timestamp'>[]) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'API isteği başarısız oldu');
    }

    const data = await response.json();
    return data as ChatResponse;
  } catch (error) {
    console.error('Sohbet mesajı gönderme hatası:', error);
    return {
      message: {
        content: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
        role: 'assistant',
      },
      error: error instanceof Error ? error.message : 'Bilinmeyen hata',
    };
  }
}

/**
 * Metni sese dönüştürür
 */
export async function textToSpeech(text: string): Promise<TTSResponse> {
  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'TTS API isteği başarısız oldu');
    }

    const data = await response.json();
    return data as TTSResponse;
  } catch (error) {
    console.error('TTS hatası:', error);
    return {
      audio: '',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata',
    };
  }
}

/**
 * Ses kaydını metne dönüştürür (Whisper API)
 */
export async function speechToText(audioBlob: Blob): Promise<WhisperResponse> {
  try {
    console.log('speechToText fonksiyonu çağrıldı, blob boyutu:', audioBlob.size, 'tip:', audioBlob.type);
    
    // Blob kontrolü
    if (!audioBlob || audioBlob.size === 0) {
      throw new Error('Geçersiz ses kaydı: Boş veya çok küçük');
    }
    
    // Blob tipini kontrol et ve gerekirse yeniden adlandır
    let processedBlob = audioBlob;
    let blobType = audioBlob.type;
    
    // Eğer blob tipi desteklenen bir format değilse, yeniden adlandır
    const supportedFormats = ['audio/mp3', 'audio/mp4', 'audio/mpeg', 'audio/mpga', 'audio/wav', 'audio/webm', 'audio/ogg'];
    
    if (!supportedFormats.includes(blobType)) {
      console.log('Desteklenmeyen ses formatı:', blobType, 'mp3 olarak yeniden adlandırılıyor');
      // Blob'u yeniden oluştur ve tipini değiştir
      processedBlob = new Blob([await audioBlob.arrayBuffer()], { type: 'audio/mp3' });
      blobType = 'audio/mp3';
    }
    
    // FormData oluştur
    const formData = new FormData();
    
    // Dosya uzantısını belirle
    let extension = 'mp3';
    if (blobType.includes('webm')) extension = 'webm';
    if (blobType.includes('ogg')) extension = 'ogg';
    if (blobType.includes('wav')) extension = 'wav';
    if (blobType.includes('mp4')) extension = 'mp4';
    
    // Blob'u dosya olarak ekle
    const fileName = `audio.${extension}`;
    const file = new File([processedBlob], fileName, { type: blobType });
    formData.append('audio', file);
    
    console.log(`FormData oluşturuldu, dosya adı: ${fileName}, tip: ${blobType}, Whisper API'ye istek gönderiliyor...`);

    // API'ye istek gönder
    const response = await fetch('/api/whisper', {
      method: 'POST',
      body: formData,
    });

    console.log('Whisper API yanıtı alındı, durum:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Whisper API hata yanıtı:', errorData);
      throw new Error(errorData.error || `Whisper API isteği başarısız oldu: ${response.status}`);
    }

    const data = await response.json();
    console.log('Whisper API başarılı yanıt:', data);
    
    if (!data.text) {
      console.warn('Whisper API yanıtında metin yok');
    }
    
    return data as WhisperResponse;
  } catch (error) {
    console.error('Whisper hatası:', error);
    return {
      text: '',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata',
    };
  }
}

/**
 * Hatırlatıcı oluşturur
 */
export async function createReminder(title: string, date: string, time: string, description: string = '') {
  try {
    // Tarih formatını kontrol et
    const reminderDate = new Date(date);
    if (isNaN(reminderDate.getTime())) {
      throw new Error('Geçersiz tarih formatı');
    }

    // Hatırlatıcıyı ekle
    const newReminder = addReminder({
      title,
      date: reminderDate,
      time,
      description
    });

    if (!newReminder) {
      throw new Error('Hatırlatıcı eklenirken bir hata oluştu');
    }

    return {
      success: true,
      reminder: newReminder
    };
  } catch (error) {
    console.error('Hatırlatıcı oluşturma hatası:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    };
  }
} 