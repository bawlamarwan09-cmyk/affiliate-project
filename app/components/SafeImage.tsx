import Image from "next/image";
type Props={src:string;alt:string;width:number;height:number;sizes?:string;priority?:boolean;className?:string};
const optimizedHosts=new Set(["images.unsplash.com","placehold.co","res.cloudinary.com"]);
const imageApi=(process.env.NEXT_PUBLIC_API_URL||"http://localhost:4000/api").replace(/\/$/,"");
function uploadLoader({src,width,quality}:{src:string;width:number;quality?:number}){const filename=src.slice("/uploads/".length);return `${imageApi}/image/${encodeURIComponent(filename)}?w=${width}&q=${quality||72}`}
export function SafeImage({src,alt,width,height,sizes,priority=false,className}:Props){let optimized=src.startsWith("/");try{optimized=optimized||optimizedHosts.has(new URL(src).hostname)}catch{}const runtimeUpload=src.startsWith("/uploads/");return <Image src={src} alt={alt} width={width} height={height} sizes={sizes} priority={priority} className={className} quality={72} loader={runtimeUpload?uploadLoader:undefined} unoptimized={src.startsWith("/brand/")||!optimized}/>}
