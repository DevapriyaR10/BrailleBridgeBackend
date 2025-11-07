import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Original upload info
  filename: String,
  originalname: String,
  mimetype: String,
  size: Number,

  // Cloudinary (original)
  cloudinary_public_id: String,
  cloudinary_url: String,

  // Converted outputs
  convertedType: { type: String, enum: ['braille', 'tts', 'none'], default: 'none' },
  converted_public_id: String,     // main converted file (brf or mp3)
  converted_url: String,

  // New: Braille text file info (unicode .txt)
  braille_unicode_public_id: String,
  braille_unicode_url: String,

}, { timestamps: true });

export default mongoose.model('File', fileSchema);
