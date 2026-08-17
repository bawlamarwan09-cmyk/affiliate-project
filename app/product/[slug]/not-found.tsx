import Link from "next/link";
import {PublicShell} from "../../components/PublicShell";
export default function ProductNotFound(){return <PublicShell><section className="product-not-found"><span>404</span><h1>Deal not found</h1><p>This product may be unavailable or no longer active.</p><Link href="/">Browse current deals</Link></section></PublicShell>}
