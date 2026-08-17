const base=process.env.API_URL||process.env.NEXT_PUBLIC_API_URL||"http://localhost:4000/api";
export async function publicApi<T>(path:string):Promise<T|null>{try{const response=await fetch(`${base}${path}`,{next:{revalidate:30}});if(!response.ok)return null;return response.json()}catch{return null}}
