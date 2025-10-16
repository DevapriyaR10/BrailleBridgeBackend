import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';

const generateToken = id => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) throw new Error('User already exists');
  const user = await User.create({ name, email, password });
  logger.debug(`User registered: ${email}`);
  res.status(201).json({ _id: user.id, name, email, token: generateToken(user._id) });
});

export const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && (await user.matchPassword(password))) {
    res.json({ _id: user.id, name: user.name, email, token: generateToken(user._id) });
  } else {
    res.status(401);
    throw new Error('Invalid credentials');
  }
});
