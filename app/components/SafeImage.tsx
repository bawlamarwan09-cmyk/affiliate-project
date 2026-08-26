import Image from "next/image";
type Props={src:string;alt:string;width:number;height:number;sizes?:string;priority?:boolean;className?:string};
const optimizedHosts=new Set(["images.unsplash.com","placehold.co","res.cloudinary.com"]);
export function SafeImage({src,alt,width,height,sizes,priority=false,className}:Props){let optimized=src.startsWith("/");try{optimized=optimized||optimizedHosts.has(new URL(src).hostname)}catch{}return <Image src={src} alt={alt} width={width} height={height} sizes={sizes} priority={priority} className={className} unoptimized={src.startsWith("/brand/")||!optimized}/>}
