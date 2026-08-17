import type {Metadata} from "next";
import "./styles.css";
import "./functional.css";
import "./seo-audit.css";
export const metadata:Metadata={title:"Admin",robots:{index:false,follow:false,nocache:true}};
export default function Layout({children}:{children:React.ReactNode}){return children}
