declare module "supabase-js" {
  namespace Supabase {
    interface UpsertResponse<T> {
      data: T | null;
      error: any;
    }
  }
}