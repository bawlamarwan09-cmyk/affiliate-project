"use client";
import { useState } from "react";
import { SafeImage } from "../../components/SafeImage";

type GalleryImage={url:string;altText?:string|null};
export function ProductGallery({images,title}:{images:GalleryImage[];title:string}){
  const safe=images.filter(image=>image?.url);const [active,setActive]=useState(0);const [zoomed,setZoomed]=useState(false);const image=safe[active];
  return <div className="product-gallery">
    <button className="gallery-main" type="button" onClick={()=>image&&setZoomed(true)} aria-label={image?`Enlarge ${title}`:"Product image unavailable"}>
      {image?<SafeImage src={image.url} alt={image.altText||title} width={760} height={760} sizes="(max-width: 800px) 92vw, 46vw" priority/>:<span className="gallery-fallback" aria-hidden="true">◇</span>}
      {image&&<small>Click to enlarge</small>}
    </button>
    {safe.length>1&&<div className="gallery-thumbs" aria-label="Product images">{safe.map((item,index)=><button type="button" className={index===active?"active":""} key={`${item.url}-${index}`} onClick={()=>setActive(index)} aria-label={`View image ${index+1}`}><SafeImage src={item.url} alt={item.altText||`${title} image ${index+1}`} width={120} height={120} sizes="82px"/></button>)}</div>}
    {zoomed&&image&&<div className="lightbox" role="dialog" aria-modal="true" aria-label={`${title} enlarged image`} onClick={()=>setZoomed(false)}><button type="button" onClick={()=>setZoomed(false)} aria-label="Close image">×</button><SafeImage src={image.url} alt={image.altText||title} width={1200} height={1200} sizes="92vw" priority/></div>}
  </div>;
}
