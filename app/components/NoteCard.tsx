'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Card, { CardContent, CardFooter } from './Card';

export type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  category?: string;
};

interface NoteCardProps {
  note: Note;
  onDelete: (id: string) => void;
  onEdit: (note: Note) => void;
}

const categoryColors = {
  work: 'bg-blue-100 text-blue-800',
  personal: 'bg-purple-100 text-purple-800',
  ideas: 'bg-green-100 text-green-800',
  default: 'bg-gray-100 text-gray-800',
};

const NoteCard = ({ note, onDelete, onEdit }: NoteCardProps) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getCategoryColor = (category?: string) => {
    if (!category) return categoryColors.default;
    return (
      categoryColors[category as keyof typeof categoryColors] || categoryColors.default
    );
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card className="h-full flex flex-col bg-white shadow-sm border border-gray-200">
        <CardContent className="p-4 flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-800">{note.title}</h3>
            {note.category && (
              <span
                className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(
                  note.category
                )}`}
              >
                {note.category}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">
            {note.content.length > 150
              ? `${note.content.substring(0, 150)}...`
              : note.content}
          </p>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between items-center border-t border-gray-200">
          <p className="text-xs text-gray-500">{formatDate(note.createdAt)}</p>
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onEdit(note)}
              className="text-gray-600 hover:text-gray-800"
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
                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
                />
              </svg>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDelete(note.id)}
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
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default NoteCard; 