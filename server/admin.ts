import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { Prisma, PrismaClient } from "@prisma/client";
import { z } from "zod";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { requireAdmin, requireAdminRole } from "./auth.js";
import type { AdminRole, AuthenticatedAdmin } from "./auth.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import bcrypt from "bcryptjs";

const safeHttpUrl=(value:string)=>{try{const url=new URL(value);return ["http:","https:"].includes(url.protocol)&&!url.username&&!url.password}catch{return false}};
const safeInternalPath=(value:string)=>value.startsWith("/")&&!value.startsWith("//")&&!value.includes("\\")&&!/[\u0000-\u001f\u007f]/.test(value);
const optionalUrl=z.union([z.string().trim(),z.literal(""),z.null()]).optional().transform(v=>v||null).superRefine((value,ctx)=>{if(value&&!safeHttpUrl(value))ctx.addIssue({code:"custom",message:"Use an absolute http(s) URL"})});
const optionalAssetUrl=z.union([z.string().trim(),z.literal(""),z.null()]).optional().transform(v=>v||null).superRefine((value,ctx)=>{if(value&&!safeInternalPath(value)&&!safeHttpUrl(value))ctx.addIssue({code:"custom",message:"Use a safe internal path or an absolute http(s) URL"})});
const requiredUrl=z.string().trim().min(1).superRefine((value,ctx)=>{if(!safeHttpUrl(value))ctx.addIssue({code:"custom",message:"Use an absolute http(s) URL"})});
const requiredAssetUrl=z.string().trim().min(1).refine(value=>safeInternalPath(value)||safeHttpUrl(value),"Use a safe internal path or an absolute http(s) URL");
const requiredCtaUrl=z.string().trim().min(1).refine(value=>safeInternalPath(value)||safeHttpUrl(value),"Use a safe internal path or an absolute http(s) URL");
const optionalString=z.union([z.string(),z.null()]).optional().transform(v=>v||null);
const optionalDate=z.union([z.coerce.date(),z.literal(""),z.null()]).optional().transform(v=>v||null);
const optionalEmail=z.union([z.string().trim().email(),z.literal(""),z.null()]).optional().transform(v=>v||null);
const cssHexColor=z.string().regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/,"Use a valid hexadecimal color");
const safeCtaUrl=z.union([z.string().trim(),z.null()]).optional().transform(v=>v||null).superRefine((value,ctx)=>{
  if(!value)return;
  if(safeInternalPath(value)||safeHttpUrl(value))return;
  ctx.addIssue({code:"custom",message:"Use a safe internal path or an absolute http(s) URL"});
});
const status=z.enum(["DRAFT","ACTIVE","INACTIVE","ARCHIVED"]).optional();
const base={id:z.string().optional(),createdAt:z.unknown().optional(),updatedAt:z.unknown().optional()};
const faqItems=z.array(z.object({question:z.string().min(3),answer:z.string().min(3)})).default([]);
const seoFields={seoTitle:optionalString,seoDescription:optionalString,canonicalUrl:optionalUrl,ogTitle:optionalString,ogDescription:optionalString,ogImage:optionalAssetUrl,robotsIndex:z.coerce.boolean().default(true),robotsFollow:z.coerce.boolean().default(true),schemaEnabled:z.coerce.boolean().default(true)};

