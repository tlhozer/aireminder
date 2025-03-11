'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { App, apps, openApp } from '../lib/apps';
import { toast } from 'react-hot-toast';

type AppListProps = {
  className?: string;
};

const AppList: React.FC<AppListProps> = ({ className = '' }) => {
  const handleAppClick = async (app: App) => {
    try {
      const isNativeAppOpened = await openApp(app);
      if (isNativeAppOpened) {
        toast.success(`${app.name} uygulaması açıldı`);
      } else {
        toast.success(`${app.name} web sayfası açıldı`);
      }
    } catch (error) {
      toast.error(`${app.name} açılırken bir hata oluştu`);
      console.error('App opening error:', error);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 ${className}`}>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Uygulamalar</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {apps.map((app) => (
          <motion.div
            key={app.id}
            className="bg-white border border-gray-100 rounded-lg p-3 flex flex-col items-center cursor-pointer hover:shadow-md transition-shadow"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleAppClick(app)}
          >
            <div className="w-12 h-12 mb-2 relative">
              <Image
                src={app.icon}
                alt={app.name}
                width={48}
                height={48}
                className="object-contain"
              />
            </div>
            <h3 className="text-sm font-medium text-gray-800">{app.name}</h3>
            <p className="text-xs text-gray-500 text-center mt-1">{app.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AppList; 