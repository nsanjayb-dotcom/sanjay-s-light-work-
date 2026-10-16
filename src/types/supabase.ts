/**
 * Supabase Database Type Definitions
 * Auto-compatible with Supabase CLI generated types for PostgreSQL schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          phone: string | null;
          role: 'client' | 'admin';
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name: string;
          phone?: string | null;
          role?: 'client' | 'admin';
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          phone?: string | null;
          role?: 'client' | 'admin';
          created_at?: string;
        };
        Relationships: [];
      };
      service_packages: {
        Row: {
          id: string;
          slug: string | null;
          title: string;
          description: string | null;
          price_cad: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug?: string | null;
          title: string;
          description?: string | null;
          price_cad: number;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string | null;
          title?: string;
          description?: string | null;
          price_cad?: number;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          user_id: string;
          package_id: string;
          booking_date: string;
          time_slot: string;
          status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
          location: string | null;
          notes: string | null;
          total_price: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          package_id: string;
          booking_date: string;
          time_slot: string;
          status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
          location?: string | null;
          notes?: string | null;
          total_price?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          package_id?: string;
          booking_date?: string;
          time_slot?: string;
          status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
          location?: string | null;
          notes?: string | null;
          total_price?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bookings_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_package_id_fkey';
            columns: ['package_id'];
            referencedRelation: 'service_packages';
            referencedColumns: ['id'];
          }
        ];
      };
      reviews: {
        Row: {
          id: string;
          user_id: string | null;
          rating: number;
          comment: string;
          verified: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          rating: number;
          comment: string;
          verified?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          rating?: number;
          comment?: string;
          verified?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reviews_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_booking_atomic: {
        Args: {
          p_full_name: string;
          p_email: string;
          p_phone?: string | null;
          p_package_id: string;
          p_booking_date: string;
          p_time_slot: string;
          p_location?: string | null;
          p_notes?: string | null;
          p_total_price?: number | null;
        };
        Returns: {
          success: boolean;
          booking_id: string;
          user_id: string;
          booking_date: string;
          time_slot: string;
          status: string;
          message?: string;
        };
      };
      check_booking_availability: {
        Args: {
          p_booking_date: string;
          p_time_slot: string;
        };
        Returns: {
          available: boolean;
          booking_date: string;
          time_slot: string;
          message?: string;
          error?: string;
        };
      };
      get_booked_time_slots: {
        Args: {
          p_booking_date: string;
        };
        Returns: string[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

export type DbUser = Database['public']['Tables']['users']['Row'];
export type DbServicePackage = Database['public']['Tables']['service_packages']['Row'];
export type DbBooking = Database['public']['Tables']['bookings']['Row'];
export type DbReview = Database['public']['Tables']['reviews']['Row'];

export interface BookingWithDetails extends DbBooking {
  user?: DbUser | null;
  service_package?: DbServicePackage | null;
}

export interface ReviewWithAuthor extends DbReview {
  user?: DbUser | null;
}
