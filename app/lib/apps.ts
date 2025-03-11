export type App = {
  id: string;
  name: string;
  description: string;
  icon: string;
  webUrl: string;
  appUrl?: string; // Mobil uygulama URL'si (deep link)
  keywords?: string[]; // Arama kelimeleri
};

// Desteklenen uygulamaların listesi
export const apps: App[] = [
  {
    id: 'google',
    name: 'Google',
    description: 'Web araması yapın',
    icon: '/icons/google.svg',
    webUrl: 'https://www.google.com',
    appUrl: 'googlechrome://',
    keywords: ['google', 'arama', 'search', 'chrome']
  },
  {
    id: 'youtube',
    name: 'YouTube',
    description: 'Video izleyin',
    icon: '/icons/youtube.svg',
    webUrl: 'https://www.youtube.com',
    appUrl: 'youtube://',
    keywords: ['youtube', 'video', 'izle', 'watch', 'müzik', 'music']
  },
  {
    id: 'maps',
    name: 'Google Maps',
    description: 'Konum ve yol tarifi bulun',
    icon: '/icons/maps.svg',
    webUrl: 'https://maps.google.com',
    appUrl: 'comgooglemaps://',
    keywords: ['maps', 'harita', 'konum', 'yol', 'tarif', 'google maps', 'haritalar']
  },
  {
    id: 'spotify',
    name: 'Spotify',
    description: 'Müzik dinleyin',
    icon: '/icons/spotify.svg',
    webUrl: 'https://open.spotify.com',
    appUrl: 'spotify://',
    keywords: ['spotify', 'müzik', 'music', 'dinle', 'listen', 'şarkı', 'song']
  },
  {
    id: 'twitter',
    name: 'Twitter',
    description: 'Güncel olayları takip edin',
    icon: '/icons/twitter.svg',
    webUrl: 'https://twitter.com',
    appUrl: 'twitter://',
    keywords: ['twitter', 'tweet', 'sosyal medya', 'social media']
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Fotoğraf ve video paylaşın',
    icon: '/icons/instagram.svg',
    webUrl: 'https://www.instagram.com',
    appUrl: 'instagram://',
    keywords: ['instagram', 'insta', 'foto', 'fotoğraf', 'photo', 'sosyal medya', 'social media']
  }
];

// Uygulama açma fonksiyonu
export const openApp = (app: App, query?: string): Promise<boolean> => {
  return new Promise((resolve) => {
    // Eğer müzik açma isteği varsa
    if (query && (app.id === 'youtube' || app.id === 'spotify')) {
      return openMusic(app, query).then(resolve);
    }
    
    // Mobil uygulama URL'si varsa önce onu deneyelim
    if (app.appUrl && typeof window !== 'undefined') {
      // Uygulama URL'sini açmayı dene
      const start = Date.now();
      const appWindow = window.open(app.appUrl);
      
      // Uygulama açıldı mı kontrol et
      setTimeout(() => {
        // Eğer 500ms içinde sayfa değişmediyse, uygulama açılmamış demektir
        if (Date.now() - start < 1000) {
          // Uygulama açılamadı, web sayfasını aç
          window.open(app.webUrl, '_blank');
          resolve(false);
        } else {
          resolve(true);
        }
      }, 500);
      
      return;
    }
    
    // Mobil uygulama URL'si yoksa veya tarayıcıda çalışmıyorsa web sayfasını aç
    if (typeof window !== 'undefined') {
      window.open(app.webUrl, '_blank');
    }
    resolve(false);
  });
};

// Müzik açma fonksiyonu
export const openMusic = (app: App, query: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    
    // Arama sorgusunu URL için kodla
    const encodedQuery = encodeURIComponent(query);
    
    // Platform'a göre URL oluştur
    let url = '';
    if (app.id === 'youtube') {
      url = `${app.webUrl}/results?search_query=${encodedQuery}`;
      
      // Mobil cihazlarda YouTube uygulamasını açmayı dene
      if (app.appUrl && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        url = `${app.appUrl}//search?q=${encodedQuery}`;
      }
    } else if (app.id === 'spotify') {
      url = `${app.webUrl}/search/${encodedQuery}`;
      
      // Mobil cihazlarda Spotify uygulamasını açmayı dene
      if (app.appUrl && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        url = `${app.appUrl}//search/${encodedQuery}`;
      }
    }
    
    if (url) {
      window.open(url, '_blank');
      resolve(true);
    } else {
      resolve(false);
    }
  });
};

