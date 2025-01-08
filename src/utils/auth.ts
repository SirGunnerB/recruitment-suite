import bcrypt from 'bcryptjs';
import { db } from '../database/db';

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const createUser = async (
  username: string,
  password: string,
  email: string,
  role: 'CEO' | 'CFO' | 'Superadmin' | 'Admin' | 'User' | 'Reception'
) => {
  const hashedPassword = await hashPassword(password);
  return db.users.add({
    username,
    password: hashedPassword,
    email,
    role
  });
};

export const loginUser = async (username: string, password: string) => {
  const user = await db.users.where('username').equals(username).first();
  
  if (!user) {
    throw new Error('User not found');
  }

  const isValid = await verifyPassword(password, user.password);
  
  if (!isValid) {
    throw new Error('Invalid password');
  }

  // Remove password from returned user object
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};
