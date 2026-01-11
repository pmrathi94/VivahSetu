import { Request, Response, NextFunction } from 'express';
import { supabase, supabaseClient, supabaseAdmin } from '../config/supabase';
import { createAndSendOtp, verifyOtp } from '../lib/otp';

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

export async function forgotPasswordController(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const redirectTo = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?email=${encodeURIComponent(
      email
    )}`;

    const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo
    } as any);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    next(error);
  }
}

export async function resetPasswordController(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Email and newPassword are required' });
    }

    // Find user by email
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (userErr || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // As an admin, update the user's password
    const { data: updated, error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: newPassword
    } as any);

    if (updateErr) {
      return res.status(400).json({ message: updateErr.message });
    }

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
}

export async function sendOtpController(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, type } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const { preview } = await createAndSendOtp(email, type || 'reset');

    res.json({ message: 'OTP sent', preview });
  } catch (error) {
    next(error);
  }
}

export async function verifyOtpController(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, code, type } = req.body;
    if (!email || !code) return res.status(400).json({ message: 'Email and code are required' });

    const ok = await verifyOtp(email, code, type || 'reset');
    if (!ok) return res.status(400).json({ message: 'Invalid or expired code' });

    res.json({ message: 'OTP verified' });
  } catch (error) {
    next(error);
  }
}
