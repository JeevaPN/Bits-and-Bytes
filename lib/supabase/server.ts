import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
export async function createClient(){const jar=await cookies();const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;if(!url||!key)return null;return createServerClient(url,key,{cookies:{getAll(){return jar.getAll()},setAll(values){try{values.forEach(({name,value,options})=>jar.set(name,value,options))}catch{}}}})}
export async function getServerUser(){const client=await createClient();if(!client)return null;const {data:{user}}=await client.auth.getUser();return user;}
export async function requireServerUser(){const user=await getServerUser();if(!user)throw new Error("AUTH_REQUIRED");return user;}