const schemas={
  products:z.object({...base,title:z.string().min(2),slug:z.string().min(2).regex(/^[a-z0-9-]+$/),description:optionalString,shortDescription:optionalString,editorialSummary:optionalString,idealFor:optionalString,notIdealFor:optionalString,importantSpecs:z.record(z.string(),z.string()).nullable().optional(),comparisonNotes:optionalString,dealAnalysis:optionalString,alternativesNotes:optionalString,whatWeLike:optionalString,whatCouldBeBetter:optionalString,bestUseCases:z.array(z.string()).default([]),faqItems,currentPrice:z.coerce.number().nonnegative().nullable().optional(),oldPrice:z.coerce.number().nonnegative().nullable().optional(),discountPercent:z.coerce.number().int().min(0).max(100).nullable().optional(),rating:z.coerce.number().min(0).max(5).nullable().optional(),reviewCount:z.coerce.number().int().nonnegative().default(0),affiliateUrl:optionalUrl,ctaLabel:z.string().default("View deal"),badge:optionalString,sku:optionalString,availability:optionalString,keyFeatures:z.array(z.string()).default([]),pros:z.array(z.string()).default([]),cons:z.array(z.string()).default([]),whyRecommend:optionalString,bestFor:optionalString,buyingAdvice:optionalString,lastVerifiedAt:optionalDate,priceUpdatedAt:optionalDate,contentUpdatedAt:optionalDate,tags:z.array(z.string()).default([]),status:status.default("DRAFT"),featured:z.coerce.boolean().default(false),...seoFields,categoryId:optionalString,brandId:optionalString,storeId:optionalString,images:z.array(z.object({url:requiredAssetUrl,altText:z.string().optional(),sortOrder:z.number().int().optional()})).default([])}),
  categories:z.object({...base,name:z.string().min(2),slug:z.string().min(2).regex(/^[a-z0-9-]+$/),h1:optionalString,icon:optionalString,image:optionalAssetUrl,description:optionalString,editorialContent:optionalString,buyingTips:z.array(z.string()).default([]),faqItems,status:status.default("ACTIVE"),sortOrder:z.coerce.number().int().default(0),...seoFields,parentId:optionalString,featuredProductIds:z.array(z.string()).default([])}),
  stores:z.object({...base,name:z.string().min(2),slug:z.string().min(2).regex(/^[a-z0-9-]+$/),logo:optionalAssetUrl,description:optionalString,editorialNotes:optionalString,shoppingTips:z.array(z.string()).default([]),faqItems,websiteUrl:optionalUrl,affiliateBaseUrl:optionalUrl,color:optionalString,active:z.coerce.boolean().default(true),...seoFields}),
  brands:z.object({...base,name:z.string().min(2),slug:z.string().min(2).regex(/^[a-z0-9-]+$/),logo:optionalAssetUrl,description:optionalString,active:z.coerce.boolean().default(true),...seoFields}),
  deals:z.object({...base,slug:z.string().min(2).regex(/^[a-z0-9-]+$/),productId:z.string().min(1),discountPercent:z.coerce.number().int().min(0).max(100).nullable().optional(),startsAt:z.coerce.date(),endsAt:z.coerce.date(),status:status.default("DRAFT"),featured:z.coerce.boolean().default(false),badge:optionalString,...seoFields,robotsIndex:z.coerce.boolean().default(false),schemaEnabled:z.coerce.boolean().default(false)}).refine(v=>v.endsAt>v.startsAt,{message:"End date must be after start date",path:["endsAt"]}),
  banners:z.object({...base,title:z.string().min(2),subtitle:optionalString,image:optionalAssetUrl,logo:optionalAssetUrl,background:optionalString,buttonLabel:optionalString,buttonUrl:safeCtaUrl,startsAt:optionalDate,endsAt:optionalDate,status:status.default("DRAFT"),sortOrder:z.coerce.number().int().default(0),storeId:optionalString}).refine(v=>!v.startsAt||!v.endsAt||v.endsAt>v.startsAt,{message:"End date must be after start date",path:["endsAt"]}),
  "homepage-sections":z.object({...base,type:z.enum(["HERO","STORE_LOGOS","FEATURED_PRODUCTS","CATEGORY_GRID","STORE_PRODUCTS","PROMO_BANNER","BLOG","TRUST_FEATURES","CUSTOM"]),title:optionalString,subtitle:optionalString,sortOrder:z.coerce.number().int().default(0),visible:z.coerce.boolean().default(true),maxItems:z.coerce.number().int().positive().nullable().optional(),background:optionalString,ctaText:optionalString,ctaUrl:safeCtaUrl,config:z.record(z.string(),z.unknown()).nullable().optional(),productIds:z.array(z.string()).default([]),categoryIds:z.array(z.string()).default([]),storeIds:z.array(z.string()).default([])}).refine(value=>value.type!=="HERO"||Boolean(value.title?.trim()),{message:"A hero section needs an H1 title",path:["title"]}),
  blog:z.object({...base,title:z.string().min(2),slug:z.string().min(2).regex(/^[a-z0-9-]+$/),excerpt:optionalString,content:z.string().min(1),coverImage:optionalAssetUrl,author:optionalString,authorId:optionalString,tags:z.array(z.string()).default([]),faqItems,status:status.default("DRAFT"),publishedAt:optionalDate,contentUpdatedAt:optionalDate,readingTime:z.coerce.number().int().positive().nullable().optional(),productIds:z.array(z.string()).default([]),guideIds:z.array(z.string()).default([]),commerceCategoryIds:z.array(z.string()).default([]),...seoFields,categoryId:optionalString}),
  authors:z.object({...base,name:z.string().min(2),slug:z.string().min(2).regex(/^[a-z0-9-]+$/),bio:optionalString,profileImage:optionalAssetUrl,expertise:z.array(z.string()).default([]),profileUrls:z.array(requiredUrl).default([]),active:z.coerce.boolean().default(true)}),
  guides:z.object({...base,title:z.string().min(2),slug:z.string().min(2).regex(/^[a-z0-9-]+$/),intro:z.string().min(30),body:optionalString,editorialSections:z.array(z.object({heading:z.string().min(2),body:z.string().min(10)})).default([]),heroImage:optionalAssetUrl,heroImageAlt:optionalString,faqItems,status:status.default("DRAFT"),publishedAt:optionalDate,categoryId:optionalString,authorId:optionalString,productIds:z.array(z.string()).default([]),...seoFields}),
  comparisons:z.object({...base,title:z.string().min(2),slug:z.string().min(2).regex(/^[a-z0-9-]+$/),introduction:z.string().min(30),comparisonTable:z.array(z.object({label:z.string().min(1),values:z.array(z.string())})).default([]),strengths:z.record(z.string(),z.array(z.string())).nullable().optional(),weaknesses:z.record(z.string(),z.array(z.string())).nullable().optional(),pricingNotes:optionalString,bestFor:optionalString,verdict:optionalString,faqItems,heroImage:optionalAssetUrl,heroImageAlt:optionalString,status:status.default("DRAFT"),publishedAt:optionalDate,authorId:optionalString,productIds:z.array(z.string()).default([]),storeIds:z.array(z.string()).default([]),...seoFields}),
  pages:z.object({...base,title:z.string().min(2),slug:z.string().min(2).regex(/^[a-z0-9-]+$/),intro:optionalString,content:z.string().min(30),status:status.default("DRAFT"),publishedAt:optionalDate,...seoFields}),
  navigation:z.object({...base,label:z.string().min(1),url:requiredCtaUrl,sortOrder:z.coerce.number().int().default(0),active:z.coerce.boolean().default(true),parentId:optionalString}),
  footer:z.object({...base,title:z.string().min(1),content:optionalString,sortOrder:z.coerce.number().int().default(0),active:z.coerce.boolean().default(true),links:z.array(z.object({id:z.string().optional(),label:z.string().min(1),url:z.string().trim().min(1).refine(value=>safeInternalPath(value)||safeHttpUrl(value),"Use a safe internal path or an absolute http(s) URL")})).default([])}),
  "affiliate-links":z.object({...base,label:z.string().min(1),url:requiredUrl,clickCount:z.coerce.number().int().nonnegative().default(0),active:z.coerce.boolean().default(true),productId:optionalString}),
};
type Resource=keyof typeof schemas;
const resources=new Set(Object.keys(schemas));
const include:Partial<Record<Resource,object>>={products:{images:true,category:true,brand:true,store:true},categories:{featuredProducts:{include:{product:true},orderBy:{sortOrder:"asc"}}},deals:{product:true},banners:{store:true},blog:{category:true,authorProfile:true,productPlacements:{include:{product:true},orderBy:{sortOrder:"asc"}},guidePlacements:{include:{guide:true},orderBy:{sortOrder:"asc"}},commerceCategoryPlacements:{include:{category:true},orderBy:{sortOrder:"asc"}}},guides:{category:true,author:true,products:{include:{product:true},orderBy:{sortOrder:"asc"}}},comparisons:{author:true,products:{include:{product:true},orderBy:{sortOrder:"asc"}},stores:{include:{store:true},orderBy:{sortOrder:"asc"}}},navigation:{parent:true},"homepage-sections":{products:{include:{product:true},orderBy:{sortOrder:"asc"}},categories:{include:{category:true},orderBy:{sortOrder:"asc"}},stores:{include:{store:true},orderBy:{sortOrder:"asc"}}}};
const modelName:Record<Resource,string>={products:"product",categories:"category",stores:"store",brands:"brand",deals:"deal",banners:"banner","homepage-sections":"homepageSection",blog:"blogPost",authors:"author",guides:"buyingGuide",comparisons:"comparison",pages:"editorialPage",navigation:"navigationItem",footer:"footerSection","affiliate-links":"affiliateLink"};
const allowedImageMimeTypes=new Set(["image/jpeg","image/png","image/webp","image/gif"]);
type MutableRecord=Record<string,unknown>;
type DynamicModel={
  findMany(args?:unknown):Prisma.PrismaPromise<unknown[]>;
  findUnique(args:unknown):Prisma.PrismaPromise<MutableRecord|null>;
  findFirst(args:unknown):Prisma.PrismaPromise<MutableRecord|null>;
  create(args:unknown):Prisma.PrismaPromise<unknown>;
  update(args:unknown):Prisma.PrismaPromise<unknown>;
  delete(args:unknown):Prisma.PrismaPromise<unknown>;
};
type SeoAuditItem={id:string;type:string;title:string;path:string;warnings:string[]};
type SeoAuditRow={id:string;title?:string|null;name?:string|null;seoTitle?:string|null;seoDescription?:string|null};

