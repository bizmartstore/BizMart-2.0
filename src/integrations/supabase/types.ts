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
        };
        Insert: {
          user_id: string;
          status?: string;
          bio?: string | null;
          subjects?: string[] | null;
          experience?: string | null;
          academic_strengths?: string | null;
        };
        Update: {
          status?: string;
          bio?: string | null;
          subjects?: string[] | null;
          rating?: number;
          completed_sessions?: number;
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