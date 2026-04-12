export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          first_name: string;
          last_name: string;
          email: string;
          school: string | null;
          grade_level: string | null;
          section: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
          role: string | null;
          bcoins: number | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          first_name: string;
          last_name: string;
          email: string;
          school?: string | null;
          grade_level?: string | null;
          section?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          role?: string | null;
          bcoins?: number | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
          school?: string | null;
          grade_level?: string | null;
          section?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          role?: string | null;
          bcoins?: number | null;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          items: any[];
          total: number;
          delivery_type: string;
          pickup_date: string;
          pickup_time: string;
          delivery_fee: number;
          bcoins_earned: number;
          status: string;
          created_at: string;
          updated_at: string;
          seller_id: string | null;
          customer_name: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          items: any[];
          total: number;
          delivery_type: string;
          pickup_date: string;
          pickup_time: string;
          delivery_fee?: number;
          bcoins_earned?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
          seller_id?: string | null;
          customer_name?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          items?: any[];
          total?: number;
          delivery_type?: string;
          pickup_date?: string;
          pickup_time?: string;
          delivery_fee?: number;
          bcoins_earned?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
          seller_id?: string | null;
          customer_name?: string | null;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          price: number;
          original_price: number | null;
          image: string | null;
          images: string[] | null;
          category: string;
          rating: number | null;
          sold: number | null;
          stock: number | null;
          description: string | null;
          isflashsale: boolean | null;
          is_active: boolean | null;
          seller_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          price: number;
          original_price?: number | null;
          image?: string | null;
          images?: string[] | null;
          category: string;
          rating?: number | null;
          sold?: number | null;
          stock?: number | null;
          description?: string | null;
          isflashsale?: boolean | null;
          is_active?: boolean | null;
          seller_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          price?: number;
          original_price?: number | null;
          image?: string | null;
          images?: string[] | null;
          category?: string;
          rating?: number | null;
          sold?: number | null;
          stock?: number | null;
          description?: string | null;
          isflashsale?: boolean | null;
          is_active?: boolean | null;
          seller_id?: string | null;
          created_at?: string;
        };
      };
    };
    Functions: {
      get_user_role: {
        Args: { _user_id: string };
        Returns: string;
      };
    };
  };
};