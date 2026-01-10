import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export async function signupController(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, fullName, phone, role } = req.body;

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: data.user?.id,
        email,
        full_name: fullName,
        phone,
        role: role || 'user'
      });

    if (insertError) {
      return res.status(400).json({ message: insertError.message });
    }

    res.status(201).json({
      message: 'Signup successful',
      user: { id: data.user?.id, email, fullName },
      token: data.session?.access_token
    });
  } catch (error) {
    next(error);
  }
}

export async function loginController(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ message: error.message });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user?.id)
      .single();

    res.json({
      message: 'Login successful',
      user: userData,
      token: data.session?.access_token
    });
  } catch (error) {
    next(error);
  }
}

export async function logoutController(req: Request, res: Response, next: NextFunction) {
  try {
    await supabase.auth.signOut();
    res.json({ message: 'Logout successful' });
  } catch (error) {
    next(error);
  }
}
