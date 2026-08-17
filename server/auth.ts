import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "./index.js";
export const authRouter=Router();
const secret=()=>{if(!process.env.JWT_SECRET)throw new Error("JWT_SECRET is required");return process.env.JWT_SECRET};
authRouter.post("/login",async(req,res)=>{const body=z.object({email:z.string().email(),password:z.string().min(10)}).parse(req.body);const admin=await prisma.admin.findUnique({where:{email:body.email}});if(!admin||!admin.active||!await bcrypt.compare(body.password,admin.passwordHash))return res.status(401).json({message:"Invalid credentials"});const token=jwt.sign({sub:admin.id,role:admin.role},secret(),{expiresIn:"8h"});res.cookie("admin_session",token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",maxAge:28_800_000}).json({admin:{id:admin.id,email:admin.email,name:admin.name,role:admin.role}})});
authRouter.post("/logout",(_req,res)=>res.clearCookie("admin_session").status(204).end());
export function requireAdmin(req:Request,res:Response,next:NextFunction){try{const token=req.cookies.admin_session;if(!token)return res.status(401).json({message:"Authentication required"});res.locals.admin=jwt.verify(token,secret());next()}catch{return res.status(401).json({message:"Invalid session"})}}
