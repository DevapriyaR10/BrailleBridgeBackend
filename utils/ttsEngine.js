import fs from 'fs';
import fetch from 'node-fetch';
import googleTTS from 'google-tts-api';
import { uploadBufferToCloudinary } from './cloudinary.js';
import { logger } from './logger.js';

// Convert text → TTS audio → upload to Cloudinary
export const generateSpeechAndUpload = async (text, publicName = `tts-${Date.now()}`) => {
  try {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid text input for TTS');
    }

    // Get list of TTS audio URLs (auto-chunked for long text)
    const audioParts = await googleTTS.getAllAudioUrls(text, {
      lang: 'en',
      slow: false,
      host: 'https://translate.google.com',
    });

    logger.debug(`Generating TTS for ${audioParts.length} chunks...`);

    // Download each part and combine them
    const buffers = [];
    for (const { url } of audioParts) {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`TTS chunk fetch failed: ${response.status}`);
      const arrBuffer = await response.arrayBuffer();
      buffers.push(Buffer.from(arrBuffer));
    }

    // Merge all chunks into one MP3
    const combinedBuffer = Buffer.concat(buffers);

    // Optional: save locally (for debugging)
    // fs.writeFileSync(`debug-${publicName}.mp3`, combinedBuffer);

    // Upload combined audio to Cloudinary
    const folder = `braillebridge/converted/tts`;
    const result = await uploadBufferToCloudinary(combinedBuffer, {
      folder,
      public_id: publicName,
      resource_type: 'video', // audio is stored as video in Cloudinary
      format: 'mp3',
    });

    logger.info(`✅ TTS uploaded to Cloudinary: ${result.secure_url}`);
    return result; // includes secure_url, public_id, etc.
  } catch (err) {
    logger.error('❌ generateSpeechAndUpload error', err);
    throw err;
  }
};
