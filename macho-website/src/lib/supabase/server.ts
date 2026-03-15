import { createClient } from "@supabase/supabase-js";

import {
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
  hasPublicSupabaseEnv,
} from "@/lib/supabase/config";

export const createSupabaseServerClient = () =>
  createClient(getSupabaseUrl(), hasPublicSupabaseEnv() ? getSupabaseAnonKey() : getSupabaseServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
