"use client";
import { useState } from "react";

type GalleryImage={url:string;altText?:string|null};
export function ProductGallery({images,title}:{images:GalleryImage[];title:string}){
  const safe=images.filter(image=>image?.url);const [active,setActive]=useState(0);const [zoomed,setZoomed]=useState(false);const image=safe[active];
  return <div className="product-gallery">
    <button className="gallery-main" type="button" onClick={()=>image&&setZoomed(true)} aria-label={image?`Enlarge ${title}`:"Product image unavailable"}>
      {image?<img src={image.url} alt={image.altText||title}/>:<span className="gallery-fallback" aria-hidden="true">◇</span>}
      {image&&<small>Click to enlarge</small>}
    </button>
    {safe.length>1&&<div className="gallery-thumbs" aria-label="Product images">{safe.map((item,index)=><button type="button" className={index===active?"active":""} key={`${item.url}-${index}`} onClick={()=>setActive(index)} aria-label={`View image ${index+1}`}><img src={item.url} alt={item.altText||`${title} image ${index+1}`}/></button>)}</div>}
    {zoomed&&image&&<div className="lightbox" role="dialog" aria-modal="true" aria-label={`${title} enlarged image`} onClick={()=>setZoomed(false)}><button type="button" onClick={()=>setZoomed(false)} aria-label="Close image">×</button><img src={image.url} alt={image.altText||title}/></div>}
  </div>;
}
