// =============================================================================
// POST /api/login
// Validates user credentials against /data/users.json
//
// ⚠️ VERCEL DEPLOYMENT NOTE:
// This route reads from /data/users.json using Node.js `fs` module.
// On Vercel, files in /data/ are read-only and persist as part of the deployment.
// For mutable data (results), replace fs.writeFile with:
//   - Vercel KV: import { kv } from '@vercel/kv'; await kv.set(key, value);
//   - MongoDB Atlas: Use mongoose or mongodb driver
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import type { UsersData, LoginPayload } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: LoginPayload = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // TO REPLACE FOR VERCEL KV: const usersRaw = await kv.get('users');
    const usersPath = path.join(process.cwd(), 'data', 'users.json');
    const usersRaw = fs.readFileSync(usersPath, 'utf-8');
    const usersData: UsersData = JSON.parse(usersRaw);

    const user = usersData.users.find(
      (u) => u.username === username && u.password === password
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      role: user.role,
      username: user.username,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
