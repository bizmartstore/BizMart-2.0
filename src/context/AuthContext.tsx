interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  school?: string | null;
  grade_level?: string | null;
  section?: string | null;
  avatar_url?: string | null;
  bcoins?: number;
  role?: string;
  bio?: string; // Add bio field
  created_at: string;
  updated_at: string;
}