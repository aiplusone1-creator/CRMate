import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase is not configured on the server' },
        { status: 500 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required to update password' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { newPassword, confirmPassword } = body;

    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json(
        { error: 'New password is required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Require at least one letter and at least one number
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);

    if (!hasLetter || !hasNumber) {
      return NextResponse.json(
        { error: 'Password must contain at least one letter and one number' },
        { status: 400 }
      );
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Password confirmation does not match' },
        { status: 400 }
      );
    }

    // Update password in Supabase Auth and reset the must_change_password flag
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
      data: {
        must_change_password: false,
        password_changed_at: new Date().toISOString(),
      },
    });

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      );
    }

    // Authoritative server-side clearing of app_metadata (tamper-proof from client)
    const admin = createAdminClient();
    if (admin) {
      try {
        await admin.auth.admin.updateUserById(user.id, {
          app_metadata: {
            must_change_password: false,
          },
        });
      } catch (adminErr) {
        console.warn('Could not update app_metadata for user:', adminErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Password successfully updated and session refreshed.',
      user: {
        id: user.id,
        email: user.email,
        must_change_password: false,
      },
    });
  } catch (error: any) {
    console.error('Password change exception:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update password' },
      { status: 500 }
    );
  }
}
