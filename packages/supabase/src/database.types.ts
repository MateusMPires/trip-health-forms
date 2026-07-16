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
      consents: {
        Row: {
          accepted: boolean
          accepted_at: string
          created_at: string
          deleted_at: string | null
          id: string
          ip_address: unknown
          kind: Database["public"]["Enums"]["consent_kind"]
          terms_version: string
          traveler_id: string
          trip_id: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          accepted: boolean
          accepted_at?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          ip_address?: unknown
          kind?: Database["public"]["Enums"]["consent_kind"]
          terms_version: string
          traveler_id: string
          trip_id: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          accepted?: boolean
          accepted_at?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          ip_address?: unknown
          kind?: Database["public"]["Enums"]["consent_kind"]
          terms_version?: string
          traveler_id?: string
          trip_id?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consents_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "travelers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consents_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          deleted_at: string | null
          file_name: string | null
          id: string
          kind: Database["public"]["Enums"]["document_kind"]
          mime_type: string | null
          organization_id: string
          size_bytes: number | null
          storage_bucket: string
          storage_path: string
          traveler_id: string
          trip_id: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          file_name?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["document_kind"]
          mime_type?: string | null
          organization_id: string
          size_bytes?: number | null
          storage_bucket?: string
          storage_path: string
          traveler_id: string
          trip_id: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          file_name?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["document_kind"]
          mime_type?: string | null
          organization_id?: string
          size_bytes?: number | null
          storage_bucket?: string
          storage_path?: string
          traveler_id?: string
          trip_id?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "travelers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guardians: {
        Row: {
          created_at: string
          deleted_at: string | null
          document: string | null
          email: string | null
          full_name: string
          id: string
          phone: string | null
          phone_secondary: string | null
          relationship: string | null
          traveler_id: string
          trip_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          document?: string | null
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
          phone_secondary?: string | null
          relationship?: string | null
          traveler_id: string
          trip_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          document?: string | null
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          phone_secondary?: string | null
          relationship?: string | null
          traveler_id?: string
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardians_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "travelers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardians_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      health_records: {
        Row: {
          allergies: string | null
          blood_type: string | null
          created_at: string
          data: Json
          deleted_at: string | null
          dietary_restrictions: string | null
          has_allergies: boolean | null
          has_dietary_restriction: boolean | null
          has_health_insurance: boolean | null
          has_medical_conditions: boolean | null
          has_physical_limitation: boolean | null
          health_insurance: string | null
          id: string
          medical_conditions: string | null
          medications: string | null
          needs_medication_on_trip: boolean | null
          notes: string | null
          physical_limitation_description: string | null
          traveler_id: string
          trip_id: string
          updated_at: string
          uses_continuous_medication: boolean | null
        }
        Insert: {
          allergies?: string | null
          blood_type?: string | null
          created_at?: string
          data?: Json
          deleted_at?: string | null
          dietary_restrictions?: string | null
          has_allergies?: boolean | null
          has_dietary_restriction?: boolean | null
          has_health_insurance?: boolean | null
          has_medical_conditions?: boolean | null
          has_physical_limitation?: boolean | null
          health_insurance?: string | null
          id?: string
          medical_conditions?: string | null
          medications?: string | null
          needs_medication_on_trip?: boolean | null
          notes?: string | null
          physical_limitation_description?: string | null
          traveler_id: string
          trip_id: string
          updated_at?: string
          uses_continuous_medication?: boolean | null
        }
        Update: {
          allergies?: string | null
          blood_type?: string | null
          created_at?: string
          data?: Json
          deleted_at?: string | null
          dietary_restrictions?: string | null
          has_allergies?: boolean | null
          has_dietary_restriction?: boolean | null
          has_health_insurance?: boolean | null
          has_medical_conditions?: boolean | null
          has_physical_limitation?: boolean | null
          health_insurance?: string | null
          id?: string
          medical_conditions?: string | null
          medications?: string | null
          needs_medication_on_trip?: boolean | null
          notes?: string | null
          physical_limitation_description?: string | null
          traveler_id?: string
          trip_id?: string
          updated_at?: string
          uses_continuous_medication?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "health_records_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "travelers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_records_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      travelers: {
        Row: {
          birth_date: string | null
          created_at: string
          deleted_at: string | null
          document: string | null
          email: string | null
          full_name: string
          id: string
          notes: string | null
          organization_id: string
          phone: string | null
          sex: Database["public"]["Enums"]["traveler_sex"] | null
          submitted_via: string | null
          trip_id: string
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          deleted_at?: string | null
          document?: string | null
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          sex?: Database["public"]["Enums"]["traveler_sex"] | null
          submitted_via?: string | null
          trip_id: string
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          deleted_at?: string | null
          document?: string | null
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          sex?: Database["public"]["Enums"]["traveler_sex"] | null
          submitted_via?: string | null
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "travelers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travelers_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_members: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["member_role"]
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["member_role"]
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["member_role"]
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_members_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          access_code: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          ends_at: string | null
          id: string
          name: string
          organization_id: string
          starts_at: string | null
          status: Database["public"]["Enums"]["trip_status"]
          updated_at: string
        }
        Insert: {
          access_code?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          ends_at?: string | null
          id?: string
          name: string
          organization_id: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["trip_status"]
          updated_at?: string
        }
        Update: {
          access_code?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          ends_at?: string | null
          id?: string
          name?: string
          organization_id?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["trip_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_trip_access_code: { Args: never; Returns: string }
      get_trip_public: { Args: { p_code: string }; Returns: string }
      is_org_member: { Args: { p_organization_id: string }; Returns: boolean }
      is_trip_admin: { Args: { p_trip_id: string }; Returns: boolean }
      is_trip_member: { Args: { p_trip_id: string }; Returns: boolean }
      join_trip: {
        Args: { p_code: string }
        Returns: {
          created_at: string
          deleted_at: string | null
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["member_role"]
          trip_id: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "trip_members"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      shares_trip_with_current_user: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      submit_traveler: {
        Args: { p_code: string; p_payload: Json }
        Returns: string
      }
    }
    Enums: {
      consent_kind:
        | "lgpd_terms"
        | "medical_care"
        | "medication_administration"
        | "self_medication"
      document_kind:
        | "identity_document"
        | "authorization"
        | "photo"
        | "commitment_term"
        | "national_travel_authorization"
        | "other"
      member_role: "collaborator" | "administrator"
      traveler_sex: "male" | "female" | "other" | "prefer_not_say"
      trip_status: "draft" | "active" | "archived"
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
      consent_kind: [
        "lgpd_terms",
        "medical_care",
        "medication_administration",
        "self_medication",
      ],
      document_kind: [
        "identity_document",
        "authorization",
        "photo",
        "commitment_term",
        "national_travel_authorization",
        "other",
      ],
      member_role: ["collaborator", "administrator"],
      traveler_sex: ["male", "female", "other", "prefer_not_say"],
      trip_status: ["draft", "active", "archived"],
    },
  },
} as const