function imageExtension(buffer:Buffer){
  if(buffer.length>=3&&buffer[0]===0xff&&buffer[1]===0xd8&&buffer[2]===0xff)return ".jpg";
  if(buffer.length>=8&&buffer.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])))return ".png";
  if(buffer.length>=12&&buffer.subarray(0,4).toString("ascii")==="RIFF"&&buffer.subarray(8,12).toString("ascii")==="WEBP")return ".webp";
  if(buffer.length>=6&&["GIF87a","GIF89a"].includes(buffer.subarray(0,6).toString("ascii")))return ".gif";
  return null;
}

function actor(res:Response){return res.locals.admin as AuthenticatedAdmin}
function mayAssignRole(actorRole:AdminRole,role:AdminRole){return actorRole==="OWNER"||role!=="OWNER"}
function mayManageRole(actorRole:AdminRole,targetRole:AdminRole){return actorRole==="OWNER"||targetRole!=="OWNER"}
function forbidden(res:Response,message="You do not have permission to manage this account"){return res.status(403).json({success:false,message})}
function dynamicModel(prisma:PrismaClient,name:string){return (prisma as unknown as Record<string,DynamicModel>)[name]}
function resourceModel(prisma:PrismaClient,resource:Resource){return dynamicModel(prisma,modelName[resource])}
function optionalJsonObject(value:Record<string,unknown>|null|undefined){return value===null?Prisma.DbNull:value as Prisma.InputJsonObject|undefined}

