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
      pos_orders: {
        Row: {
          id: string;
          user_id: string | null;
          order_type: "print" | "photocopy";
          file_url: string | null;
          file_name: string | null;
          total_pages: number;
          bw_pages: number;
          colored_pages: number;
          page_size: "short" | "a4" | "long";
          delivery_type: "pickup" | "delivery";
          pickup_date: string;
          pickup_time: string;
          cost: number;
          status: "pending" | "approved" | "completed" | "rejected" | "canceled";
          created_at: string;
          customer_name: string | null;
          customer_grade: string | null;
          customer_section: string | null;
        };
        Insert: {
          user_id?: string | null;
          order_type: "print" | "photocopy";
          file_url?: string | null;
          file_name?: string | null;
          total_pages: number;
          bw_pages: number;
          colored_pages: number;
          page_size: "short" | "a4" | "long";
          delivery_type: "pickup" | "delivery";
          pickup_date: string;
          pickup_time: string;
          cost: number;
          status?: "pending" | "approved" | "completed" | "rejected" | "canceled";
          customer_name?: string | null;
          customer_grade?: string | null;
          customer_section?: string | null;
        };
        Update: {
          status?: "pending" | "approved" | "completed" | "rejected" | "canceled";
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
      organizations: {
        Row: {
          id: string;
          name: string;
          description: string;
          adviser_name: string | null;
          club_type: string;
          status: 'pending' | 'approved' | 'rejected' | 'archived';
          creator_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          description: string;
          adviser_name?: string | null;
          club_type: string;
          status?: 'pending' | 'approved' | 'rejected' | 'archived';
          creator_id: string;
        };
        Update: {
          name?: string;
          description?: string;
          adviser_name?: string | null;
          club_type?: string;
          status?: 'pending' | 'approved' | 'rejected' | 'archived';
        };
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: 'creator' | 'officer' | 'member';
          joined_at: string;
          status: 'active' | 'left';
        };
        Insert: {
          organization_id: string;
          user_id: string;
          role?: 'creator' | 'officer' | 'member';
          status?: 'active' | 'left';
        };
        Update: {
          role?: 'creator' | 'officer' | 'member';
          status?: 'active' | 'left';
        };
      };
      organization_events: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string;
          deadline: string | null;
          capacity: number;
          fee: number;
          status: 'upcoming' | 'ongoing' | 'completed';
          created_by: string;
          created_at: string;
        };
        Insert: {
          organization_id: string;
          name: string;
          description: string;
          deadline?: string | null;
          capacity?: number;
          fee?: number;
          status?: 'upcoming' | 'ongoing' | 'completed';
          created_by: string;
        };
        Update: {
          name?: string;
          description?: string;
          deadline?: string | null;
          capacity?: number;
          fee?: number;
          status?: 'upcoming' | 'ongoing' | 'completed';
        };
      };
      organization_transactions: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          type: 'deposit' | 'withdrawal';
          amount: number;
          status: 'pending' | 'approved' | 'rejected' | 'completed';
          purpose: string;
          reference: string | null;
          gcash_fee: number;
          created_at: string;
        };
        Insert: {
          organization_id: string;
          user_id: string;
          type: 'deposit' | 'withdrawal';
          amount: number;
          status?: 'pending' | 'approved' | 'rejected' | 'completed';
          purpose: string;
          reference?: string | null;
          gcash_fee?: number;
        };
        Update: {
          type?: 'deposit' | 'withdrawal';
          amount?: number;
          status?: 'pending' | 'approved' | 'rejected' | 'completed';
          purpose?: string;
          reference?: string | null;
          gcash_fee?: number;
        };
      };
      organization_announcements: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          content: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          organization_id: string;
          title: string;
          content: string;
          created_by: string;
        };
        Update: {
          title?: string;
          content?: string;
        };
      };
      organization_wallets: {
        Row: {
          id: string;
          organization_id: string;
          balance: number;
          created_at: string;
        };
        Insert: {
          organization_id: string;
          balance?: number;
        };
        Update: {
          organization_id?: string;
          balance?: number;
        };
      };
      registration_codes: {
        Row: {
          id: string;
          code: string;
          used: boolean;
          created_at: string;
        };
        Insert: {
          code: string;
          used?: boolean;
        };
        Update: {
          used?: boolean;
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
