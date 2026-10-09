import { communityPartnersMockApi } from "@/lib/mock-api/community-partners";
import { communityPartnersSupabaseApi } from "@/lib/supabase/community-partners";

const backendConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const isCommunityPartnersDemo = !backendConfigured && process.env.NODE_ENV !== "production";

// Production never writes to demo memory. Missing production configuration
// selects the Supabase adapter, whose calls return UNAVAILABLE.
export const communityPartnersApi = isCommunityPartnersDemo ? communityPartnersMockApi : communityPartnersSupabaseApi;
