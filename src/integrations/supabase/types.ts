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
          email: string;
          first_name: string;
          last_name: string;
          school: string | null;
          grade_level: string | null;
          section: string | null;
          bcoins: number;
          created_at: string;
          updated_at: string;
          avatar_url?: string | null;
        };
        Insert: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          school?: string | null;
          grade_level?: string | null;
          section?: string | null;
          bcoins?: number;
          avatar_url?: string | null;
        };
        Update: {
          first_name?: string;
          last_name?: string;
          school?: string | null;
          grade_level?: string | null;
          section?: string | null;
          bcoins?: number;
          avatar_url?: string | null;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          price: number;
          original_price: number | null;
          image: string;
          category: string;
          rating: number;
          sold: number;
          stock: number | null;
          description: string;
          is_flash_sale: boolean;
          is_active: boolean;
          seller_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          price: number;
          original_price?: number | null;
          image: string;
          category: string;
          rating?: number;
          sold?: number;
          stock?: number | null;
          description: string;
          is_flash_sale?: boolean;
          is_active?: boolean;
          seller_id?: string | null;
        };
        Update: {
          name?: string;
          price?: number;
          original_price?: number | null;
          image?: string;
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
      categories: {
        Row: {
          id: string;
          name: string;
          icon: string;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          icon: string;
          is_active?: boolean;
          sort_order?: number;
        };
        Update: {
          name?: string;
          icon?: string;
          is_active?: boolean;
          sort_order?: number;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          items: any[];
          total: number;
          bcoins_earned: number;
          status: string;
          delivery_type: string | null;
          delivery_fee: number;
          pickup_date: string | null;
          pickup_time: string | null;
          admin_commission: number;
          seller_earnings: number;
          seller_id: string | null;
          customer_name: string;
          customer_section: string | null;
          customer_grade_level: string | null;
          customer_contact: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          items: any[];
          total: number;
          bcoins_earned: number;
          status?: string;
          delivery_type?: string | null;
          delivery_fee?: number;
          pickup_date?: string | null;
          pickup_time?: string | null;
          admin_commission?: number;
          seller_earnings?: number;
          seller_id?: string | null;
          customer_name?: string;
          customer_section?: string | null;
          customer_grade_level?: string | null;
          customer_contact?: string | null;
        };
        Update: {
          status?: string;
          delivery_type?: string | null;
          delivery_fee?: number;
          pickup_date?: string | null;
          pickup_time?: string | null;
          admin_commission?: number;
          seller_earnings?: number;
          seller_id?: string | null;
          customer_name?: string;
          customer_section?: string | null;
          customer_grade_level?: string | null;
          customer_contact?: string | null;
        };
      };
      seller_profiles: {
        Row: {
          id: string;
          user_id: string;
          store_name: string;
          store_description: string | null;
          store_image: string | null;
          store_saying: string | null;
          location: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          store_name: string;
          store_description?: string | null;
          store_image?: string | null;
          store_saying?: string | null;
          location?: string | null;
          is_active?: boolean;
        };
        Update: {
          store_name?: string;
          store_description?: string | null;
          store_image?: string | null;
          store_saying?: string | null;
          location?: string | null;
          is_active?: boolean;
        };
      };
      club_memberships: {
        Row: {
          id: string;
          user_id: string;
          control_number: string;
          status: string;
          membership_date: string;
          expiry_date: string;
          membership_type: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          control_number: string;
          status?: string;
          membership_date?: string;
          expiry_date?: string;
          membership_type?: string;
        };
        Update: {
          control_number?: string;
          status?: string;
          membership_date?: string;
          expiry_date?: string;
          membership_type?: string;
        };
      };
      club_codes: {
        Row: {
          id: string;
          code: string;
          is_used: boolean;
          used_by: string | null;
          created_at: string;
        };
        Insert: {
          code: string;
          is_used?: boolean;
          used_by?: string | null;
        };
        Update: {
          code?: string;
          is_used?: boolean;
          used_by?: string | null;
        };
      };
      seller_codes: {
        Row: {
          id: string;
          code: string;
          is_used: boolean;
          used_by: string | null;
          created_at: string;
        };
        Insert: {
          code: string;
          is_used?: boolean;
          used_by?: string | null;
        };
        Update: {
          code?: string;
          is_used?: boolean;
          used_by?: string | null;
        };
      };
      bcoins_wallets: {
        Row: {
          id: string;
          user_id: string;
          balance: number;
          created_at: string;
          updated_at: string;
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
          description: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          amount: number;
          type: string;
          description?: string | null;
        };
        Update: {
          amount?: number;
          type?: string;
          description?: string | null;
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
          created_at: string;
        };
        Insert: {
          user_id: string;
          bcoins_amount: number;
          gcash_amount: number;
          gcash_number: string;
          status?: string;
        };
        Update: {
          bcoins_amount?: number;
          gcash_amount?: number;
          gcash_number?: string;
          status?: string;
        };
      };
      gcash_transactions: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          amount: number;
          service_fee: number;
          total: number;
          gcash_number: string;
          admin_gcash_number: string;
          reference_number: string;
          status: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          type: string;
          amount: number;
          service_fee: number;
          total: number;
          gcash_number: string;
          admin_gcash_number: string;
          reference_number: string;
          status?: string;
        };
        Update: {
          type?: string;
          amount?: number;
          service_fee?: number;
          total?: number;
          gcash_number?: string;
          admin_gcash_number?: string;
          reference_number?: string;
          status?: string;
        };
      };
      print_orders: {
        Row: {
          id: string;
          user_id: string;
          file_url: string | null;
          file_name: string;
          total_pages: number;
          bw_pages: number;
          colored_pages: number;
          page_size: string;
          cost: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          file_url?: string | null;
          file_name: string;
          total_pages: number;
          bw_pages: number;
          colored_pages: number;
          page_size: string;
          cost: number;
          status?: string;
        };
        Update: {
          file_url?: string | null;
          file_name?: string;
          total_pages?: number;
          bw_pages?: number;
          colored_pages?: number;
          page_size?: string;
          cost?: number;
          status?: string;
        };
      };
      job_postings: {
        Row: {
          id: string;
          client_id: string;
          title: string;
          category: string;
          description: string;
          location: string;
          hourly_rate: number;
          status: string;
          created_at: string;
          expires_at: string;
          hired_freelancer_id: string | null;
        };
        Insert: {
          client_id: string;
          title: string;
          category: string;
          description: string;
          location: string;
          hourly_rate: number;
          status?: string;
        };
        Update: {
          status?: string;
          hired_freelancer_id?: string | null;
        };
      };
      freelancer_profiles: {
        Row: {
          id: string;
          user_id: string;
          status: string;
          bio: string | null;
          subjects: string[] | null;
          experience: string | null;
          academic_strengths: string | null;
          rating: number;
          completed_sessions: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          status?: string;
          bio?: string | null;
          subjects?: string[] | null;
          experience?: string | null;
          academic_strengths?: string | null;
          rating?: number;
          completed_sessions?: number;
        };
        Update: {
          status?: string;
          bio?: string | null;
          subjects?: string[] | null;
          rating?: number;
          completed_sessions?: number;
        };
      };
      conversations: {
        Row: {
          id: string;
          participant_1: string;
          participant_2: string;
          last_message: string | null;
          last_message_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          participant_1: string;
          participant_2: string;
          last_message?: string | null;
          last_message_at?: string | null;
        };
        Update: {
          last_message?: string | null;
          last_message_at?: string | null;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          conversation_id: string;
          sender_id: string;
          content: string;
          is_read?: boolean;
        };
        Update: {
          content?: string;
          is_read?: boolean;
        };
      };
      notification_logs: {
        Row: {
          id: string;
          user_id: string | null;
          target_role: string | null;
          title: string;
          message: string;
          type: string;
          link: string | null;
          icon: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          user_id?: string | null;
          target_role?: string | null;
          title: string;
          message: string;
          type: string;
          link?: string | null;
          icon?: string | null;
          is_read?: boolean;
        };
        Update: {
          user_id?: string | null;
          target_role?: string | null;
          title?: string;
          message?: string;
          type?: string;
          link?: string | null;
          icon?: string | null;
          is_read?: boolean;
        };
      };
      app_settings: {
        Row: {
          id: string;
          key: string;
          value: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: any;
        };
        Update: {
          key?: string;
          value?: any;
        };
      };
      banners: {
        Row: {
          id: string;
          image_url: string;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          image_url: string;
          is_active?: boolean;
          sort_order?: number;
        };
        Update: {
          image_url?: string;
          is_active?: boolean;
          sort_order?: number;
        };
      };
      news_updates: {
        Row: {
          id: string;
          title: string;
          content: string;
          image_url: string | null;
          images: string[] | null;
          category: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          title: string;
          content: string;
          image_url?: string | null;
          images?: string[] | null;
          category?: string;
          is_active?: boolean;
        };
        Update: {
          title?: string;
          content?: string;
          image_url?: string | null;
          images?: string[] | null;
          category?: string;
          is_active?: boolean;
        };
      };
      pos_sales: {
        Row: {
          id: string;
          sale_type: string;
          items: any[];
          subtotal: number;
          total: number;
          main_admin_commission: number;
          member_admin_earnings: number;
          seller_earnings: number;
          sold_by: string;
          customer_name: string | null;
          created_at: string;
        };
        Insert: {
          sale_type: string;
          items: any[];
          subtotal: number;
          total: number;
          main_admin_commission: number;
          member_admin_earnings: number;
          seller_earnings: number;
          sold_by: string;
          customer_name?: string | null;
        };
        Update: {
          sale_type?: string;
          items?: any[];
          subtotal?: number;
          total?: number;
          main_admin_commission?: number;
          member_admin_earnings?: number;
          seller_earnings?: number;
          sold_by?: string;
          customer_name?: string | null;
        };
      };
      user_roles: {
        Row: {
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          role: string;
        };
        Update: {
          role?: string;
        };
      };
      seller_applications: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          reason: string;
          business_type: string;
          products_to_sell: string;
          experience: string | null;
          status: string;
          admin_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          full_name: string;
          reason: string;
          business_type: string;
          products_to_sell: string;
          experience?: string | null;
          status?: string;
          admin_notes?: string | null;
        };
        Update: {
          full_name?: string;
          reason?: string;
          business_type?: string;
          products_to_sell?: string;
          experience?: string | null;
          status?: string;
          admin_notes?: string | null;
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