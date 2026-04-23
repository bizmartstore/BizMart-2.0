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
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          message: string
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          title?: string
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
          value: Json
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
          created_at: string | null
          gcash_amount: number
          gcash_number: string
          id: string
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          bcoins_amount: number
          created_at?: string | null
          gcash_amount: number
          gcash_number: string
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          bcoins_amount?: number
          created_at?: string | null
          gcash_amount?: number
          gcash_number?: string
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bcoins_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
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
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bizmon_battles: {
        Row: {
          bcoins_gained: number | null
          challenger_id: string | null
          challenger_pet_id: string | null
          created_at: string | null
          defender_id: string | null
          defender_pet_id: string | null
          id: string
          result: string | null
          xp_gained: number | null
        }
        Insert: {
          bcoins_gained?: number | null
          challenger_id?: string | null
          challenger_pet_id?: string | null
          created_at?: string | null
          defender_id?: string | null
          defender_pet_id?: string | null
          id?: string
          result?: string | null
          xp_gained?: number | null
        }
        Update: {
          bcoins_gained?: number | null
          challenger_id?: string | null
          challenger_pet_id?: string | null
          created_at?: string | null
          defender_id?: string | null
          defender_pet_id?: string | null
          id?: string
          result?: string | null
          xp_gained?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bizmon_battles_challenger_pet_id_fkey"
            columns: ["challenger_pet_id"]
            isOneToOne: false
            referencedRelation: "bizmon_pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bizmon_battles_defender_pet_id_fkey"
            columns: ["defender_pet_id"]
            isOneToOne: false
            referencedRelation: "bizmon_pets"
            referencedColumns: ["id"]
          },
        ]
      }
      bizmon_daily_limits: {
        Row: {
          battles_played: number | null
          bcoins_earned: number | null
          date: string | null
          id: string
          training_sessions: number | null
          user_id: string | null
        }
        Insert: {
          battles_played?: number | null
          bcoins_earned?: number | null
          date?: string | null
          id?: string
          training_sessions?: number | null
          user_id?: string | null
        }
        Update: {
          battles_played?: number | null
          bcoins_earned?: number | null
          date?: string | null
          id?: string
          training_sessions?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      bizmon_pets: {
        Row: {
          battles_won: number | null
          created_at: string | null
          happiness: number | null
          health: number | null
          hunger: number | null
          id: string
          last_fed: string | null
          last_trained: string | null
          level: number | null
          max_health: number | null
          name: string
          total_battles: number | null
          updated_at: string | null
          user_id: string | null
          xp: number | null
          xp_to_next_level: number | null
        }
        Insert: {
          battles_won?: number | null
          created_at?: string | null
          happiness?: number | null
          health?: number | null
          hunger?: number | null
          id?: string
          last_fed?: string | null
          last_trained?: string | null
          level?: number | null
          max_health?: number | null
          name: string
          total_battles?: number | null
          updated_at?: string | null
          user_id?: string | null
          xp?: number | null
          xp_to_next_level?: number | null
        }
        Update: {
          battles_won?: number | null
          created_at?: string | null
          happiness?: number | null
          health?: number | null
          hunger?: number | null
          id?: string
          last_fed?: string | null
          last_trained?: string | null
          level?: number | null
          max_health?: number | null
          name?: string
          total_battles?: number | null
          updated_at?: string | null
          user_id?: string | null
          xp?: number | null
          xp_to_next_level?: number | null
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
          icon: string
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
          created_at: string | null
          id: string
          is_used: boolean | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_used?: boolean | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_used?: boolean | null
          used_by?: string | null
        }
        Relationships: []
      }
      club_memberships: {
        Row: {
          control_number: string | null
          created_at: string | null
          expiry_date: string | null
          id: string
          membership_date: string | null
          membership_type: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          control_number?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          membership_date?: string | null
          membership_type?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          control_number?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          membership_date?: string | null
          membership_type?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
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
      escrow_transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          job_id: string | null
          session_id: string | null
          status: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          job_id?: string | null
          session_id?: string | null
          status?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          job_id?: string | null
          session_id?: string | null
          status?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_transactions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_transactions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "job_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      fcm_tokens: {
        Row: {
          created_at: string | null
          device_type: string | null
          id: string
          token: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_type?: string | null
          id?: string
          token: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_type?: string | null
          id?: string
          token?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      flash_sale_products: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          discount_percent: number | null
          ends_at: string | null
          id: string
          image: string | null
          images: Json | null
          is_active: boolean | null
          is_flash_sale: boolean | null
          name: string | null
          original_price: number | null
          price: number | null
          product_id: string | null
          rating: number | null
          sale_price: number | null
          seller_id: string | null
          sold: number | null
          stock: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          discount_percent?: number | null
          ends_at?: string | null
          id?: string
          image?: string | null
          images?: Json | null
          is_active?: boolean | null
          is_flash_sale?: boolean | null
          name?: string | null
          original_price?: number | null
          price?: number | null
          product_id?: string | null
          rating?: number | null
          sale_price?: number | null
          seller_id?: string | null
          sold?: number | null
          stock?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          discount_percent?: number | null
          ends_at?: string | null
          id?: string
          image?: string | null
          images?: Json | null
          is_active?: boolean | null
          is_flash_sale?: boolean | null
          name?: string | null
          original_price?: number | null
          price?: number | null
          product_id?: string | null
          rating?: number | null
          sale_price?: number | null
          seller_id?: string | null
          sold?: number | null
          stock?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "flash_sale_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      freelancer_profiles: {
        Row: {
          academic_strengths: string | null
          bio: string | null
          completed_sessions: number | null
          created_at: string | null
          experience: string | null
          id: string
          rating: number | null
          status: string
          subjects: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          academic_strengths?: string | null
          bio?: string | null
          completed_sessions?: number | null
          created_at?: string | null
          experience?: string | null
          id?: string
          rating?: number | null
          status?: string
          subjects?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          academic_strengths?: string | null
          bio?: string | null
          completed_sessions?: number | null
          created_at?: string | null
          experience?: string | null
          id?: string
          rating?: number | null
          status?: string
          subjects?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "freelancer_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      gcash_transactions: {
        Row: {
          admin_gcash_number: string
          amount: number
          created_at: string | null
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
          created_at?: string | null
          gcash_number: string
          id?: string
          reference_number: string
          service_fee: number
          status?: string
          total: number
          type: string
          user_id: string
        }
        Update: {
          admin_gcash_number?: string
          amount?: number
          created_at?: string | null
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
      hottest_sale_products: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          product_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          product_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          product_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hottest_sale_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      job_bids: {
        Row: {
          contact_number: string | null
          created_at: string | null
          freelancer_id: string
          id: string
          job_id: string
          message: string
          proposed_price: number
          status: string | null
          updated_at: string | null
        }
        Insert: {
          contact_number?: string | null
          created_at?: string | null
          freelancer_id: string
          id?: string
          job_id: string
          message: string
          proposed_price: number
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          contact_number?: string | null
          created_at?: string | null
          freelancer_id?: string
          id?: string
          job_id?: string
          message?: string
          proposed_price?: number
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_bids_freelancer_id_fkey"
            columns: ["freelancer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_bids_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_disputes: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          reason: string
          reporter_id: string
          resolution: string | null
          session_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          reason: string
          reporter_id: string
          resolution?: string | null
          session_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          resolution?: string | null
          session_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_disputes_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_disputes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "job_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      job_postings: {
        Row: {
          approved_location: string | null
          category: string
          client_id: string
          created_at: string | null
          description: string
          difficulty_level: string | null
          duration_hours: number | null
          escrow_amount: number | null
          expected_output: string | null
          expires_at: string | null
          hired_freelancer_id: string | null
          hourly_rate: number
          id: string
          instructions: string | null
          location: string
          location_type: string | null
          max_price: number | null
          min_price: number | null
          requirements: string | null
          service_hours: number | null
          started_at: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          approved_location?: string | null
          category: string
          client_id: string
          created_at?: string | null
          description: string
          difficulty_level?: string | null
          duration_hours?: number | null
          escrow_amount?: number | null
          expected_output?: string | null
          expires_at?: string | null
          hired_freelancer_id?: string | null
          hourly_rate: number
          id?: string
          instructions?: string | null
          location: string
          location_type?: string | null
          max_price?: number | null
          min_price?: number | null
          requirements?: string | null
          service_hours?: number | null
          started_at?: string | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          approved_location?: string | null
          category?: string
          client_id?: string
          created_at?: string | null
          description?: string
          difficulty_level?: string | null
          duration_hours?: number | null
          escrow_amount?: number | null
          expected_output?: string | null
          expires_at?: string | null
          hired_freelancer_id?: string | null
          hourly_rate?: number
          id?: string
          instructions?: string | null
          location?: string
          location_type?: string | null
          max_price?: number | null
          min_price?: number | null
          requirements?: string | null
          service_hours?: number | null
          started_at?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_postings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      job_sessions: {
        Row: {
          created_at: string | null
          customer_id: string
          customer_proof: string | null
          customer_proof_submitted_at: string | null
          customer_rating: number | null
          customer_review: string | null
          duration_minutes: number | null
          end_time: string | null
          escrow_released: boolean | null
          freelancer_id: string
          freelancer_proof: string | null
          freelancer_proof_submitted_at: string | null
          freelancer_rating: number | null
          freelancer_review: string | null
          id: string
          job_id: string
          proof_description: string | null
          proof_urls: string[] | null
          start_time: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          customer_proof?: string | null
          customer_proof_submitted_at?: string | null
          customer_rating?: number | null
          customer_review?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          escrow_released?: boolean | null
          freelancer_id: string
          freelancer_proof?: string | null
          freelancer_proof_submitted_at?: string | null
          freelancer_rating?: number | null
          freelancer_review?: string | null
          id?: string
          job_id: string
          proof_description?: string | null
          proof_urls?: string[] | null
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          customer_proof?: string | null
          customer_proof_submitted_at?: string | null
          customer_rating?: number | null
          customer_review?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          escrow_released?: boolean | null
          freelancer_id?: string
          freelancer_proof?: string | null
          freelancer_proof_submitted_at?: string | null
          freelancer_rating?: number | null
          freelancer_review?: string | null
          id?: string
          job_id?: string
          proof_description?: string | null
          proof_urls?: string[] | null
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_sessions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_sessions_freelancer_id_fkey"
            columns: ["freelancer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_sessions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
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
          category: string | null
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          images: string[] | null
          is_active: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_active?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_active?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          target_role: string | null
          target_user_id: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          target_role?: string | null
          target_user_id?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          target_role?: string | null
          target_user_id?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          admin_commission: number | null
          bcoins_earned: number | null
          created_at: string | null
          customer_contact: string | null
          customer_grade_level: string | null
          customer_name: string | null
          customer_section: string | null
          delivery_fee: number | null
          delivery_type: string
          id: string
          items: Json
          member_admin_commission: number | null
          pickup_date: string | null
          pickup_time: string | null
          seller_earnings: number | null
          seller_id: string | null
          status: string
          total: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_commission?: number | null
          bcoins_earned?: number | null
          created_at?: string | null
          customer_contact?: string | null
          customer_grade_level?: string | null
          customer_name?: string | null
          customer_section?: string | null
          delivery_fee?: number | null
          delivery_type: string
          id?: string
          items: Json
          member_admin_commission?: number | null
          pickup_date?: string | null
          pickup_time?: string | null
          seller_earnings?: number | null
          seller_id?: string | null
          status?: string
          total: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_commission?: number | null
          bcoins_earned?: number | null
          created_at?: string | null
          customer_contact?: string | null
          customer_grade_level?: string | null
          customer_name?: string | null
          customer_section?: string | null
          delivery_fee?: number | null
          delivery_type?: string
          id?: string
          items?: Json
          member_admin_commission?: number | null
          pickup_date?: string | null
          pickup_time?: string | null
          seller_earnings?: number | null
          seller_id?: string | null
          status?: string
          total?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      organization_announcements: {
        Row: {
          content: string | null
          created_at: string | null
          created_by: string | null
          id: string
          organization_id: string | null
          title: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          organization_id?: string | null
          title?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          organization_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_announcements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_events: {
        Row: {
          capacity: number | null
          created_at: string | null
          created_by: string | null
          deadline: string | null
          description: string | null
          fee: number | null
          id: string
          name: string
          organization_id: string | null
          status: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          fee?: number | null
          id?: string
          name: string
          organization_id?: string | null
          status?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          fee?: number | null
          id?: string
          name?: string
          organization_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          id: string
          joined_at: string
          organization_id: string
          reference_code: string | null
          role: string
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          organization_id: string
          reference_code?: string
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          organization_id?: string
          reference_code?: string
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_transactions: {
        Row: {
          amount: number | null
          created_at: string | null
          gcash_fee: number | null
          id: string
          organization_id: string | null
          purpose: string | null
          reference: string | null
          status: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          gcash_fee?: number | null
          id?: string
          organization_id?: string | null
          purpose?: string | null
          reference?: string | null
          status?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          gcash_fee?: number | null
          id?: string
          organization_id?: string | null
          purpose?: string | null
          reference?: string | null
          status?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_org_tx_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_wallets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_references: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          organization_id: string | null
          reference_code: string
          used: boolean | null
          used_by: string | null
          used_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          organization_id?: string | null
          reference_code: string
          used?: boolean | null
          used_by?: string | null
          used_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          organization_id?: string | null
          reference_code?: string
          used?: boolean | null
          used_by?: string | null
          used_at?: string | null
        }
        Relationships: []
      }
      organizations: {
        Row: {
          adviser_name: string | null
          club_type: string
          created_at: string
          creator_id: string
          description: string | null
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          adviser_name?: string | null
          club_type: string
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          adviser_name?: string | null
          club_type?: string
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_organizations_creator_id"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_sales: {
        Row: {
          created_at: string | null
          id: string
          items: Json
          sold_by: string | null
          total: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          items: Json
          sold_by?: string | null
          total: number
        }
        Update: {
          created_at?: string | null
          id?: string
          items?: Json
          sold_by?: string | null
          total?: number
        }
        Relationships: []
      }
      print_orders: {
        Row: {
          a4_pages: number | null
          bw_pages: number
          colored_pages: number
          cost: number
          created_at: string | null
          delivery_fee: number | null
          delivery_type: string
          file_name: string
          file_url: string | null
          id: string
          long_pages: number | null
          maintenance_fee: number | null
          notes: string | null
          page_size: Database["public"]["Enums"]["paper_size_type"]
          pickup_date: string | null
          pickup_time: string | null
          selected_pages: Json | null
          short_pages: number | null
          status: string
          total_pages: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          a4_pages?: number | null
          bw_pages: number
          colored_pages: number
          cost: number
          created_at?: string | null
          delivery_fee?: number | null
          delivery_type: string
          file_name: string
          file_url?: string | null
          id?: string
          long_pages?: number | null
          maintenance_fee?: number | null
          notes?: string | null
          page_size: Database["public"]["Enums"]["paper_size_type"]
          pickup_date?: string | null
          pickup_time?: string | null
          selected_pages?: Json | null
          short_pages?: number | null
          status?: string
          total_pages: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          a4_pages?: number | null
          bw_pages?: number
          colored_pages?: number
          cost?: number
          created_at?: string | null
          delivery_fee?: number | null
          delivery_type?: string
          file_name?: string
          file_url?: string | null
          id?: string
          long_pages?: number | null
          maintenance_fee?: number | null
          notes?: string | null
          page_size?: Database["public"]["Enums"]["paper_size_type"]
          pickup_date?: string | null
          pickup_time?: string | null
          selected_pages?: Json | null
          short_pages?: number | null
          status?: string
          total_pages?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "print_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          discount_percent: number | null
          id: string
          image: string | null
          images: Json | null
          is_active: boolean | null
          is_flash_sale: boolean | null
          name: string
          original_price: number | null
          price: number
          rating: number | null
          sale_price: number | null
          seller_id: string | null
          sold: number | null
          stock: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          discount_percent?: number | null
          id?: string
          image?: string | null
          images?: Json | null
          is_active?: boolean | null
          is_flash_sale?: boolean | null
          name: string
          original_price?: number | null
          price: number
          rating?: number | null
          sale_price?: number | null
          seller_id?: string | null
          sold?: number | null
          stock?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          discount_percent?: number | null
          id?: string
          image?: string | null
          images?: Json | null
          is_active?: boolean | null
          is_flash_sale?: boolean | null
          name?: string
          original_price?: number | null
          price?: number
          rating?: number | null
          sale_price?: number | null
          seller_id?: string | null
          sold?: number | null
          stock?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bcoins: number | null
          created_at: string
          email: string
          first_name: string
          grade_level: string | null
          id: string
          last_name: string
          role: string | null
          school: string | null
          section: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bcoins?: number | null
          created_at?: string
          email: string
          first_name: string
          grade_level?: string | null
          id?: string
          last_name: string
          role?: string | null
          school?: string | null
          section?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bcoins?: number | null
          created_at?: string
          email?: string
          first_name?: string
          grade_level?: string | null
          id?: string
          last_name?: string
          role?: string | null
          school?: string | null
          section?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      registration_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          used: boolean
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          used?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          used?: boolean
        }
        Relationships: []
      }
      scheduled_broadcasts: {
        Row: {
          created_at: string | null
          created_by: string | null
          icon: string | null
          id: string
          link: string | null
          message: string
          schedule_time: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          icon?: string | null
          id?: string
          link?: string | null
          message: string
          schedule_time?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          icon?: string | null
          id?: string
          link?: string | null
          message?: string
          schedule_time?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      scheduled_jobs: {
        Row: {
          created_at: string | null
          id: string
          job_name: string
          job_type: string
          last_run_at: string | null
          next_run_at: string | null
          payload: Json | null
          schedule_time: string | null
          schedule_type: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_name: string
          job_type: string
          last_run_at?: string | null
          next_run_at?: string | null
          payload?: Json | null
          schedule_time?: string | null
          schedule_type: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          job_name?: string
          job_type?: string
          last_run_at?: string | null
          next_run_at?: string | null
          payload?: Json | null
          schedule_time?: string | null
          schedule_type?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      seller_applications: {
        Row: {
          admin_notes: string | null
          business_type: string
          created_at: string | null
          experience: string | null
          full_name: string
          id: string
          products_to_sell: string
          reason: string
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          business_type: string
          created_at?: string | null
          experience?: string | null
          full_name: string
          id?: string
          products_to_sell: string
          reason: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          business_type?: string
          created_at?: string | null
          experience?: string | null
          full_name?: string
          id?: string
          products_to_sell?: string
          reason?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      seller_codes: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_used: boolean | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_used?: boolean | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_used?: boolean | null
          used_by?: string | null
        }
        Relationships: []
      }
      seller_profiles: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          location: string | null
          store_description: string | null
          store_image: string | null
          store_name: string
          store_saying: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          store_description?: string | null
          store_image?: string | null
          store_name: string
          store_saying?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          store_description?: string | null
          store_image?: string | null
          store_name?: string
          store_saying?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      support_chat_sessions: {
        Row: {
          created_at: string | null
          id: string
          report_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          report_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          report_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_chat_sessions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "support_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          sender_id: string | null
          session_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          sender_id?: string | null
          session_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          sender_id?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "support_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      support_report_files: {
        Row: {
          created_at: string | null
          file_name: string | null
          file_url: string
          id: string
          report_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_name?: string | null
          file_url: string
          id?: string
          report_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string | null
          file_url?: string
          id?: string
          report_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_report_files_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "support_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      support_reports: {
        Row: {
          created_at: string | null
          description: string
          id: string
          incident_date: string | null
          incident_type: string
          is_anonymous: boolean | null
          location: string | null
          people_involved: string | null
          reporter_contact: string | null
          reporter_name: string | null
          severity: string | null
          status: string | null
          title: string | null
          tracking_id: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          incident_date?: string | null
          incident_type: string
          is_anonymous?: boolean | null
          location?: string | null
          people_involved?: string | null
          reporter_contact?: string | null
          reporter_name?: string | null
          severity?: string | null
          status?: string | null
          title?: string | null
          tracking_id?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          incident_date?: string | null
          incident_type?: string
          is_anonymous?: boolean | null
          location?: string | null
          people_involved?: string | null
          reporter_contact?: string | null
          reporter_name?: string | null
          severity?: string | null
          status?: string | null
          title?: string | null
          tracking_id?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_atm_cards: {
        Row: {
          bcoins_wallet_id: string | null
          card_holder_name: string
          card_number: string
          created_at: string | null
          id: string
          is_active: boolean | null
          user_id: string
        }
        Insert: {
          bcoins_wallet_id?: string | null
          card_holder_name: string
          card_number: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          user_id: string
        }
        Update: {
          bcoins_wallet_id?: string | null
          card_holder_name?: string
          card_number?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      user_push_tokens: {
        Row: {
          created_at: string | null
          fcm_token: string
          id: string
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          fcm_token: string
          id?: string
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          fcm_token?: string
          id?: string
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      create_all_organization_tables_if_not_exists: {
        Args: never
        Returns: undefined
      }
      create_organization_members_table_if_not_exists: {
        Args: never
        Returns: undefined
      }
      create_organization_wallets_table_if_not_exists: {
        Args: never
        Returns: undefined
      }
      create_organizations_table_if_not_exists: {
        Args: never
        Returns: undefined
      }
      create_registration_codes_table_if_not_exists: {
        Args: never
        Returns: undefined
      }
      expire_old_jobs: { Args: never; Returns: undefined }
      get_user_role: { Args: { _user_id: string }; Returns: string }
      release_escrow: { Args: { session_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "main_admin" | "member_admin" | "guidance" | "customer"
      paper_size_type: "short" | "a4" | "long"
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
      app_role: ["main_admin", "member_admin", "guidance", "customer"],
      paper_size_type: ["short", "a4", "long"],
    },
  },
} as const