function success(res:Response,data:unknown,statusCode=200){return res.status(statusCode).json({success:true,data})}
function sanitize(resource:Resource,raw:unknown,id?:string){
  const parsed=schemas[resource].parse(raw) as MutableRecord;delete parsed.id;delete parsed.createdAt;delete parsed.updatedAt;
  if(["blog","guides","comparisons"].includes(resource)&&parsed.status==="ACTIVE"){
    if(!parsed.publishedAt)throw new z.ZodError([{code:"custom",path:["publishedAt"],message:"Published content needs a publication date",input:parsed.publishedAt}]);
    if(!parsed.authorId&&!(resource==="blog"&&typeof parsed.author==="string"&&parsed.author.trim()))throw new z.ZodError([{code:"custom",path:["authorId"],message:"Published editorial content needs a visible author",input:parsed.authorId}]);
  }
  if(resource==="categories"&&id&&parsed.parentId===id)throw new z.ZodError([{code:"custom",path:["parentId"],message:"A category cannot be its own parent",input:parsed.parentId}]);
  if(resource==="products"){const images=parsed.images as MutableRecord[];delete parsed.images;return {...parsed,images:id?{deleteMany:{},create:images}:{create:images}}}
  if(resource==="categories"){const ids=parsed.featuredProductIds as string[];delete parsed.featuredProductIds;const rows=ids.map((productId,sortOrder)=>({productId,sortOrder}));return {...parsed,featuredProducts:id?{deleteMany:{},create:rows}:{create:rows}}}
  if(resource==="blog"){const productIds=parsed.productIds as string[],guideIds=parsed.guideIds as string[],commerceCategoryIds=parsed.commerceCategoryIds as string[];delete parsed.productIds;delete parsed.guideIds;delete parsed.commerceCategoryIds;const products=productIds.map((productId,sortOrder)=>({productId,sortOrder}));const guides=guideIds.map((guideId,sortOrder)=>({guideId,sortOrder}));const categories=commerceCategoryIds.map((categoryId,sortOrder)=>({categoryId,sortOrder}));return {...parsed,productPlacements:id?{deleteMany:{},create:products}:{create:products},guidePlacements:id?{deleteMany:{},create:guides}:{create:guides},commerceCategoryPlacements:id?{deleteMany:{},create:categories}:{create:categories}}}
  if(resource==="guides"){const ids=parsed.productIds as string[];delete parsed.productIds;const rows=ids.map((productId,sortOrder)=>({productId,sortOrder}));return {...parsed,products:id?{deleteMany:{},create:rows}:{create:rows}}}
  if(resource==="comparisons"){const productIds=parsed.productIds as string[],storeIds=parsed.storeIds as string[];delete parsed.productIds;delete parsed.storeIds;const products=productIds.map((productId,sortOrder)=>({productId,sortOrder}));const stores=storeIds.map((storeId,sortOrder)=>({storeId,sortOrder}));return {...parsed,products:id?{deleteMany:{},create:products}:{create:products},stores:id?{deleteMany:{},create:stores}:{create:stores}}}
  if(resource==="homepage-sections"){const productIds=parsed.productIds as string[],categoryIds=parsed.categoryIds as string[],storeIds=parsed.storeIds as string[];delete parsed.productIds;delete parsed.categoryIds;delete parsed.storeIds;const products=productIds.map((productId,sortOrder)=>({productId,sortOrder}));const categories=categoryIds.map((categoryId,sortOrder)=>({categoryId,sortOrder}));const stores=storeIds.map((storeId,sortOrder)=>({storeId,sortOrder}));return {...parsed,products:id?{deleteMany:{},create:products}:{create:products},categories:id?{deleteMany:{},create:categories}:{create:categories},stores:id?{deleteMany:{},create:stores}:{create:stores}}}
  return parsed;
}

