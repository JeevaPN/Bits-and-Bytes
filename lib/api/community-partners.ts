import { communityPartnersSupabaseApi } from "@/lib/supabase/community-partners";

export const isCommunityPartnersDemo = false;

// Production never writes to demo memory. Missing production configuration
// selects the Supabase adapter, whose calls return UNAVAILABLE.
export const communityPartnersApi = communityPartnersSupabaseApi;
