import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // original upload info
  filename: String,         // original filename (for display)
  originalname: String,
  mimetype: String,
  size: Number,

  // cloudinary (original)
  cloudinary_public_id: String,
  cloudinary_url: String,

  // converted output (braille / tts)
  convertedType: { type: String, enum: ['braille', 'tts', 'none'], default: 'none' },
  converted_public_id: String,
  converted_url: String,
}, { timestamps: true });

export default mongoose.model('File', fileSchema);
