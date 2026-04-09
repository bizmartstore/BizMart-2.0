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
          role?: string | null;
          bcoins?: number | null;
        };
        Update: {
          first_name?: string;
          last_name?: string;
          school?: string | null;
          grade_level?: string | null;
          section?: string | null;
          avatar_url?: string | null;
          role?: string | null;
          bcoins?: number | null;
        };
      };
      notification_logs: {
        Row: {
          id: string;
          user_id: string | null;
          target_user_id: string | null;
          target_role: string | null;
          type: string;
          title: string;
          message: string;
          icon: string | null;
          link: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          target_user_id?: string | null;
          target_role?: string | null;
          type: string;
          title: string;
          message: string;
          icon?: string | null;
          link?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          is_read?: boolean;
        };
      };
      user_push_tokens: {
        Row: {
          id: string;
          user_id: string;
          role: string;
          fcm_token: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: string;
          fcm_token: string;
        };
        Update: {
          fcm_token?: string;
          role?: string;
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
        };
        Insert: {
          user_id: string;
          items: any[];
          total: number;
          delivery_type: string;
          pickup_date: string;
          pickup_time: string;
          delivery_fee: number;
          bcoins_earned: number;
          status?: string;
        };
        Update: {
          status?: string;
        };
      };
      print_orders: {
        Row: {
          id: string;
          user_id: string;
          file_url: string;
          file_name: string;
          total_pages: number;
          bw_pages: number;
          colored_pages: number;
          page_size: string;
          delivery_type: string;
          pickup_date: string;
          pickup_time: string;
          cost: number;
          status: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          file_url: string;
          file_name: string;
          total_pages: number;
          bw_pages: number;
          colored_pages: number;
          page_size: string;
          delivery_type: string;
          pickup_date: string;
          pickup_time: string;
          cost: number;
          status?: string;
        };
        Update: {
          status?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          price: number;
          original_price: string | null;
          image: string;
          images: string[] | null;
          category: string;
          rating: number;
          sold: number;
          stock: number | null;
          description: string;
          is_flash_sale: boolean;
          is_active: boolean;
          seller_id: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          price: number;
          original_price?: string | null;
          image: string;
          images?: string[] | null;
          category: string;
          rating?: number;
          sold?: number;
          stock?: number | null;
          description?: string;
          is_flash_sale?: boolean;
          is_active?: boolean;
          seller_id?: string | null;
        };
        Update: {
          name?: string;
          price?: number;
          original_price?: string | null;
          image?: string;
          images?: string[] | null;
          category?: string;
          rating?: number;
          sold?: number;
          stock?: number | null;
          description?: string;
          is_flash_sale?: boolean;
          is_active?: boolean;
          seller_id?: string | null;
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