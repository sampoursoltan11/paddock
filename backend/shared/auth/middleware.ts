import { HttpRequest, HttpResponseInit } from '@azure/functions';
import { unauthorizedResponse } from '../utils/response';
import { logger } from '../utils/logger';

/**
 * Azure AD JWT Token validation middleware
 * For PoC, this is a simplified version. In production, use @azure/identity
 */

interface DecodedToken {
  oid: string; // Object ID (user ID)
  name: string;
  email: string;
  roles?: string[];
}

/**
 * Validate Azure AD Bearer token
 * This is a placeholder for PoC - in production, implement full JWT validation
 */
export async function validateToken(request: HttpRequest): Promise<DecodedToken | null> {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Missing or invalid Authorization header');
      return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // TODO: In production, implement actual JWT validation:
    // 1. Verify signature using Azure AD public keys
    // 2. Validate issuer, audience, expiration
    // 3. Check token claims

    // For PoC, we'll do a basic decode (NOT SECURE - PLACEHOLDER ONLY)
    const payload = parseJwt(token);

    if (!payload) {
      logger.warn('Invalid token format');
      return null;
    }

    // Return decoded token
    return {
      oid: payload.oid || 'anonymous',
      name: payload.name || 'Unknown User',
      email: payload.email || payload.preferred_username || 'unknown@toyota.com',
      roles: payload.roles || [],
    };

  } catch (error) {
    logger.error('Error validating token', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Check if user has required role
 */
export function hasRole(user: DecodedToken, requiredRole: string): boolean {
  if (!user.roles || user.roles.length === 0) {
    return false;
  }
  return user.roles.includes(requiredRole);
}

/**
 * Auth middleware wrapper
 */
export async function requireAuth(
  request: HttpRequest,
  requiredRole?: string
): Promise<{ authorized: boolean; user?: DecodedToken; response?: HttpResponseInit }> {
  const user = await validateToken(request);

  if (!user) {
    return {
      authorized: false,
      response: unauthorizedResponse('Invalid or missing authentication token'),
    };
  }

  // Check role if specified
  if (requiredRole && !hasRole(user, requiredRole)) {
    return {
      authorized: false,
      response: unauthorizedResponse('Insufficient permissions'),
    };
  }

  return {
    authorized: true,
    user,
  };
}

/**
 * Helper to parse JWT (basic decoder - NOT VALIDATION)
 * In production, use a proper JWT library like jsonwebtoken
 */
function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      Buffer.from(base64, 'base64')
        .toString('ascii')
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

export default { validateToken, hasRole, requireAuth };
