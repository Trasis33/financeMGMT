import { Request, Response, CookieOptions } from 'express';
import { prisma } from '../index';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

type PrismaTransaction = Omit<
  typeof prisma,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
> & {
  refreshTokens: typeof prisma.refreshTokens;
};

const ACCESS_TOKEN_EXPIRY = '15m';  // 15 minutes
const REFRESH_TOKEN_EXPIRY = '30d'; // 30 days

const createCookieOptions = (maxAge: number): CookieOptions => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge,
  path: '/'
});

interface JwtPayload {
  userId: number;
  tokenId?: string;
}

interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

interface AuthResponse {
  user: {
    id: number;
    email: string;
    name: string;
  };
  token: string;
}

// Generate tokens
const generateTokens = async (userId: number, rememberMe: boolean = false) => {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!jwtSecret || !jwtRefreshSecret) {
    throw new Error('JWT secrets not configured');
  }

  // Create access token
  const accessToken = jwt.sign({ userId }, jwtSecret, {
    expiresIn: ACCESS_TOKEN_EXPIRY
  });

  // Calculate expiry for refresh token
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 1));

  try {
    // Create and update refresh token in a transaction
    return await prisma.$transaction(async (tx: PrismaTransaction) => {
      // First create the token record
      const createdToken = await tx.refreshTokens.create({
        data: {
          token: uuidv4(), // Temporary token
          userId,
          expiresAt,
          userAgent: '',
          ipAddress: ''
        }
      });

      // Create JWT with the token ID
      const refreshToken = jwt.sign(
        { userId, tokenId: createdToken.id },
        jwtRefreshSecret,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
      );

      // Update the token record with the JWT
      await tx.refreshTokens.update({
        where: { id: createdToken.id },
        data: { token: refreshToken }
      });

      return { accessToken, refreshToken };
    });
  } catch (error) {
    console.error('Token generation error:', error);
    throw error;
  }
};

// Login controller
export const login = async (req: Request<{}, {}, LoginRequest>, res: Response): Promise<void> => {
  const { email, password, rememberMe = false } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !await bcrypt.compare(password, user.password)) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  const { accessToken, refreshToken } = await generateTokens(user.id, rememberMe);
  const cookieOptions = createCookieOptions(rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000);

  console.log('Setting login cookie:', { 
    rememberMe, 
    options: cookieOptions 
  });

  res.cookie('refresh_token', refreshToken, cookieOptions);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    },
    token: accessToken
  });
};

// Register controller
export const register = async (req: Request<{}, {}, RegisterRequest>, res: Response): Promise<void> => {
  const { email, password, name } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    res.status(400).json({ message: 'Email already registered' });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name
    }
  });

  const { accessToken, refreshToken } = await generateTokens(user.id);
  const cookieOptions = createCookieOptions(24 * 60 * 60 * 1000);

  console.log('Setting register cookie:', { options: cookieOptions });
  res.cookie('refresh_token', refreshToken, cookieOptions);

  res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    },
    token: accessToken
  });
};

// Refresh token controller
export const refresh = async (req: Request, res: Response): Promise<void> => {
  console.log('Refresh request received:', {
    cookies: req.cookies,
    headers: req.headers
  });

  const refreshToken = req.cookies.refresh_token;
  
  if (!refreshToken) {
    console.log('No refresh token in cookies');
    res.status(401).json({ message: 'No refresh token provided' });
    return;
  }

  try {
    if (!process.env.JWT_REFRESH_SECRET) {
      console.error('JWT_REFRESH_SECRET not configured');
      res.status(500).json({ message: 'Server configuration error' });
      return;
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET) as JwtPayload;
    console.log('Decoded refresh token:', { userId: decoded.userId, tokenId: decoded.tokenId });
    
    const storedToken = await prisma.refreshTokens.findFirst({
      where: {
        token: refreshToken,
        userId: decoded.userId,
        isRevoked: false,
        expiresAt: { gt: new Date() }
      },
      include: { user: true }
    });

    if (!storedToken) {
      console.log('No valid stored token found');
      res.status(401).json({ message: 'Invalid refresh token' });
      return;
    }

    console.log('Valid stored token found:', { userId: storedToken.userId });

    const isLongTermToken = storedToken.expiresAt > new Date(Date.now() + 24 * 60 * 60 * 1000);
    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(
      decoded.userId,
      isLongTermToken
    );

    await prisma.refreshTokens.update({
      where: { id: storedToken.id },
      data: { isRevoked: true }
    });

    const cookieOptions = createCookieOptions(
      isLongTermToken ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
    );

    console.log('Setting new refresh token cookie:', { 
      isLongTermToken,
      options: cookieOptions
    });

    res.cookie('refresh_token', newRefreshToken, cookieOptions);

    res.json({
      user: {
        id: storedToken.user.id,
        email: storedToken.user.email,
        name: storedToken.user.name
      },
      token: accessToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

// Logout controller
export const logout = async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies.refresh_token;

  if (refreshToken) {
    await prisma.refreshTokens.updateMany({
      where: { token: refreshToken },
      data: { isRevoked: true }
    });
  }

  res.clearCookie('refresh_token', createCookieOptions(0));
  res.json({ message: 'Logged out successfully' });
};

// Revoke all sessions controller
export const revokeAllSessions = async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId;

  if (!userId) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  await prisma.refreshTokens.updateMany({
    where: {
      userId,
      isRevoked: false
    },
    data: { isRevoked: true }
  });

  res.clearCookie('refresh_token', createCookieOptions(0));
  res.json({ message: 'All sessions revoked successfully' });
};