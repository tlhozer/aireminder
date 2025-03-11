import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ChatRequest } from '@/app/lib/api';
import systemMessage from '@/app/prompts/system-message.json';

// OpenAI istemcisini oluştur
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json() as ChatRequest;
    const messages = body.messages;

    // Sistem mesajını ekle
    const allMessages = [
      { role: "system", content: systemMessage.content },
      ...messages
    ];

    // OpenAI API'sine istek gönder
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: allMessages,
      temperature: 0.7,
      max_tokens: 500,
    });

    // Yanıtı döndür
    return NextResponse.json({
      message: {
        content: response.choices[0].message.content,
        role: 'assistant',
      },
    });
  } catch (error) {
    console.error('OpenAI API hatası:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu. Lütfen tekrar deneyin.' },
      { status: 500 }
    );
  }
} 