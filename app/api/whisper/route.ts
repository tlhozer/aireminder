import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import os from 'os';

// OpenAI istemcisini oluştur
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Desteklenen ses formatları
const SUPPORTED_FORMATS = ['flac', 'm4a', 'mp3', 'mp4', 'mpeg', 'mpga', 'oga', 'ogg', 'wav', 'webm'];

export async function POST(req: Request) {
  let tempFilePath = '';
  
  try {
    // Formdan ses dosyasını al
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Ses dosyası bulunamadı' },
        { status: 400 }
      );
    }

    console.log('Ses dosyası alındı:', audioFile.name, audioFile.type, audioFile.size);
    
    // Dosya uzantısını kontrol et
    const fileExtension = audioFile.name.split('.').pop()?.toLowerCase() || '';
    
    if (!SUPPORTED_FORMATS.includes(fileExtension)) {
      console.warn(`Desteklenmeyen dosya uzantısı: ${fileExtension}, desteklenen formatlar:`, SUPPORTED_FORMATS);
    }

    try {
      // Ses dosyasını buffer'a çevir
      const buffer = Buffer.from(await audioFile.arrayBuffer());
      console.log('Buffer oluşturuldu, boyut:', buffer.length);
      
      // Geçici dosya oluştur - OpenAI'nin desteklediği bir format kullan
      const tempDir = os.tmpdir();
      
      // Dosya uzantısını belirle
      let extension = fileExtension;
      if (!SUPPORTED_FORMATS.includes(extension)) {
        extension = 'mp3'; // Varsayılan olarak mp3 kullan
      }
      
      tempFilePath = path.join(tempDir, `whisper-${Date.now()}.${extension}`);
      
      // Buffer'ı geçici dosyaya yaz
      fs.writeFileSync(tempFilePath, buffer);
      console.log('Geçici dosya oluşturuldu:', tempFilePath);
      
      // OpenAI Whisper API'ye istek gönder
      const response = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: 'whisper-1',
        language: 'tr', // Türkçe dil desteği
        response_format: 'json', // JSON formatında yanıt iste
      });

      console.log('Whisper API yanıtı:', response);

      // Yanıtı döndür
      return NextResponse.json({
        text: response.text,
      });
    } catch (apiError) {
      console.error('Whisper API isteği hatası:', apiError);
      
      // Daha detaylı hata mesajı
      let errorMessage = 'Ses tanıma sırasında bir hata oluştu.';
      
      if (apiError instanceof Error) {
        errorMessage += ` Hata: ${apiError.message}`;
        
        // OpenAI API hata mesajını kontrol et
        if (apiError.message.includes('Invalid file format') || apiError.message.includes('400')) {
          errorMessage = `Ses tanıma sırasında bir hata oluştu. Hata: 400 Invalid file format. Supported formats: ['${SUPPORTED_FORMATS.join("', '")}']`;
        }
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    } finally {
      // Geçici dosyayı temizle
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
          console.log('Geçici dosya silindi:', tempFilePath);
        } catch (cleanupError) {
          console.error('Geçici dosya temizleme hatası:', cleanupError);
        }
      }
    }
  } catch (error) {
    console.error('Genel Whisper API hatası:', error);
    
    // Genel hata mesajı
    let errorMessage = 'Ses tanıma sırasında bir hata oluştu. Lütfen tekrar deneyin.';
    
    if (error instanceof Error) {
      errorMessage += ` Hata: ${error.message}`;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 