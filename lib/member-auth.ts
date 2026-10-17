import {authClient} from '@/lib/auth';
export async function getMemberUser(){
 if(!process.env.SUPABASE_URL||!process.env.SUPABASE_PUBLISHABLE_KEY)return null;
 const {data:{user},error}=await (await authClient()).auth.getUser();
 if(error||!user?.email)return null;
 // Unverified email addresses must never claim another account's records.
 return {userId:user.id,email:user.email.toLowerCase(),displayName:user.email,fullName:null};
}
