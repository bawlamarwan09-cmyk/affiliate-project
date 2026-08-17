import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { authRouter, requireAdmin } from "./auth.js";
import { adminRouter, apiError } from "./admin.js";

export const prisma = new PrismaClient();
const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(rateLimit({ windowMs: 60_000, limit: 120 }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter(prisma));

const active = { status: "ACTIVE" as const };
app.get("/api/settings", async (_req,res)=>res.json(await prisma.siteSettings.findUnique({where:{id:"global"}})||{}));
app.get("/api/navigation", async (_req,res)=>res.json(await prisma.navigationItem.findMany({where:{active:true,parentId:null},include:{children:{where:{active:true},orderBy:{sortOrder:"asc"}}},orderBy:{sortOrder:"asc"}})));
app.get("/api/footer", async (_req,res)=>res.json({columns:await prisma.footerSection.findMany({where:{active:true},orderBy:{sortOrder:"asc"}})}));
app.get("/api/products", async (req,res)=>{const q=String(req.query.q||"");res.json(await prisma.product.findMany({where:{...active,...(q?{OR:[{title:{contains:q,mode:"insensitive"}},{description:{contains:q,mode:"insensitive"}},{brand:{name:{contains:q,mode:"insensitive"}}},{category:{name:{contains:q,mode:"insensitive"}}},{store:{name:{contains:q,mode:"insensitive"}}}]}:{})},include:{images:true,brand:true,category:true,store:true}}))});
app.get("/api/products/:slug",async(req,res)=>{const product=await prisma.product.findFirst({where:{slug:req.params.slug,status:"ACTIVE"},include:{images:{orderBy:{sortOrder:"asc"}},brand:true,category:true,store:true,deals:{where:{status:"ACTIVE",startsAt:{lte:new Date()},endsAt:{gt:new Date()}},orderBy:{discountPercent:"desc"},take:1}}});if(!product)return res.status(404).json({message:"Product not found"});const cardInclude={images:{orderBy:{sortOrder:"asc" as const},take:1},brand:true,category:true,store:true};const relatedWhere={status:"ACTIVE" as const,id:{not:product.id},OR:[...(product.categoryId?[{categoryId:product.categoryId}]:[]),...(product.brandId?[{brandId:product.brandId}]:[]),...(product.storeId?[{storeId:product.storeId}]:[])]};const [relatedProducts,moreFromStore,settings]=await Promise.all([relatedWhere.OR.length?prisma.product.findMany({where:relatedWhere,include:cardInclude,take:6,orderBy:[{featured:"desc"},{updatedAt:"desc"}]}):[],product.storeId?prisma.product.findMany({where:{status:"ACTIVE",id:{not:product.id},storeId:product.storeId},include:cardInclude,take:6,orderBy:[{featured:"desc"},{updatedAt:"desc"}]}):[],prisma.siteSettings.findUnique({where:{id:"global"},select:{affiliateDisclosure:true}})]);res.json({...product,relatedProducts,moreFromStore,affiliateDisclosure:settings?.affiliateDisclosure||null})});
app.get("/api/categories",async(_req,res)=>res.json(await prisma.category.findMany({where:active,orderBy:{sortOrder:"asc"}})));
app.get("/api/categories/:slug",async(req,res)=>{const category=await prisma.category.findFirst({where:{slug:req.params.slug,status:"ACTIVE"},include:{products:{where:{status:"ACTIVE"},include:{images:{orderBy:{sortOrder:"asc"},take:1},store:true,brand:true}}}});if(!category)return res.status(404).json({message:"Category not found"});res.json(category)});
app.get("/api/stores",async(_req,res)=>res.json(await prisma.store.findMany({where:{active:true}})));
app.get("/api/stores/:slug",async(req,res)=>{const store=await prisma.store.findFirst({where:{slug:req.params.slug,active:true},include:{products:{where:{status:"ACTIVE"},include:{images:{orderBy:{sortOrder:"asc"},take:1},store:true,brand:true}}}});if(!store)return res.status(404).json({message:"Store not found"});res.json(store)});
app.get("/api/brands",async(_req,res)=>res.json(await prisma.brand.findMany({where:{active:true}})));
app.get("/api/deals",async(_req,res)=>res.json(await prisma.deal.findMany({where:{status:"ACTIVE",startsAt:{lte:new Date()},endsAt:{gt:new Date()}},include:{product:{include:{images:true,store:true}}}})));
app.get("/api/banners",async(_req,res)=>res.json(await prisma.banner.findMany({where:{status:"ACTIVE",OR:[{endsAt:null},{endsAt:{gt:new Date()}}]},orderBy:{sortOrder:"asc"}})));
app.get("/api/blog",async(_req,res)=>res.json(await prisma.blogPost.findMany({where:{status:"ACTIVE",publishedAt:{lte:new Date()}},include:{category:true},orderBy:{publishedAt:"desc"}})));
app.get("/api/blog/:slug",async(req,res)=>{const post=await prisma.blogPost.findFirst({where:{slug:req.params.slug,status:"ACTIVE",publishedAt:{lte:new Date()}},include:{category:true}});if(!post)return res.status(404).json({message:"Article not found"});res.json(post)});
app.get("/api/homepage",async(_req,res)=>{
  const [rows,banners]=await Promise.all([prisma.homepageSection.findMany({
    where:{visible:true},orderBy:{sortOrder:"asc"},
    include:{
      products:{orderBy:{sortOrder:"asc"},include:{product:{include:{images:{orderBy:{sortOrder:"asc"},take:1},store:true}}}},
      categories:{orderBy:{sortOrder:"asc"},include:{category:true}},
      stores:{orderBy:{sortOrder:"asc"},include:{store:true}},
    },
  }),prisma.banner.findMany({where:{status:"ACTIVE",AND:[{OR:[{startsAt:null},{startsAt:{lte:new Date()}}]},{OR:[{endsAt:null},{endsAt:{gt:new Date()}}]}]},orderBy:{sortOrder:"asc"}})]);
  const needsBlog=rows.some(section=>section.type==="BLOG");
  const posts=needsBlog?await prisma.blogPost.findMany({where:{status:"ACTIVE",publishedAt:{lte:new Date()}},include:{category:true},orderBy:{publishedAt:"desc"},take:8}):[];
  const sections:any[]=rows.map(({products,categories,stores,...section})=>({
    ...section,
    products:products.map(({product})=>({...product,image:product.images[0]?.url})),
    categories:categories.map(({category})=>category),
    stores:stores.map(({store})=>store),
    posts:section.type==="BLOG"?posts:undefined,
  }));
  for(const banner of banners)sections.push({id:`banner-${banner.id}`,type:"PROMO_BANNER",title:banner.title,subtitle:banner.subtitle,background:banner.background,ctaText:banner.buttonLabel,ctaUrl:banner.buttonUrl,sortOrder:banner.sortOrder,config:{image:banner.image,storeLogo:banner.logo}});
  sections.sort((a,b)=>a.sortOrder-b.sortOrder);
  res.json({sections});
});
app.post("/api/newsletter",async(req,res)=>{const body=z.object({email:z.string().email()}).parse(req.body);res.status(201).json(await prisma.newsletterSubscriber.upsert({where:{email:body.email},create:body,update:{status:"ACTIVE"}}))});
app.use(apiError);
app.listen(Number(process.env.PORT||4000),()=>console.log("API listening on :4000"));
