import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "./index.js";

export const authRouter = Router();

const adminRole = z.enum(["OWNER", "ADMIN", "EDITOR"]);
const sessionClaims = z.object({
  sub: z.string().min(1),
  role: adminRole,
});

export type AdminRole = z.infer<typeof adminRole>;
export type AuthenticatedAdmin = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
};

const secret = () => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is required");
  return process.env.JWT_SECRET;
};

authRouter.post("/login", async (req, res) => {
  const body = z
    .object({ email: z.string().email(), password: z.string().min(10) })
    .parse(req.body);
  const admin = await prisma.admin.findUnique({ where: { email: body.email } });
  if (!admin || !admin.active || !(await bcrypt.compare(body.password, admin.passwordHash))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ sub: admin.id, role: admin.role }, secret(), { expiresIn: "8h" });
  return res
    .cookie("admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 28_800_000,
    })
    .json({
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
});

authRouter.post("/logout", (_req, res) =>
  res
    .clearCookie("admin_session", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })
    .status(204)
    .end(),
);

/**
 * Authenticate the signed subject, then refresh role and active state from the
 * database. This makes role changes and deactivation effective immediately
 * instead of trusting an up-to-eight-hour-old role claim.
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies.admin_session;
    if (!token) return res.status(401).json({ message: "Authentication required" });

    const claims = sessionClaims.parse(jwt.verify(token, secret()));
    const admin = await prisma.admin.findUnique({
      where: { id: claims.sub },
      select: { id: true, email: true, name: true, role: true, active: true },
    });
    if (!admin?.active) return res.status(401).json({ message: "Invalid session" });

    res.locals.admin = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    } satisfies AuthenticatedAdmin;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid session" });
  }
}

export function requireAdminRole(...roles: AdminRole[]) {
  const allowed = new Set<AdminRole>(roles);
  return (_req: Request, res: Response, next: NextFunction) => {
    const admin = res.locals.admin as AuthenticatedAdmin | undefined;
    if (!admin) return res.status(401).json({ message: "Authentication required" });
    if (!allowed.has(admin.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }
    return next();
  };
}

authRouter.get("/session", requireAdmin, (_req, res) =>
  res.json({ admin: res.locals.admin as AuthenticatedAdmin }),
);
