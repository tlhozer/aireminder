import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// OpenAI istemcisini oluştur
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'Text parametresi gereklidir' },
        { status: 400 }
      );
    }

    // OpenAI TTS API'sine istek gönder
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: text,
    });

    // MP3'ü ArrayBuffer'a dönüştür
    const buffer = await mp3.arrayBuffer();
    
    // ArrayBuffer'ı Base64'e dönüştür
    const base64Audio = Buffer.from(buffer).toString('base64');

    // Base64 formatında ses verisini döndür
    return NextResponse.json({
      audio: base64Audio,
    });
  } catch (error) {
    console.error('TTS API hatası:', error);
    return NextResponse.json(
      { error: 'Ses oluşturulurken bir hata oluştu' },
      { status: 500 }
    );
  }
} 