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
        };
        Insert: {
          user_id: string;
          first_name: string;
          last_name: string;
          email: string;
          school?: string | null;
          grade_level?: string | null;
          section?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          first_name?: string;
          last_name?: string;
          school?: string | null;
          grade_level?: string | null;
          section?: string | null;
          avatar_url?: string | null;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          items: any[];
          total: number;
          delivery_type: "pickup" | "delivery";
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
          delivery_type: "pickup" | "delivery";
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
          page_size: "short" | "long";
          delivery_type: "pickup" | "delivery";
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
          page_size: "short" | "long";
          delivery_type: "pickup" | "delivery";
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
      user_atm_cards: {
        Row: {
          id: string;
          user_id: string;
          card_number: string;
          card_holder_name: string;
          bcoins_wallet_id: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          user_id: string;
          card_number: string;
          card_holder_name: string;
          bcoins_wallet_id: string;
          is_active?: boolean;
        };
        Update: {
          is_active?: boolean;
        };
      };
      bcoins_redemptions: {
        Row: {
          id: string;
          user_id: string;
          bcoins_amount: number;
          gcash_amount: number;
          gcash_number: string;
          status: string;
          atm_card_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          bcoins_amount: number;
          gcash_amount: number;
          gcash_number: string;
          status?: string;
          atm_card_id: string;
        };
        Update: {
          status?: string;
        };
      };
      bcoins_wallets: {
        Row: {
          id: string;
          user_id: string;
          balance: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          balance?: number;
        };
        Update: {
          balance?: number;
        };
      };
      bcoins_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          type: string;
          description: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          amount: number;
          type: string;
          description: string;
        };
        Update: {
          amount?: number;
          type?: string;
          description?: string;
        };
      };
    };
    Functions: {
      get_user_role: {
        Args: { _user_id: string };
        Returns: any;
      };
    };
  };
};