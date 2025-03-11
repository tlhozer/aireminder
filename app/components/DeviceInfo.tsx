'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

type DeviceInfoProps = {
  className?: string;
};

const DeviceInfo: React.FC<DeviceInfoProps> = ({ className = '' }) => {
  const [deviceType, setDeviceType] = useState<string>('');
  const [osInfo, setOsInfo] = useState<string>('');
  const [shakeDetected, setShakeDetected] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState({
    motion: false
  });

  // Cihaz türünü tespit et
  useEffect(() => {
    const detectDeviceType = () => {
      const userAgent = navigator.userAgent;
      
      if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
        return 'Tablet';
      }
      if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
        return 'Mobil';
      }
      return 'Bilgisayar';
    };

    // İşletim sistemini tespit et
    const detectOS = () => {
      const userAgent = navigator.userAgent;
      
      if (/Windows/i.test(userAgent)) return 'Windows';
      if (/Macintosh|Mac OS X/i.test(userAgent)) return 'macOS';
      if (/Android/i.test(userAgent)) return 'Android';
      if (/iPhone|iPad|iPod/i.test(userAgent)) return 'iOS';
      if (/Linux/i.test(userAgent)) return 'Linux';
      
      return 'Bilinmeyen İşletim Sistemi';
    };

    setDeviceType(detectDeviceType());
    setOsInfo(detectOS());
  }, []);

  // Sarsıntı algılama
  useEffect(() => {
    let lastX = 0;
    let lastY = 0;
    let lastZ = 0;
    const threshold = 15; // Sarsıntı eşiği
    let shakeTimeout: NodeJS.Timeout | null = null;
    
    const handleMotion = (event: DeviceMotionEvent) => {
      const acceleration = event.accelerationIncludingGravity;
      
      if (!acceleration || acceleration.x === null || acceleration.y === null || acceleration.z === null) {
        return;
      }
      
      const deltaX = Math.abs(acceleration.x - lastX);
      const deltaY = Math.abs(acceleration.y - lastY);
      const deltaZ = Math.abs(acceleration.z - lastZ);
      
      if ((deltaX > threshold && deltaY > threshold) || 
          (deltaX > threshold && deltaZ > threshold) || 
          (deltaY > threshold && deltaZ > threshold)) {
        
        // Sarsıntı algılandı
        setShakeDetected(true);
        
        // 3 saniye sonra bildirimi kaldır
        if (shakeTimeout) clearTimeout(shakeTimeout);
        shakeTimeout = setTimeout(() => {
          setShakeDetected(false);
        }, 3000);
      }
      
      lastX = acceleration.x;
      lastY = acceleration.y;
      lastZ = acceleration.z;
    };
    
    if (window.DeviceMotionEvent) {
      setIsSupported(prev => ({ ...prev, motion: true }));
      
      // DeviceMotion izni iste (iOS 13+ için gerekli)
      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        // iOS 13+ için izin iste
        document.addEventListener('click', async () => {
          try {
            const permissionState = await DeviceMotionEvent.requestPermission();
            if (permissionState === 'granted') {
              window.addEventListener('devicemotion', handleMotion);
            }
          } catch (error) {
            console.error('Hareket sensörü izni alınamadı:', error);
          }
        }, { once: true });
      } else {
        // Diğer cihazlar için doğrudan dinle
        window.addEventListener('devicemotion', handleMotion);
      }
      
      return () => {
        window.removeEventListener('devicemotion', handleMotion);
        if (shakeTimeout) clearTimeout(shakeTimeout);
      };
    } else {
      console.log('Bu cihaz DeviceMotion API desteklemiyor');
    }
  }, []);

  return (
    <div className={`bg-black border border-gray-800 rounded-lg p-4 ${className}`}>
      <h2 className="text-xl font-semibold text-white mb-4">Cihaz Bilgileri</h2>
      
      <div className="space-y-3">
        <div>
          <p className="text-gray-400 text-sm">Cihaz Türü</p>
          <p className="text-white font-medium">{deviceType}</p>
        </div>
        
        <div>
          <p className="text-gray-400 text-sm">İşletim Sistemi</p>
          <p className="text-white font-medium">{osInfo}</p>
        </div>
        
        {!isSupported.motion && (
          <div className="text-yellow-500 text-sm">
            Bu cihaz hareket sensörü API'sini desteklemiyor.
          </div>
        )}
      </div>
      
      {/* Sarsıntı bildirimi */}
      {shakeDetected && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mt-4 p-3 bg-yellow-500 text-black rounded-lg font-medium"
        >
          Hey! Sarsıntı algılandı! 📱
        </motion.div>
      )}
    </div>
  );
};

export default DeviceInfo; 