import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { authRouter, requireAdmin } from "./auth.js";

export const prisma = new PrismaClient();
const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(rateLimit({ windowMs: 60_000, limit: 120 }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use("/api/auth", authRouter);

const active = { status: "ACTIVE" as const };
app.get("/api/settings", async (_req,res)=>res.json(await prisma.siteSettings.findUnique({where:{id:"global"}})||{}));
app.get("/api/navigation", async (_req,res)=>res.json(await prisma.navigationItem.findMany({where:{active:true,parentId:null},include:{children:{where:{active:true},orderBy:{sortOrder:"asc"}}},orderBy:{sortOrder:"asc"}})));
app.get("/api/footer", async (_req,res)=>res.json({columns:await prisma.footerSection.findMany({where:{active:true},orderBy:{sortOrder:"asc"}})}));
app.get("/api/products", async (req,res)=>{const q=String(req.query.q||"");res.json(await prisma.product.findMany({where:{...active,...(q?{OR:[{title:{contains:q,mode:"insensitive"}},{description:{contains:q,mode:"insensitive"}},{brand:{name:{contains:q,mode:"insensitive"}}},{category:{name:{contains:q,mode:"insensitive"}}},{store:{name:{contains:q,mode:"insensitive"}}}]}:{})},include:{images:true,brand:true,category:true,store:true}}))});
app.get("/api/categories",async(_req,res)=>res.json(await prisma.category.findMany({where:active,orderBy:{sortOrder:"asc"}})));
app.get("/api/stores",async(_req,res)=>res.json(await prisma.store.findMany({where:{active:true}})));
app.get("/api/brands",async(_req,res)=>res.json(await prisma.brand.findMany({where:{active:true}})));
app.get("/api/deals",async(_req,res)=>res.json(await prisma.deal.findMany({where:{status:"ACTIVE",startsAt:{lte:new Date()},endsAt:{gt:new Date()}},include:{product:{include:{images:true,store:true}}}})));
app.get("/api/banners",async(_req,res)=>res.json(await prisma.banner.findMany({where:{status:"ACTIVE",OR:[{endsAt:null},{endsAt:{gt:new Date()}}]},orderBy:{sortOrder:"asc"}})));
app.get("/api/blog",async(_req,res)=>res.json(await prisma.blogPost.findMany({where:{status:"ACTIVE",publishedAt:{lte:new Date()}},include:{category:true},orderBy:{publishedAt:"desc"}})));
app.get("/api/homepage",async(_req,res)=>{
  const rows=await prisma.homepageSection.findMany({
    where:{visible:true},orderBy:{sortOrder:"asc"},
    include:{
      products:{orderBy:{sortOrder:"asc"},include:{product:{include:{images:{orderBy:{sortOrder:"asc"},take:1},store:true}}}},
      categories:{orderBy:{sortOrder:"asc"},include:{category:true}},
      stores:{orderBy:{sortOrder:"asc"},include:{store:true}},
    },
  });
  const needsBlog=rows.some(section=>section.type==="BLOG");
  const posts=needsBlog?await prisma.blogPost.findMany({where:{status:"ACTIVE",publishedAt:{lte:new Date()}},include:{category:true},orderBy:{publishedAt:"desc"},take:8}):[];
  const sections=rows.map(({products,categories,stores,...section})=>({
    ...section,
    products:products.map(({product})=>({...product,image:product.images[0]?.url})),
    categories:categories.map(({category})=>category),
    stores:stores.map(({store})=>store),
    posts:section.type==="BLOG"?posts:undefined,
  }));
  res.json({sections});
});
app.post("/api/newsletter",async(req,res)=>{const body=z.object({email:z.string().email()}).parse(req.body);res.status(201).json(await prisma.newsletterSubscriber.upsert({where:{email:body.email},create:body,update:{status:"ACTIVE"}}))});
app.get("/api/admin/overview",requireAdmin,async(_req,res)=>{const [products,deals,stores,categories,posts,subscribers]=await Promise.all([prisma.product.count(),prisma.deal.count({where:{status:"ACTIVE"}}),prisma.store.count(),prisma.category.count(),prisma.blogPost.count(),prisma.newsletterSubscriber.count()]);res.json({products,deals,stores,categories,posts,subscribers})});
app.listen(Number(process.env.PORT||4000),()=>console.log("API listening on :4000"));
