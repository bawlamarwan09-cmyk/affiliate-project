import "dotenv/config";
import { PrismaClient, SectionType } from "@prisma/client";
const prisma=new PrismaClient();
const img=(id:string)=>id.startsWith("http")?id:`https://images.unsplash.com/${id}?auto=format&fit=crop&w=700&h=560&q=82`;
const logo=(name:string,color="071225")=>`https://placehold.co/260x90/ffffff/${color}?text=${encodeURIComponent(name)}`;

const storeSeed=[
  {name:"Amazon",slug:"amazon",description:"Demo marketplace store featuring products across popular categories.",logo:logo("amazon","ff9900"),websiteUrl:"https://www.amazon.com",color:"#ff9900"},
  {name:"Walmart",slug:"walmart",description:"Demo everyday retailer with home, electronics, and family essentials.",logo:logo("Walmart","1769c2"),websiteUrl:"https://www.walmart.com",color:"#1769c2"},
  {name:"Target",slug:"target",description:"Demo retailer for stylish home, beauty, fashion, and family finds.",logo:logo("Target","cc0000"),websiteUrl:"https://www.target.com",color:"#cc0000"},
  {name:"eBay",slug:"ebay",description:"Demo global marketplace for new and hard-to-find products.",logo:logo("eBay","3665f3"),websiteUrl:"https://www.ebay.com",color:"#3665f3"},
  {name:"Best Buy",slug:"best-buy",description:"Demo electronics retailer featuring tech and appliance offers.",logo:logo("BEST BUY","0046be"),websiteUrl:"https://www.bestbuy.com",color:"#0046be"},
];
const categorySeed=[
  ["Electronics","electronics","◉"],["Home","home","▱"],["Kitchen","kitchen","▣"],["Beauty","beauty","✦"],["Fashion","fashion","◇"],["Kids & Toys","kids-toys","★"],["Sports","sports","◆"],["Automotive","automotive","▰"],
];
const brandNames=["Sony","Ninja","Fitbit","Dyson","iRobot","Le Creuset","Apple","Instant Pot","Samsung","LEGO","Nespresso","KitchenAid","CeraVe","Adidas","Graco","Philips","Bose","Shark","Canon","Coleman"];
const existingSettings=await prisma.siteSettings.findUnique({where:{id:"global"}});if(!existingSettings)await prisma.siteSettings.create({data:{id:"global",websiteName:"Bargain MOM",affiliateDisclosure:"We may earn a commission when you buy through our links, at no extra cost to you."}});else if(!existingSettings.affiliateDisclosure)await prisma.siteSettings.update({where:{id:"global"},data:{affiliateDisclosure:"We may earn a commission when you buy through our links, at no extra cost to you."}});
const stores=new Map<string,string>();for(const value of storeSeed){const row=await prisma.store.upsert({where:{slug:value.slug},update:{...value,active:true},create:{...value,active:true}});stores.set(value.slug,row.id)}
const categories=new Map<string,string>();for(const [name,slug,icon] of categorySeed){const row=await prisma.category.upsert({where:{slug},update:{name,icon,status:"ACTIVE"},create:{name,slug,icon,status:"ACTIVE",sortOrder:categories.size}});categories.set(slug,row.id)}
const brands=new Map<string,string>();for(const name of brandNames){const slug=name.toLowerCase().replace(/[^a-z0-9]+/g,"-");const row=await prisma.brand.upsert({where:{slug},update:{name,active:true},create:{name,slug,description:`Demo ${name} brand record.`,logo:logo(name),active:true}});brands.set(slug,row.id)}