// Uygulama ID'sine göre uygulama bulma
export const findAppById = (id: string): App | undefined => {
  return apps.find(app => app.id === id);
};

// Uygulama adına göre uygulama bulma (kısmi eşleşme)
export const findAppByName = (name: string): App | undefined => {
  const lowerName = name.toLowerCase();
  return apps.find(app => 
    app.name.toLowerCase().includes(lowerName) || 
    app.id.toLowerCase().includes(lowerName) ||
    (app.keywords && app.keywords.some(keyword => keyword.toLowerCase().includes(lowerName)))
  );
};

// Metinde uygulama açma komutu var mı kontrol et
export const checkForAppCommand = (text: string): { app: App; command: string; query?: string } | null => {
  // Müzik açma komutlarını tanımlayan regex
  const musicCommandRegex = /(youtube'dan|youtube'den|youtube dan|youtube den|spotify'dan|spotify'den|spotify dan|spotify den)\s+(.+?)\s+(aç|açar\s+mısın|açabilir\s+misin|oynat|çal|dinle|play)/i;
  
  // Önce müzik açma komutunu kontrol et
  const musicMatch = text.match(musicCommandRegex);
  if (musicMatch) {
    const platform = musicMatch[1].toLowerCase().includes('youtube') ? 'youtube' : 'spotify';
    const query = musicMatch[2].trim();
    const app = apps.find(a => a.id === platform);
    
    if (app) {
      return { app, command: 'aç', query };
    }
  }
  
  // Uygulama açma komutlarını tanımlayan regex
  // Daha geniş bir komut yelpazesi için regex'i genişlettim
  const appCommandRegex = /(aç|açar\s+mısın|açabilir\s+misin|başlat|çalıştır|göster|open|start|run|show|launch|execute|play|oynat|çal)\s+([a-zA-ZğüşıöçĞÜŞİÖÇ\s]+)(\s|$|\.|\?|!)/i;
  
  // Metinde komut var mı kontrol et
  const match = text.match(appCommandRegex);
  if (!match) return null;
  
  // Komut ve uygulama adını al
  const command = match[1].toLowerCase();
  const appName = match[2].trim().toLowerCase();
  
  // Tüm uygulamaları kontrol et
  for (const app of apps) {
    // Uygulama adı veya anahtar kelimelerden biriyle eşleşiyor mu
    if (
      app.name.toLowerCase().includes(appName) || 
      appName.includes(app.name.toLowerCase()) ||
      app.id.toLowerCase().includes(appName) || 
      appName.includes(app.id.toLowerCase()) ||
      (app.keywords && app.keywords.some(keyword => 
        keyword.toLowerCase().includes(appName) || 
        appName.includes(keyword.toLowerCase())
      ))
    ) {
      return { app, command };
    }
  }
  
  // Eğer tam eşleşme bulunamadıysa, kısmi eşleşmeleri kontrol et
  for (const app of apps) {
    // Uygulama adını kelimelere ayır
    const appNameWords = app.name.toLowerCase().split(/\s+/);
    const appKeywords = app.keywords || [];
    
    // Aranan uygulama adını kelimelere ayır
    const searchWords = appName.split(/\s+/);
    
    // Herhangi bir kelime eşleşiyor mu kontrol et
    for (const word of searchWords) {
      if (word.length < 3) continue; // Çok kısa kelimeleri atla
      
      if (
        appNameWords.some(nameWord => nameWord.includes(word) || word.includes(nameWord)) ||
        appKeywords.some(keyword => keyword.toLowerCase().includes(word) || word.includes(keyword.toLowerCase()))
      ) {
        return { app, command };
      }
    }
  }
  
  return null;
}; 