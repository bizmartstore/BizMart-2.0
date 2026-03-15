export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          message: string
          title: string
          type: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          title: string
          type?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          title?: string
          type?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      banners: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          is_active: boolean | null
          sort_order: number | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          sort_order?: number | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          sort_order?: number | null
          title?: string | null
        }
        Relationships: []
      }
      bcoins_redemptions: {
        Row: {
          bcoins_amount: number
          created_at: string
          gcash_amount: number
          gcash_number: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          bcoins_amount: number
          created_at?: string
          gcash_amount: number
          gcash_number: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          bcoins_amount?: number
          created_at?: string
          gcash_amount?: number
          gcash_number?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      bcoins_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      bcoins_wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          icon: string
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          icon?: string
          id: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          icon?: string
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      club_codes: {
        Row: {
          code: string
          created_at: string
          generated_by: string | null
          id: string
          is_used: boolean
          sent_at: string | null
          sent_to_name: string | null
          sent_to_user_id: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          generated_by?: string | null
          id?: string
          is_used?: boolean
          sent_at?: string | null
          sent_to_name?: string | null
          sent_to_user_id?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          generated_by?: string | null
          id?: string
          is_used?: boolean
          sent_at?: string | null
          sent_to_name?: string | null
          sent_to_user_id?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      club_memberships: {
        Row: {
          control_number: string
          created_at: string
          expiry_date: string
          id: string
          membership_date: string
          membership_type: string
          status: string
          user_id: string
        }
        Insert: {
          control_number: string
          created_at?: string
          expiry_date: string
          id?: string
          membership_date?: string
          membership_type?: string
          status?: string
          user_id: string
        }
        Update: {
          control_number?: string
          created_at?: string
          expiry_date?: string
          id?: string
          membership_date?: string
          membership_type?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          last_message: string | null
          last_message_at: string | null
          participant_1: string
          participant_2: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          participant_1: string
          participant_2: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          participant_1?: string
          participant_2?: string
        }
        Relationships: []
      }
      gcash_transactions: {
        Row: {
          admin_gcash_number: string
          amount: number
          created_at: string
          gcash_number: string
          id: string
          reference_number: string
          service_fee: number
          status: string
          total: number
          type: string
          user_id: string
        }
        Insert: {
          admin_gcash_number: string
          amount: number
          created_at?: string
          gcash_number: string
          id?: string
          reference_number: string
          service_fee?: number
          status?: string
          total: number
          type: string
          user_id: string
        }
        Update: {
          admin_gcash_number?: string
          amount?: number
          created_at?: string
          gcash_number?: string
          id?: string
          reference_number?: string
          service_fee?: number
          status?: string
          total?: number
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      news_updates: {
        Row: {
          category: string
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          image_url: string | null
          images: Json | null
          is_active: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          link: string | null
          message: string
          target_role: string | null
          target_user_id: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          link?: string | null
          message: string
          target_role?: string | null
          target_user_id?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          link?: string | null
          message?: string
          target_role?: string | null
          target_user_id?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          admin_commission: number
          bcoins_earned: number
          created_at: string
          customer_contact: string | null
          customer_grade_level: string | null
          customer_name: string | null
          customer_section: string | null
          delivery_fee: number
          delivery_type: string
          id: string
          items: Json
          member_admin_commission: number
          pickup_date: string | null
          pickup_time: string | null
          seller_earnings: number
          seller_id: string | null
          status: string
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_commission?: number
          bcoins_earned?: number
          created_at?: string
          customer_contact?: string | null
          customer_grade_level?: string | null
          customer_name?: string | null
          customer_section?: string | null
          delivery_fee?: number
          delivery_type?: string
          id?: string
          items?: Json
          member_admin_commission?: number
          pickup_date?: string | null
          pickup_time?: string | null
          seller_earnings?: number
          seller_id?: string | null
          status?: string
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_commission?: number
          bcoins_earned?: number
          created_at?: string
          customer_contact?: string | null
          customer_grade_level?: string | null
          customer_name?: string | null
          customer_section?: string | null
          delivery_fee?: number
          delivery_type?: string
          id?: string
          items?: Json
          member_admin_commission?: number
          pickup_date?: string | null
          pickup_time?: string | null
          seller_earnings?: number
          seller_id?: string | null
          status?: string
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pos_sales: {
        Row: {
          created_at: string
          customer_name: string | null
          id: string
          items: Json
          main_admin_commission: number
          member_admin_earnings: number
          notes: string | null
          sale_type: string
          seller_earnings: number
          sold_by: string
          subtotal: number
          total: number
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          id?: string
          items?: Json
          main_admin_commission?: number
          member_admin_earnings?: number
          notes?: string | null
          sale_type?: string
          seller_earnings?: number
          sold_by: string
          subtotal?: number
          total?: number
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          id?: string
          items?: Json
          main_admin_commission?: number
          member_admin_earnings?: number
          notes?: string | null
          sale_type?: string
          seller_earnings?: number
          sold_by?: string
          subtotal?: number
          total?: number
        }
        Relationships: []
      }
      print_orders: {
        Row: {
          bw_pages: number
          colored_pages: number
          cost: number
          created_at: string
          delivery_fee: number
          delivery_type: string
          file_name: string
          file_url: string | null
          id: string
          maintenance_fee: number
          notes: string | null
          page_size: string
          pickup_date: string | null
          pickup_time: string | null
          status: string
          total_pages: number
          updated_at: string
          user_id: string
        }
        Insert: {
          bw_pages?: number
          colored_pages?: number
          cost?: number
          created_at?: string
          delivery_fee?: number
          delivery_type?: string
          file_name: string
          file_url?: string | null
          id?: string
          maintenance_fee?: number
          notes?: string | null
          page_size?: string
          pickup_date?: string | null
          pickup_time?: string | null
          status?: string
          total_pages?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          bw_pages?: number
          colored_pages?: number
          cost?: number
          created_at?: string
          delivery_fee?: number
          delivery_type?: string
          file_name?: string
          file_url?: string | null
          id?: string
          maintenance_fee?: number
          notes?: string | null
          page_size?: string
          pickup_date?: string | null
          pickup_time?: string | null
          status?: string
          total_pages?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image: string | null
          is_active: boolean | null
          is_flash_sale: boolean | null
          name: string
          original_price: number | null
          price: number
          rating: number | null
          seller_id: string | null
          sold: number | null
          stock: number
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id: string
          image?: string | null
          is_active?: boolean | null
          is_flash_sale?: boolean | null
          name: string
          original_price?: number | null
          price: number
          rating?: number | null
          seller_id?: string | null
          sold?: number | null
          stock?: number
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image?: string | null
          is_active?: boolean | null
          is_flash_sale?: boolean | null
          name?: string
          original_price?: number | null
          price?: number
          rating?: number | null
          seller_id?: string | null
          sold?: number | null
          stock?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string
          grade_level: string
          id: string
          last_name: string
          school: string
          section: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name: string
          grade_level: string
          id?: string
          last_name: string
          school: string
          section: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string
          grade_level?: string
          id?: string
          last_name?: string
          school?: string
          section?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      seller_applications: {
        Row: {
          admin_notes: string | null
          business_type: string
          created_at: string
          experience: string | null
          full_name: string
          id: string
          products_to_sell: string
          reason: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          business_type?: string
          created_at?: string
          experience?: string | null
          full_name: string
          id?: string
          products_to_sell?: string
          reason?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          business_type?: string
          created_at?: string
          experience?: string | null
          full_name?: string
          id?: string
          products_to_sell?: string
          reason?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      seller_codes: {
        Row: {
          code: string
          created_at: string
          generated_by: string | null
          id: string
          is_used: boolean
          sent_at: string | null
          sent_to_name: string | null
          sent_to_user_id: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          generated_by?: string | null
          id?: string
          is_used?: boolean
          sent_at?: string | null
          sent_to_name?: string | null
          sent_to_user_id?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          generated_by?: string | null
          id?: string
          is_used?: boolean
          sent_at?: string | null
          sent_to_name?: string | null
          sent_to_user_id?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      seller_profiles: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          location: string | null
          store_description: string | null
          store_image: string | null
          store_name: string
          store_saying: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          location?: string | null
          store_description?: string | null
          store_image?: string | null
          store_name?: string
          store_saying?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          location?: string | null
          store_description?: string | null
          store_image?: string | null
          store_name?: string
          store_saying?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_order_with_stock: {
        Args: { _order_id: string }
        Returns: {
          admin_commission: number
          bcoins_earned: number
          created_at: string
          customer_contact: string | null
          customer_grade_level: string | null
          customer_name: string | null
          customer_section: string | null
          delivery_fee: number
          delivery_type: string
          id: string
          items: Json
          member_admin_commission: number
          pickup_date: string | null
          pickup_time: string | null
          seller_earnings: number
          seller_id: string | null
          status: string
          total: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      complete_order_with_stock: {
        Args: { _order_id: string }
        Returns: {
          admin_commission: number
          bcoins_earned: number
          created_at: string
          customer_contact: string | null
          customer_grade_level: string | null
          customer_name: string | null
          customer_section: string | null
          delivery_fee: number
          delivery_type: string
          id: string
          items: Json
          member_admin_commission: number
          pickup_date: string | null
          pickup_time: string | null
          seller_earnings: number
          seller_id: string | null
          status: string
          total: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      emit_live_shoutout: {
        Args: {
          p_icon?: string
          p_link?: string
          p_message: string
          p_title: string
        }
        Returns: undefined
      }
      get_user_role: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "main_admin" | "member_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["main_admin", "member_admin"],
    },
  },
} as const