async function seoAudit(prisma:PrismaClient){
  const [products,categories,stores,brands,posts,guides,comparisons,pages]=await Promise.all([
    prisma.product.findMany({where:{status:"ACTIVE",robotsIndex:true},include:{images:true,affiliateLinks:{where:{active:true},select:{id:true},take:1}}}),
    prisma.category.findMany({where:{status:"ACTIVE",robotsIndex:true}}),prisma.store.findMany({where:{active:true,robotsIndex:true}}),prisma.brand.findMany({where:{active:true,robotsIndex:true}}),
    prisma.blogPost.findMany({where:{status:"ACTIVE",robotsIndex:true}}),prisma.buyingGuide.findMany({where:{status:"ACTIVE",robotsIndex:true}}),prisma.comparison.findMany({where:{status:"ACTIVE",robotsIndex:true}}),prisma.editorialPage.findMany({where:{status:"ACTIVE",robotsIndex:true}}),
  ]);
  const items:SeoAuditItem[]=[];const add=(type:string,row:SeoAuditRow,path:string,warnings:string[])=>items.push({id:row.id,type,title:row.title||row.name||"Untitled",path,warnings});const common=(row:SeoAuditRow,content?:string|null)=>[...(!row.seoTitle?["Missing SEO title override (automatic fallback is active)"]:[]),...(!row.seoDescription?["Missing meta description override (automatic fallback is active)"]:[]),...(String(content||"").trim().length<120?["Thin editorial content"]:[])];
  for(const row of products){const warnings=common(row,row.editorialSummary||row.description);if(!row.images.length)warnings.push("Missing product image");if(row.images.some(x=>!x.altText))warnings.push("Missing image alt text");if(!row.affiliateUrl&&!row.affiliateLinks.length)warnings.push("Affiliate URL missing");if(!row.categoryId&&!row.brandId&&!row.storeId)warnings.push("Missing contextual internal links");if(!row.lastVerifiedAt)warnings.push("Price verification date not recorded");else if(Date.now()-row.lastVerifiedAt.getTime()>30*86400000)warnings.push("Price verification is older than 30 days");add("Product",row,`/product/${row.slug}`,warnings)}
  for(const row of categories)add("Category",row,`/category/${row.slug}`,common(row,row.editorialContent||row.description));for(const row of stores)add("Store",row,`/store/${row.slug}`,common(row,row.editorialNotes||row.description));for(const row of brands)add("Brand",row,`/brand/${row.slug}`,common(row,row.description));for(const row of posts){const warnings=common(row,row.content);if(!row.authorId&&!row.author)warnings.push("Missing visible author");if(!row.publishedAt)warnings.push("Missing publication date");add("Blog",row,`/blog/${row.slug}`,warnings)}for(const row of guides){const warnings=common(row,`${row.intro} ${row.body||""}`);if(!row.authorId)warnings.push("Missing visible author");if(!row.publishedAt)warnings.push("Missing publication date");add("Guide",row,`/guides/${row.slug}`,warnings)}for(const row of comparisons){const warnings=common(row,`${row.introduction} ${row.verdict||""}`);if(!row.authorId)warnings.push("Missing visible author");if(!row.publishedAt)warnings.push("Missing publication date");add("Comparison",row,`/compare/${row.slug}`,warnings)}for(const row of pages)add("Page",row,`/${row.slug}`,common(row,row.content));
  return {summary:{checked:items.length,withWarnings:items.filter(x=>x.warnings.length).length,warnings:items.reduce((n,x)=>n+x.warnings.length,0)},items};
}

