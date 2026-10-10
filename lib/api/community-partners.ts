import { communityPartnersSupabaseApi } from "@/lib/supabase/community-partners";

// Community Partner actions always use the authenticated Supabase adapter.
export const communityPartnersApi = communityPartnersSupabaseApi;
