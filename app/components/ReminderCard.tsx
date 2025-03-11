'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Card, { CardContent } from './Card';

export type Reminder = {
  id: string;
  title: string;
  date: Date;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
};

interface ReminderCardProps {
  reminder: Reminder;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
};

const ReminderCard = ({ reminder, onToggleComplete, onDelete }: ReminderCardProps) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card className={`overflow-hidden bg-white shadow-sm border border-gray-200 ${reminder.completed ? 'opacity-70' : ''}`}>
        <CardContent className="p-0">
          <div className="flex items-start p-4">
            <div className="mr-4 mt-1">
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={() => onToggleComplete(reminder.id)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  reminder.completed
                    ? 'bg-purple-600 border-purple-600'
                    : 'border-gray-400'
                }`}
              >
                {reminder.completed && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4 text-white"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                )}
              </motion.button>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3
                  className={`font-medium text-gray-800 ${
                    reminder.completed ? 'line-through text-gray-500' : ''
                  }`}
                >
                  {reminder.title}
                </h3>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    priorityColors[reminder.priority]
                  }`}
                >
                  {reminder.priority === 'low'
                    ? 'Düşük'
                    : reminder.priority === 'medium'
                    ? 'Orta'
                    : 'Yüksek'}
                </span>
              </div>
              {reminder.description && (
                <p
                  className={`text-sm mb-2 text-gray-600 ${
                    reminder.completed ? 'line-through text-gray-500' : ''
                  }`}
                >
                  {reminder.description}
                </p>
              )}
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {formatDate(reminder.date)}
                </p>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onDelete(reminder.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                    />
                  </svg>
                </motion.button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ReminderCard; 