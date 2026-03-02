
import { User } from '../types';
import { api } from './api';

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const user = await api.getUserByEmail(email);
    
    if (!user || user.password !== password) {
      throw new Error('Invalid email or password');
    }

    // Return user without password for safety
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
};
