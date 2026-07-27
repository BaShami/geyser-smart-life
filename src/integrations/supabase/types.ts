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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          country: string | null
          created_at: string
          event_name: string
          funnel_step: string | null
          id: string
          lead_id: string | null
          metadata: Json | null
          referrer: string | null
          selected_device: string | null
          session_id: string
          utm: Json | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          event_name: string
          funnel_step?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          referrer?: string | null
          selected_device?: string | null
          session_id: string
          utm?: Json | null
        }
        Update: {
          country?: string | null
          created_at?: string
          event_name?: string
          funnel_step?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          referrer?: string | null
          selected_device?: string | null
          session_id?: string
          utm?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          city: string | null
          country: string | null
          current_step: string | null
          device_interests: string[]
          email: string | null
          first_seen_at: string
          first_utm: Json | null
          has_wifi: boolean | null
          id: string
          last_completed_step: string | null
          last_seen_at: string
          latest_utm: Json | null
          lead_status: string
          name: string | null
          notified_at: string | null
          owns_or_rents: string | null
          phone: string | null
          referrer: string | null
          session_id: string
          transcript: Json
        }
        Insert: {
          city?: string | null
          country?: string | null
          current_step?: string | null
          device_interests?: string[]
          email?: string | null
          first_seen_at?: string
          first_utm?: Json | null
          has_wifi?: boolean | null
          id?: string
          last_completed_step?: string | null
          last_seen_at?: string
          latest_utm?: Json | null
          lead_status?: string
          name?: string | null
          notified_at?: string | null
          owns_or_rents?: string | null
          phone?: string | null
          referrer?: string | null
          session_id: string
          transcript?: Json
        }
        Update: {
          city?: string | null
          country?: string | null
          current_step?: string | null
          device_interests?: string[]
          email?: string | null
          first_seen_at?: string
          first_utm?: Json | null
          has_wifi?: boolean | null
          id?: string
          last_completed_step?: string | null
          last_seen_at?: string
          latest_utm?: Json | null
          lead_status?: string
          name?: string | null
          notified_at?: string | null
          owns_or_rents?: string | null
          phone?: string | null
          referrer?: string | null
          session_id?: string
          transcript?: Json
        }
        Relationships: []
      }
      qualify_leads: {
        Row: {
          city: string | null
          contact: string | null
          created_at: string
          has_geyser: boolean | null
          has_wifi: boolean | null
          id: string
          is_renter: boolean | null
          name: string | null
          notes: string | null
          transcript: Json
        }
        Insert: {
          city?: string | null
          contact?: string | null
          created_at?: string
          has_geyser?: boolean | null
          has_wifi?: boolean | null
          id?: string
          is_renter?: boolean | null
          name?: string | null
          notes?: string | null
          transcript?: Json
        }
        Update: {
          city?: string | null
          contact?: string | null
          created_at?: string
          has_geyser?: boolean | null
          has_wifi?: boolean | null
          id?: string
          is_renter?: boolean | null
          name?: string | null
          notes?: string | null
          transcript?: Json
        }
        Relationships: []
      }
      qualify_waitlist: {
        Row: {
          city: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          reason: string | null
          transcript: Json
        }
        Insert: {
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          reason?: string | null
          transcript?: Json
        }
        Update: {
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          reason?: string | null
          transcript?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