const productSeed=[
  ["Sony WH-CH720N Wireless Headphones","sony-wh-ch720n-wireless-headphones","Sony","electronics","amazon",89.99,149.99,35,4.7,4235,"photo-1505740420928-5e560c06d30e"],
  ["Ninja AF101 Air Fryer","ninja-af101-air-fryer","Ninja","kitchen","walmart",79.99,109.99,28,4.8,12540,"photo-1616348436168-de43ad0db179"],
  ["Fitbit Versa 4 Smartwatch","fitbit-versa-4-smartwatch","Fitbit","electronics","target",119.95,149.95,20,4.6,8752,"photo-1523275335684-37898b6baf30"],
  ["Dyson V8 Cordless Vacuum","dyson-v8-cordless-vacuum","Dyson","home","best-buy",279.99,399.99,30,4.7,6124,"photo-1558317374-067fb5f30001"],
  ["iRobot Roomba Robot Vacuum","irobot-roomba-robot-vacuum","iRobot","home","amazon",189.99,249.99,25,4.5,7143,"https://placehold.co/700x560/f4f5f7/0b1428?text=iRobot+Roomba"],
  ["Le Creuset Enameled Dutch Oven","le-creuset-enameled-dutch-oven","Le Creuset","kitchen","walmart",349.00,449.00,22,4.9,2350,"https://placehold.co/700x560/fff2e9/ff5a00?text=Le+Creuset"],
  ["Apple AirPods Pro 2nd Gen","apple-airpods-pro-2nd-gen","Apple","electronics","amazon",189.99,249.00,24,4.8,21543,"photo-1600294037681-c80b4cb5b434"],
  ["Instant Pot Duo 7-in-1 Pressure Cooker","instant-pot-duo-pressure-cooker","Instant Pot","kitchen","target",59.99,99.99,40,4.8,17892,"photo-1585515320310-259814833e62"],
  ["Samsung 55-inch Crystal UHD 4K TV","samsung-55-inch-crystal-uhd-tv","Samsung","electronics","best-buy",329.99,429.99,23,4.6,9312,"photo-1593359677879-a4bb92f829d1"],
  ["LEGO Classic Large Creative Brick Box","lego-classic-large-creative-brick-box","LEGO","kids-toys","walmart",34.99,49.99,30,4.9,6301,"photo-1594787318286-3d835c1d207f"],
  ["Nespresso Vertuo Next Coffee Machine","nespresso-vertuo-next-coffee-machine","Nespresso","kitchen","target",119.99,159.99,25,4.5,4218,"photo-1495474472287-4d71bcdd2085"],
  ["KitchenAid Artisan Stand Mixer","kitchenaid-artisan-stand-mixer","KitchenAid","kitchen","amazon",349.99,449.99,22,4.9,3874,"https://placehold.co/700x560/f8eee9/a8261a?text=KitchenAid+Mixer"],
  ["CeraVe Daily Skincare Set","cerave-daily-skincare-set","CeraVe","beauty","target",29.99,39.99,25,4.7,5643,"photo-1556228578-8c89e6adf883"],
  ["Adidas Cloudfoam Running Shoes","adidas-cloudfoam-running-shoes","Adidas","fashion","ebay",54.99,79.99,31,4.6,2891,"photo-1542291026-7eec264c27ff"],
  ["Graco Convertible Car Seat","graco-convertible-car-seat","Graco","automotive","walmart",139.99,179.99,22,4.8,4460,"photo-1591348278863-a8fb3887e2aa"],
  ["Philips Sonicare Electric Toothbrush","philips-sonicare-electric-toothbrush","Philips","beauty","best-buy",49.99,79.99,38,4.7,7210,"photo-1606811971618-4486d14f3f99"],
  ["Bose SoundLink Bluetooth Speaker","bose-soundlink-bluetooth-speaker","Bose","electronics","ebay",99.99,129.99,23,4.7,5844,"photo-1608043152269-423dbba4e7e1"],
  ["Shark Steam Mop","shark-steam-mop","Shark","home","walmart",69.99,99.99,30,4.5,3280,"photo-1527515637462-cff94eecc1ac"],
  ["Canon EOS Compact Camera","canon-eos-compact-camera","Canon","electronics","best-buy",449.99,549.99,18,4.6,1890,"photo-1516035069371-29a1b244cc32"],
  ["Coleman Family Camping Tent","coleman-family-camping-tent","Coleman","sports","amazon",129.99,179.99,28,4.7,2765,"photo-1504280390367-361c6d9f38f4"],
] as const;

