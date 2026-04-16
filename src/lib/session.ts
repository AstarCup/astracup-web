import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export interface SessionData {
  osuId: string;
  username: string;
  avatar_url?: string;
  [key: string]: any;
}

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "none" | "lax" | "strict";
  maxAge?: number;
  expires?: Date;
  path: string;
  domain?: string;
}

/**
 * 获取当前环境的生产状态
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * 获取默认的 Cookie 配置
 */
export function getDefaultCookieOptions(): CookieOptions {
  const production = isProduction();
  return {
    httpOnly: false, // 允许 JavaScript 访问
    secure: production, // 生产环境使用 HTTPS
    sameSite: production ? "none" : "lax", // 生产环境允许跨站
    path: "/",
  };
}

/**
 * 获取 Session Cookie 名称
 */
export function getSessionCookieName(): string {
  return "astra_session";
}

/**
 * 从请求中解析 Session 数据
 */
export async function parseSessionFromRequest(
  request?: NextRequest,
): Promise<SessionData | null> {
  try {
    if (request) {
      // 从 NextRequest 中获取 cookie
      const cookieStore = await request.cookies;
      const sessionCookie = cookieStore.get(getSessionCookieName());

      if (sessionCookie?.value) {
        return JSON.parse(sessionCookie.value);
      }
    } else {
      // 从 next/headers 中获取 cookie
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get(getSessionCookieName());

      if (sessionCookie?.value) {
        return JSON.parse(sessionCookie.value);
      }
    }

    return null;
  } catch (error) {
    console.error("Error parsing session:", error);
    return null;
  }
}

/**
 * 验证用户是否已登录
 */
export async function isUserAuthenticated(
  request?: NextRequest,
): Promise<boolean> {
  const session = await parseSessionFromRequest(request);
  return !!session?.osuId;
}

/**
 * 获取当前用户的 osuId
 */
export async function getCurrentUserId(
  request?: NextRequest,
): Promise<string | null> {
  const session = await parseSessionFromRequest(request);
  return session?.osuId || null;
}

/**
 * 获取当前用户的用户名
 */
export async function getCurrentUsername(
  request?: NextRequest,
): Promise<string | null> {
  const session = await parseSessionFromRequest(request);
  return session?.username || null;
}

/**
 * 设置 Session Cookie
 */
export function setSessionCookie(
  response: NextResponse,
  sessionData: SessionData,
  options?: Partial<CookieOptions>,
): NextResponse {
  const cookieOptions: CookieOptions = {
    ...getDefaultCookieOptions(),
    maxAge: 60 * 60 * 24 * 30, // 30 天
    ...options,
  };

  // 只在生产环境设置域名
  if (isProduction() && !cookieOptions.domain) {
    cookieOptions.domain = ".rino.ink"; // 允许所有子域名访问
  }

  response.cookies.set(
    getSessionCookieName(),
    JSON.stringify(sessionData),
    cookieOptions,
  );
  return response;
}

/**
 * 清除 Session Cookie
 */
export function clearSessionCookie(
  response: NextResponse,
  options?: Partial<CookieOptions>,
): NextResponse {
  const cookieOptions: CookieOptions = {
    ...getDefaultCookieOptions(),
    expires: new Date(0),
    ...options,
  };

  // 只在生产环境设置域名
  if (isProduction() && !cookieOptions.domain) {
    cookieOptions.domain = ".rino.ink";
  }

  response.cookies.set(getSessionCookieName(), "", cookieOptions);
  return response;
}

/**
 * 创建成功的 API 响应
 */
export function createSuccessResponse(
  data: any = null,
  message: string = "操作成功",
): NextResponse {
  return NextResponse.json({
    success: true,
    message,
    data,
  });
}

/**
 * 创建错误的 API 响应
 */
export function createErrorResponse(
  error: string,
  status: number = 500,
  details?: any,
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error,
      details,
    },
    { status },
  );
}

/**
 * 创建未认证的错误响应
 */
export function createUnauthorizedResponse(
  message: string = "未登录",
): NextResponse {
  return createErrorResponse(message, 401);
}

/**
 * 创建权限不足的错误响应
 */
export function createForbiddenResponse(
  message: string = "权限不足",
): NextResponse {
  return createErrorResponse(message, 403);
}

/**
 * 验证请求并获取用户 Session
 * 这是一个方便的包装函数，用于 API 路由
 */
export async function validateRequestAndGetSession(
  request: NextRequest,
): Promise<{ session: SessionData; response?: NextResponse }> {
  try {
    const session = await parseSessionFromRequest(request);

    if (!session?.osuId) {
      return {
        session: null as any,
        response: createUnauthorizedResponse(),
      };
    }

    return { session };
  } catch (error) {
    console.error("Error validating request:", error);
    return {
      session: null as any,
      response: createErrorResponse("请求验证失败", 500),
    };
  }
}