export function adminRouter(prisma:PrismaClient){const router=Router();router.use(requireAdmin);
  const ownerOrAdmin=requireAdminRole("OWNER","ADMIN");
  const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024},fileFilter:(_req,file,cb)=>cb(null,allowedImageMimeTypes.has(file.mimetype))});
  router.post("/upload",upload.single("file"),async(req,res,next)=>{try{
    if(!req.file)return res.status(400).json({success:false,message:"A valid JPEG, PNG, WebP, or GIF image is required"});
    const extension=imageExtension(req.file.buffer);
    const expectedMime=extension?({".jpg":"image/jpeg",".png":"image/png",".webp":"image/webp",".gif":"image/gif"} as const)[extension]:null;
    if(!extension||expectedMime!==req.file.mimetype)return res.status(400).json({success:false,message:"The uploaded file content does not match a supported image type"});

    const cloudinaryConfigured=Boolean(process.env.CLOUDINARY_CLOUD_NAME&&process.env.CLOUDINARY_API_KEY&&process.env.CLOUDINARY_API_SECRET);
    if(!cloudinaryConfigured){
      if(process.env.NODE_ENV==="production")return res.status(503).json({success:false,message:"Image storage is not configured. Set the Cloudinary environment variables before uploading in production."});
      const directory=path.resolve(process.cwd(),"public","uploads");
      const filename=`${randomUUID()}${extension}`;
      await mkdir(directory,{recursive:true});
      await writeFile(path.join(directory,filename),req.file.buffer,{flag:"wx"});
      return success(res,{url:`/uploads/${filename}`,publicId:null,storage:"local"},201);
    }

    cloudinary.config({cloud_name:process.env.CLOUDINARY_CLOUD_NAME,api_key:process.env.CLOUDINARY_API_KEY,api_secret:process.env.CLOUDINARY_API_SECRET});
    const result=await new Promise<{secure_url:string;public_id:string}>((resolve,reject)=>{const stream=cloudinary.uploader.upload_stream({folder:"affiliate-project",resource_type:"image"},(error,result)=>{if(error)return reject(error);if(!result)return reject(new Error("Cloudinary returned no upload result"));return resolve(result)});stream.end(req.file!.buffer)});
    return success(res,{url:result.secure_url,publicId:result.public_id,storage:"cloudinary"},201);
  }catch(e){next(e)}});
  router.get("/overview",async(_req,res,next)=>{try{const [products,deals,stores,categories,posts,subscribers,guides,comparisons]=await Promise.all([prisma.product.count(),prisma.deal.count({where:{status:"ACTIVE"}}),prisma.store.count(),prisma.category.count(),prisma.blogPost.count(),prisma.newsletterSubscriber.count(),prisma.buyingGuide.count(),prisma.comparison.count()]);success(res,{products,deals,stores,categories,posts,subscribers,guides,comparisons})}catch(e){next(e)}});
  router.get("/options",async(_req,res,next)=>{try{const [products,categories,stores,brands,blogCategories,authors,guides]=await Promise.all([prisma.product.findMany({select:{id:true,title:true}}),prisma.category.findMany({select:{id:true,name:true}}),prisma.store.findMany({select:{id:true,name:true}}),prisma.brand.findMany({select:{id:true,name:true}}),prisma.blogCategory.findMany({select:{id:true,name:true}}),prisma.author.findMany({select:{id:true,name:true}}),prisma.buyingGuide.findMany({select:{id:true,title:true}})]);success(res,{products,categories,stores,brands,blogCategories,authors,guides})}catch(e){next(e)}});
  router.get("/seo-audit",async(_req,res,next)=>{try{success(res,await seoAudit(prisma))}catch(e){next(e)}});
  router.get("/admins",ownerOrAdmin,async(_req,res,next)=>{try{success(res,await prisma.admin.findMany({select:{id:true,email:true,name:true,role:true,active:true,createdAt:true,updatedAt:true},orderBy:{createdAt:"asc"}}))}catch(e){next(e)}});
  router.post("/admins",ownerOrAdmin,async(req,res,next)=>{try{
    const value=z.object({email:z.string().email(),name:z.string().min(2),password:z.string().min(10),role:z.enum(["OWNER","ADMIN","EDITOR"]),active:z.boolean().default(true)}).parse(req.body);
    if(!mayAssignRole(actor(res).role,value.role))return forbidden(res,"Only an owner can assign the owner role");
    return success(res,await prisma.admin.create({data:{email:value.email,name:value.name,passwordHash:await bcrypt.hash(value.password,12),role:value.role,active:value.active},select:{id:true,email:true,name:true,role:true,active:true,createdAt:true,updatedAt:true}}),201);
  }catch(e){next(e)}});
  router.patch("/admins/:id",ownerOrAdmin,async(req,res,next)=>{try{
    const value=z.object({email:z.string().email(),name:z.string().min(2),password:z.string().min(10).optional(),role:z.enum(["OWNER","ADMIN","EDITOR"]),active:z.boolean()}).parse(req.body);
    const id=String(req.params.id);
    const current=await prisma.admin.findUnique({where:{id},select:{id:true,role:true}});
    if(!current)return res.status(404).json({success:false,message:"Record not found"});
    const currentActor=actor(res);
    if(!mayManageRole(currentActor.role,current.role)||!mayAssignRole(currentActor.role,value.role))return forbidden(res);
    if(currentActor.id===current.id&&!value.active)return res.status(400).json({success:false,message:"You cannot deactivate your own account"});
    const {password,...fields}=value;
    const changed=await prisma.admin.updateMany({where:{id:current.id,...(currentActor.role==="ADMIN"?{role:{not:"OWNER" as const}}:{})},data:{...fields,...(password?{passwordHash:await bcrypt.hash(password,12)}:{})}});
    if(!changed.count)return forbidden(res);
    return success(res,await prisma.admin.findUnique({where:{id:current.id},select:{id:true,email:true,name:true,role:true,active:true,createdAt:true,updatedAt:true}}));
  }catch(e){next(e)}});
  router.delete("/admins/:id",ownerOrAdmin,async(req,res,next)=>{try{
    const currentActor=actor(res);
    const id=String(req.params.id);
    if(currentActor.id===id)return res.status(400).json({success:false,message:"You cannot delete your own account"});
    const target=await prisma.admin.findUnique({where:{id},select:{id:true,role:true}});
    if(!target)return res.status(404).json({success:false,message:"Record not found"});
    if(!mayManageRole(currentActor.role,target.role))return forbidden(res);
    const deleted=await prisma.admin.deleteMany({where:{id:target.id,...(currentActor.role==="ADMIN"?{role:{not:"OWNER" as const}}:{})}});
    if(!deleted.count)return forbidden(res);
    return success(res,{id:target.id});
  }catch(e){next(e)}});
  router.post("/admins/:id/toggle",ownerOrAdmin,async(req,res,next)=>{try{
    const value=z.object({active:z.boolean()}).parse(req.body);
    const currentActor=actor(res);
    const id=String(req.params.id);
    if(currentActor.id===id&&!value.active)return res.status(400).json({success:false,message:"You cannot deactivate your own account"});
    const target=await prisma.admin.findUnique({where:{id},select:{id:true,role:true}});
    if(!target)return res.status(404).json({success:false,message:"Record not found"});
    if(!mayManageRole(currentActor.role,target.role))return forbidden(res);
    const changed=await prisma.admin.updateMany({where:{id:target.id,...(currentActor.role==="ADMIN"?{role:{not:"OWNER" as const}}:{})},data:{active:value.active}});
    if(!changed.count)return forbidden(res);
    return success(res,await prisma.admin.findUnique({where:{id:target.id},select:{id:true,email:true,name:true,role:true,active:true}}));
  }catch(e){next(e)}});
  router.get("/settings",ownerOrAdmin,async(_req,res,next)=>{try{success(res,await prisma.siteSettings.findUnique({where:{id:"global"}}))}catch(e){next(e)}});
  router.put("/settings",ownerOrAdmin,async(req,res,next)=>{try{const schema=z.object({websiteName:z.string().min(1),logo:optionalAssetUrl,favicon:optionalAssetUrl,primaryColor:cssHexColor,accentColor:cssHexColor,supportEmail:optionalEmail,socialMedia:z.record(z.string(),z.unknown()).nullable().optional(),announcementItems:z.array(z.string().trim().min(1).max(100)).max(8).nullable().optional(),defaultSeoTitle:optionalString,defaultSeoDescription:optionalString,siteUrl:optionalUrl,homepageSeoTitle:optionalString,homepageSeoDescription:optionalString,homepageCanonicalUrl:optionalUrl,homepageOgTitle:optionalString,homepageOgDescription:optionalString,homepageOgImage:optionalAssetUrl,homepageRobotsIndex:z.coerce.boolean().optional(),homepageRobotsFollow:z.coerce.boolean().optional(),homepageSchemaEnabled:z.coerce.boolean().optional(),googleSiteVerification:optionalString,bingSiteVerification:optionalString,affiliateDisclosure:optionalString,copyright:optionalString,analyticsIds:z.record(z.string(),z.unknown()).nullable().optional(),searchPlaceholder:optionalString,headerCtaLabel:optionalString,headerCtaUrl:safeCtaUrl,footerDescription:optionalString,newsletterTitle:optionalString,newsletterText:optionalString});const parsed=schema.parse(req.body);const data={...parsed,socialMedia:optionalJsonObject(parsed.socialMedia),analyticsIds:optionalJsonObject(parsed.analyticsIds)} satisfies Prisma.SiteSettingsUncheckedUpdateInput;const create={id:"global",...data} satisfies Prisma.SiteSettingsUncheckedCreateInput;success(res,await prisma.siteSettings.upsert({where:{id:"global"},create,update:data}))}catch(e){next(e)}});
  router.get("/subscribers",ownerOrAdmin,async(_req,res,next)=>{try{success(res,await prisma.newsletterSubscriber.findMany({select:{id:true,email:true,status:true,createdAt:true},orderBy:{createdAt:"desc"}}))}catch(e){next(e)}});
  router.post("/subscribers/:id/toggle",ownerOrAdmin,async(req,res,next)=>{try{
    const active=z.object({active:z.boolean()}).parse(req.body).active;
    return success(res,await prisma.newsletterSubscriber.update({where:{id:String(req.params.id)},data:{status:active?"ACTIVE":"INACTIVE"},select:{id:true,email:true,status:true,createdAt:true}}));
  }catch(e){next(e)}});
  router.delete("/subscribers/:id",ownerOrAdmin,async(req,res,next)=>{try{const id=String(req.params.id);await prisma.newsletterSubscriber.delete({where:{id}});return success(res,{id})}catch(e){next(e)}});
  router.get("/contact-messages",ownerOrAdmin,async(_req,res,next)=>{try{success(res,await dynamicModel(prisma,"contactMessage").findMany({orderBy:{createdAt:"desc"}}))}catch(e){next(e)}});
  router.post("/contact-messages/:id/toggle",ownerOrAdmin,async(req,res,next)=>{try{
    const value=z.object({read:z.boolean().optional(),active:z.boolean().optional()}).refine(input=>input.read!==undefined||input.active!==undefined,{message:"A read value is required"}).parse(req.body);
    const read=value.read??value.active!;
    return success(res,await dynamicModel(prisma,"contactMessage").update({where:{id:String(req.params.id)},data:{readAt:read?new Date():null}}));
  }catch(e){next(e)}});
  router.delete("/contact-messages/:id",ownerOrAdmin,async(req,res,next)=>{try{const id=String(req.params.id);await dynamicModel(prisma,"contactMessage").delete({where:{id}});return success(res,{id})}catch(e){next(e)}});
  router.get("/:resource",async(req,res,next)=>{try{const resource=String(req.params.resource) as Resource;if(!resources.has(resource))return res.status(404).json({success:false,message:"Unknown resource"});const model=resourceModel(prisma,resource);const orderBy=["homepage-sections","navigation","footer","categories","banners"].includes(resource)?{sortOrder:"asc"}:["products","deals","blog","guides","comparisons","pages"].includes(resource)?{updatedAt:"desc"}:resource==="affiliate-links"?{createdAt:"desc"}:{id:"asc"};success(res,await model.findMany({include:include[resource],orderBy}))}catch(e){next(e)}});
  router.post("/:resource",async(req,res,next)=>{try{const resource=String(req.params.resource) as Resource;if(!resources.has(resource))return res.status(404).json({success:false,message:"Unknown resource"});const data=sanitize(resource,req.body);success(res,await resourceModel(prisma,resource).create({data,include:include[resource]}),201)}catch(e){next(e)}});
  router.patch("/:resource/:id",async(req,res,next)=>{try{const resource=String(req.params.resource) as Resource;if(!resources.has(resource))return res.status(404).json({success:false,message:"Unknown resource"});const id=String(req.params.id);const data=sanitize(resource,req.body,id);success(res,await resourceModel(prisma,resource).update({where:{id},data,include:include[resource]}))}catch(e){next(e)}});
  router.delete("/:resource/:id",async(req,res,next)=>{try{const resource=String(req.params.resource) as Resource;if(!resources.has(resource))return res.status(404).json({success:false,message:"Unknown resource"});const id=String(req.params.id);await resourceModel(prisma,resource).delete({where:{id}});success(res,{id})}catch(e){next(e)}});
  router.post("/:resource/:id/toggle",async(req,res,next)=>{try{const resource=String(req.params.resource) as Resource;if(!resources.has(resource))return res.status(404).json({success:false,message:"Unknown resource"});const active=z.object({active:z.boolean()}).parse(req.body).active;const field=resource==="homepage-sections"?"visible":["products","categories","deals","banners","blog","guides","comparisons","pages"].includes(resource)?"status":"active";const value=field==="status"?(active?"ACTIVE":"INACTIVE"):active;success(res,await resourceModel(prisma,resource).update({where:{id:String(req.params.id)},data:{[field]:value}}))}catch(e){next(e)}});
  router.post("/:resource/:id/move",async(req,res,next)=>{try{const resource=String(req.params.resource) as Resource;if(!["homepage-sections","navigation","footer"].includes(resource))return res.status(400).json({success:false,message:"Resource cannot be reordered"});const direction=z.enum(["up","down"]).parse(req.body.direction);const model=resourceModel(prisma,resource);const current=await model.findUnique({where:{id:String(req.params.id)}});if(!current)return res.status(404).json({success:false,message:"Record not found"});if(typeof current.id!=="string"||typeof current.sortOrder!=="number")throw new Error("Reorderable record has invalid persisted values");const adjacent=await model.findFirst({where:{sortOrder:direction==="up"?{lt:current.sortOrder}:{gt:current.sortOrder}},orderBy:{sortOrder:direction==="up"?"desc":"asc"}});if(adjacent){if(typeof adjacent.id!=="string"||typeof adjacent.sortOrder!=="number")throw new Error("Adjacent record has invalid persisted values");await prisma.$transaction([model.update({where:{id:current.id},data:{sortOrder:adjacent.sortOrder}}),model.update({where:{id:adjacent.id},data:{sortOrder:current.sortOrder}})])}success(res,{moved:Boolean(adjacent)})}catch(e){next(e)}});
  return router;
}

export function apiError(error:unknown,_req:Request,res:Response,next:NextFunction){void next;if(error instanceof z.ZodError)return res.status(400).json({success:false,message:"Validation failed",errors:error.flatten()});if(error instanceof multer.MulterError)return res.status(400).json({success:false,message:error.code==="LIMIT_FILE_SIZE"?"Image files must be 5 MB or smaller":"The image upload could not be processed"});if(error instanceof Prisma.PrismaClientKnownRequestError){if(error.code==="P2002")return res.status(409).json({success:false,message:"A record with that unique value already exists"});if(error.code==="P2025")return res.status(404).json({success:false,message:"Record not found"});if(error.code==="P2003")return res.status(409).json({success:false,message:"This record is still used by related content"})}console.error(error);return res.status(500).json({success:false,message:"Unexpected server error"})}
