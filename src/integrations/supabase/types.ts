export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      // ... previous table definitions ...
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: string
      }
    }
  }
}