const products=[];for(let i=0;i<productSeed.length;i++){const [title,slug,brand,category,store,currentPrice,oldPrice,discountPercent,rating,reviewCount,image]=productSeed[i];const brandSlug=brand.toLowerCase().replace(/[^a-z0-9]+/g,"-");const editorial={description:`The ${title} is a carefully selected ${category.replace("-"," ")} deal from ${brand}, chosen for its strong customer feedback and practical everyday value.`,availability:"In stock",keyFeatures:[`Designed by ${brand}`,`Popular choice in ${category.replace("-"," ")}`,"Backed by verified customer feedback"],pros:["Strong value at the current price","Highly rated by shoppers","Available from a trusted retailer"],cons:["Price and availability may change","Color or configuration options may vary"],whyRecommend:`We recommend the ${title} because it combines a competitive demo price with consistently positive shopper feedback.`,bestFor:`Shoppers looking for a dependable ${category.replace("-"," ")} product from ${brand}.`,buyingAdvice:"Compare the current offer with the original price and confirm shipping, warranty, and return terms on the retailer site before purchasing."};const row=await prisma.product.upsert({where:{slug},update:{title,shortDescription:`Demo offer for ${title}. Prices and links are for visual testing only.`,...editorial,currentPrice,oldPrice,discountPercent,rating,reviewCount,status:"ACTIVE",featured:i<8,affiliateUrl:`https://example.com/demo/${slug}`,ctaLabel:"View Deal",categoryId:categories.get(category),brandId:brands.get(brandSlug),storeId:stores.get(store),seoTitle:`${title} Demo Deal`,seoDescription:`Explore this demo offer for ${title}.`},create:{title,slug,shortDescription:`Demo offer for ${title}. Prices and links are for visual testing only.`,...editorial,currentPrice,oldPrice,discountPercent,rating,reviewCount,status:"ACTIVE",featured:i<8,affiliateUrl:`https://example.com/demo/${slug}`,ctaLabel:"View Deal",tags:["demo-seed"],categoryId:categories.get(category),brandId:brands.get(brandSlug),storeId:stores.get(store),seoTitle:`${title} Demo Deal`,seoDescription:`Explore this demo offer for ${title}.`}});await prisma.productImage.deleteMany({where:{productId:row.id}});await prisma.productImage.create({data:{productId:row.id,url:img(image),altText:title,sortOrder:0}});products.push(row)}

for(let i=0;i<8;i++){const product=products[i];await prisma.deal.upsert({where:{slug:`demo-${product.slug}`},update:{productId:product.id,discountPercent:product.discountPercent,startsAt:new Date("2025-01-01"),endsAt:new Date("2035-12-31"),status:"ACTIVE",featured:true,badge:i<3?"Hot Deal":"Featured"},create:{slug:`demo-${product.slug}`,productId:product.id,discountPercent:product.discountPercent,startsAt:new Date("2025-01-01"),endsAt:new Date("2035-12-31"),status:"ACTIVE",featured:true,badge:i<3?"Hot Deal":"Featured"}})}

await prisma.banner.upsert({where:{id:"demo-banner-amazon"},update:{title:"Top Picks from Amazon",subtitle:"Handpicked bestsellers with great demo deals.",image:img("photo-1523474253046-8cd2748b5fd2"),logo:storeSeed[0].logo,background:"#071225",buttonLabel:"Shop Amazon Deals",buttonUrl:"/store/amazon",status:"ACTIVE",sortOrder:4,storeId:stores.get("amazon")},create:{id:"demo-banner-amazon",title:"Top Picks from Amazon",subtitle:"Handpicked bestsellers with great demo deals.",image:img("photo-1523474253046-8cd2748b5fd2"),logo:storeSeed[0].logo,background:"#071225",buttonLabel:"Shop Amazon Deals",buttonUrl:"/store/amazon",status:"ACTIVE",sortOrder:4,storeId:stores.get("amazon")}});
await prisma.banner.upsert({where:{id:"demo-banner-walmart"},update:{title:"Top Picks from Walmart",subtitle:"Everyday essentials and popular products in one place.",image:img("photo-1601599561213-832382fd07ba"),logo:storeSeed[1].logo,background:"#eef5ff",buttonLabel:"Shop Walmart Deals",buttonUrl:"/store/walmart",status:"ACTIVE",sortOrder:5,storeId:stores.get("walmart")},create:{id:"demo-banner-walmart",title:"Top Picks from Walmart",subtitle:"Everyday essentials and popular products in one place.",image:img("photo-1601599561213-832382fd07ba"),logo:storeSeed[1].logo,background:"#eef5ff",buttonLabel:"Shop Walmart Deals",buttonUrl:"/store/walmart",status:"ACTIVE",sortOrder:5,storeId:stores.get("walmart")}});

