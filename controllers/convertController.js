import fetch from 'node-fetch';
import fs from 'fs';
import mammoth from 'mammoth';
import pdfjs from 'pdfjs-dist';
import { spawn } from 'child_process';
import { fallbackBraille } from '../utils/brailleConverter.js';
import { uploadBufferToCloudinary } from '../utils/cloudinary.js';
import { logger } from '../utils/logger.js';
import File from '../models/File.js';
import { generateSpeechAndUpload } from '../utils/ttsEngine.js'; // use new cloud-based TTS
const { getDocument } = pdfjs;

// -------------------
// Download file buffer from Cloudinary
// -------------------
const downloadFromCloudinary = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch Cloudinary file: ${res.statusText}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
};

// -------------------
// Extract text from file buffer
// -------------------
async function extractText(buffer, originalname) {
  const ext = originalname.split('.').pop().toLowerCase();

  if (ext === 'pdf') {
    const data = new Uint8Array(buffer);
    const pdf = await getDocument({ data }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(' ') + '\n';
    }
    return text;
  } else if (ext === 'doc' || ext === 'docx') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } else if (ext === 'txt' || ext === 'rtf' || ext === 'odt') {
    return buffer.toString('utf-8');
  } else {
    throw new Error(`Unsupported file type: ${ext}`);
  }
}

// -------------------
// Convert text to Braille using Liblouis (or fallback)
// -------------------
async function convertWithLiblouis(text) {
  const louTranslate = "C:\\liblouis-3.35.0-win64\\bin\\lou_translate.exe";
  const table = "C:\\liblouis-3.35.0-win64\\share\\liblouis\\tables\\en-us-g2.ctb";

  return new Promise((resolve) => {
    if (!fs.existsSync(louTranslate) || !fs.existsSync(table)) {
      const fallback = fallbackBraille(text);
      return resolve({ g2: fallback, unicode: fallback });
    }

    const g2Process = spawn(louTranslate, [table]);
    let g2Output = '';
    g2Process.stdout.on('data', data => g2Output += data.toString());
    g2Process.stdin.write(text + '\n');
    g2Process.stdin.end();

    g2Process.on('close', () => {
      const unicodeProcess = spawn(louTranslate, ['--dotsIO', table]);
      let unicodeOutput = '';
      unicodeProcess.stdout.on('data', data => unicodeOutput += data.toString());
      unicodeProcess.stdin.write(text + '\n');
      unicodeProcess.stdin.end();

      unicodeProcess.on('close', () => {
        resolve({
          g2: g2Output.trim() || fallbackBraille(text),
          unicode: unicodeOutput.trim() || fallbackBraille(text)
        });
      });
    });
  });
}

// -------------------
// Convert to Braille (uploads to Cloudinary)
// -------------------
export const convertToBrailleController = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) throw new Error('File not found in DB');
    if (!file.cloudinary_url) throw new Error('File missing Cloudinary URL');

    logger.debug(`Downloading source from Cloudinary: ${file.cloudinary_url}`);
    const buffer = await downloadFromCloudinary(file.cloudinary_url);

    const text = await extractText(buffer, file.originalname);
    const { g2, unicode } = await convertWithLiblouis(text);

    // Convert strings to Buffers for Cloudinary upload
    const g2Buffer = Buffer.from(g2, 'utf-8');
    const unicodeBuffer = Buffer.from(unicode, 'utf-8');

    logger.debug('Uploading Braille outputs to Cloudinary...');
    const g2Upload = await uploadBufferToCloudinary(g2Buffer, {
      folder: `braillebridge/converted/braille/${req.user._id}`,
      public_id: `${file._id}-g2`,
      resource_type: 'raw',
      format: 'brf',
    });

    const unicodeUpload = await uploadBufferToCloudinary(unicodeBuffer, {
      folder: `braillebridge/converted/braille/${req.user._id}`,
      public_id: `${file._id}-unicode`,
      resource_type: 'raw',
      format: 'txt',
    });

    file.convertedType = 'braille';
    file.converted_public_id = g2Upload.public_id;
    file.converted_url = g2Upload.secure_url;
    await file.save();

    logger.info('Braille files uploaded to Cloudinary successfully.');
    res.json({
      message: 'Braille conversion complete.',
      g2_url: g2Upload.secure_url,
      unicode_url: unicodeUpload.secure_url,
      g2Text: g2,
      unicodeText: unicode,
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: 'Braille conversion failed', error: err.message });
  }
};

// -------------------
// Convert to Speech (uploads to Cloudinary)
// -------------------
export const convertToSpeechController = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) throw new Error('File not found in DB');
    if (!file.cloudinary_url) throw new Error('File missing Cloudinary URL');

    const buffer = await downloadFromCloudinary(file.cloudinary_url);
    const text = await extractText(buffer, file.originalname);

    const ttsResult = await generateSpeechAndUpload(text, `${file._id}-tts`);

    file.convertedType = 'tts';
    file.converted_public_id = ttsResult.public_id;
    file.converted_url = ttsResult.secure_url;
    await file.save();

    logger.info(`TTS uploaded to Cloudinary: ${ttsResult.secure_url}`);
    res.json({
      message: 'TTS conversion complete.',
      tts_url: ttsResult.secure_url,
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: 'TTS conversion failed', error: err.message });
  }
};
