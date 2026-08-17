"use client";
import {useEffect} from "react";
export function PageEvent({name,params={}}:{name:string;params?:Record<string,unknown>}){const serialized=JSON.stringify(params);useEffect(()=>{const w=window as any;const values={...JSON.parse(serialized),page_path:location.pathname};w.dataLayer=w.dataLayer||[];w.dataLayer.push({event:name,...values});if(w.__bargainMomDirectGa&&typeof w.gtag==="function")w.gtag("event",name,values)},[name,serialized]);return null}