const sections:{id:string;type:SectionType;title?:string;subtitle?:string;sortOrder:number;config?:object;ctaText?:string;ctaUrl?:string}[]=[
  {id:"demo-hero",type:"HERO",title:"Big Deals. Smart Shopping.",subtitle:"Discover great deals from trusted online stores in one place.",sortOrder:0,ctaText:"Search Deals",config:{eyebrow:"Shop smarter every day",searchPlaceholder:"What are you looking for?",benefits:["Top-rated products","Best prices","Trusted stores","Secure redirects"]}},
  {id:"demo-stores",type:"STORE_LOGOS",title:"Deals from top stores",sortOrder:1},
  {id:"demo-featured",type:"FEATURED_PRODUCTS",title:"Featured Deals",sortOrder:2,ctaText:"View all deals",ctaUrl:"/deals"},
  {id:"demo-categories",type:"CATEGORY_GRID",title:"Shop by Category",sortOrder:3,ctaText:"View all categories",ctaUrl:"/categories"},
  {id:"demo-top-store",type:"STORE_PRODUCTS",title:"Top Deals by Store",sortOrder:6,ctaText:"View all stores",ctaUrl:"/stores"},
  {id:"demo-trust",type:"TRUST_FEATURES",title:"Why shop with us",sortOrder:7,config:{items:[{icon:"◇",title:"Best Prices",description:"We gather worthwhile offers for easier comparison."},{icon:"◆",title:"Trusted Stores",description:"Browse products from established online retailers."},{icon:"↗",title:"Secure Redirects",description:"Clear outbound links take you safely to each store."},{icon:"♥",title:"Curated Deals",description:"Thoughtful picks across useful everyday categories."}]}},
  {id:"demo-blog",type:"BLOG",title:"Latest from the Blog",sortOrder:8,ctaText:"View all posts",ctaUrl:"/blog"},
];
for(const section of sections)await prisma.homepageSection.upsert({where:{id:section.id},update:{...section,visible:true},create:{...section,visible:true}});
for(const sectionId of ["demo-stores","demo-top-store"]){for(const [sortOrder,store] of Array.from(stores.entries()).entries()){const storeId=store[1];await prisma.homepageSectionStore.upsert({where:{sectionId_storeId:{sectionId,storeId}},update:{sortOrder},create:{sectionId,storeId,sortOrder}})}}
for(const [sortOrder,categoryId] of Array.from(categories.values()).entries())await prisma.homepageSectionCategory.upsert({where:{sectionId_categoryId:{sectionId:"demo-categories",categoryId}},update:{sortOrder},create:{sectionId:"demo-categories",categoryId,sortOrder}});
for(const [sortOrder,product] of products.entries()){for(const sectionId of ["demo-top-store",...(sortOrder<8?["demo-featured"]:[])])await prisma.homepageSectionProduct.upsert({where:{sectionId_productId:{sectionId,productId:product.id}},update:{sortOrder},create:{sectionId,productId:product.id,sortOrder}})}

const blogCategory=await prisma.blogCategory.upsert({where:{slug:"shopping-guides"},update:{name:"Shopping Guides"},create:{name:"Shopping Guides",slug:"shopping-guides"}});
const articles=[
  ["10 Tips to Find the Best Deals Online","10-tips-to-find-the-best-deals-online","Practical ways to compare offers and shop with more confidence.","photo-1556742049-0cfed4f6a45d",6],
  ["Amazon vs Walmart: Which Store Should You Shop?","amazon-vs-walmart-which-store-should-you-shop","A balanced demo comparison of two popular shopping destinations.","photo-1607082349566-187342175e2f",5],
  ["15 Must-Have Kitchen Gadgets","15-must-have-kitchen-gadgets","Useful kitchen upgrades that can make everyday cooking easier.","photo-1556911220-bff31c812dba",7],
  ["Summer Sale Prep: What to Buy and When","summer-sale-prep-what-to-buy-and-when","Plan seasonal purchases and know when common categories go on sale.","photo-1507525428034-b723cf961d3e",4],
] as const;
for(let i=0;i<articles.length;i++){const [title,slug,excerpt,image,readingTime]=articles[i];await prisma.blogPost.upsert({where:{slug},update:{title,excerpt,coverImage:img(image),status:"ACTIVE",publishedAt:new Date(Date.now()-i*3*86400000),readingTime,seoTitle:title,seoDescription:excerpt},create:{title,slug,excerpt,content:`${excerpt}\n\nThis demonstration article is provided for storefront preview purposes. Replace it with original editorial content before launch.`,coverImage:img(image),author:"Bargain MOM Editorial",tags:["demo-seed","shopping"],status:"ACTIVE",publishedAt:new Date(Date.now()-i*3*86400000),readingTime,seoTitle:title,seoDescription:excerpt,categoryId:blogCategory.id}})}

console.log(`Demo seed complete: ${stores.size} stores, ${categories.size} categories, ${brands.size} brands, ${products.length} products, 8 deals, 2 banners, and 4 articles.`);
await prisma.$disconnect();
