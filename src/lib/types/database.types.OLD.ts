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
      animes: {
        Row: {
          cover_image_url: string | null
          created_at: string
          episode_count: number | null
          genres: string[]
          id: string
          mal_id: number | null
          season_count: number
          synopsis: string | null
          title_en: string
          title_he: string
          title_romaji: string | null
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          episode_count?: number | null
          genres?: string[]
          id?: string
          mal_id?: number | null
          season_count?: number
          synopsis?: string | null
          title_en: string
          title_he: string
          title_romaji?: string | null
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          episode_count?: number | null
          genres?: string[]
          id?: string
          mal_id?: number | null
          season_count?: number
          synopsis?: string | null
          title_en?: string
          title_he?: string
          title_romaji?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          id: string
          fansub_id: string
          anime_id: string | null
          title: string
          content: string
          type: Database["public"]["Enums"]["announcement_type"]
          is_published: boolean
          created_at: string
        }
        Insert: {
          id?: string
          fansub_id: string
          anime_id?: string | null
          title: string
          content: string
          type?: Database["public"]["Enums"]["announcement_type"]
          is_published?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          fansub_id?: string
          anime_id?: string | null
          title?: string
          content?: string
          type?: Database["public"]["Enums"]["announcement_type"]
          is_published?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_fansub_id_fkey"
            columns: ["fansub_id"]
            isOneToOne: false
            referencedRelation: "fansub_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_anime_id_fkey"
            columns: ["anime_id"]
            isOneToOne: false
            referencedRelation: "animes"
            referencedColumns: ["id"]
          },
        ]
      }
      episode_progress: {
        Row: {
          id: string
          translation_id: string
          total_episodes: number | null
          translated_episodes: number
          last_episode_at: string | null
        }
        Insert: {
          id?: string
          translation_id: string
          total_episodes?: number | null
          translated_episodes?: number
          last_episode_at?: string | null
        }
        Update: {
          id?: string
          translation_id?: string
          total_episodes?: number | null
          translated_episodes?: number
          last_episode_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "episode_progress_translation_id_fkey"
            columns: ["translation_id"]
            isOneToOne: true
            referencedRelation: "translations"
            referencedColumns: ["id"]
          },
        ]
      }
      fansub_applications: {
        Row: {
          id: string
          submitted_by: string | null
          form_data: Record<string, unknown>
          status: Database["public"]["Enums"]["fansub_status"]
          admin_notes: string | null
          created_at: string
          reviewed_at: string | null
          reviewed_by: string | null
        }
        Insert: {
          id?: string
          submitted_by?: string | null
          form_data: Record<string, unknown>
          status?: Database["public"]["Enums"]["fansub_status"]
          admin_notes?: string | null
          created_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Update: {
          id?: string
          submitted_by?: string | null
          form_data?: Record<string, unknown>
          status?: Database["public"]["Enums"]["fansub_status"]
          admin_notes?: string | null
          created_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Relationships: []
      }
      fansub_groups: {
        Row: {
          created_at: string
          description: string | null
          discord_url: string | null
          founded_at: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          manager_uid: string | null
          name: string
          rating_count: number
          rating_total: number
          status: Database["public"]["Enums"]["fansub_status"]
          telegram_url: string | null
          website_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          discord_url?: string | null
          founded_at?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          manager_uid?: string | null
          name: string
          rating_count?: number
          rating_total?: number
          status?: Database["public"]["Enums"]["fansub_status"]
          telegram_url?: string | null
          website_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          discord_url?: string | null
          founded_at?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          manager_uid?: string | null
          name?: string
          rating_count?: number
          rating_total?: number
          status?: Database["public"]["Enums"]["fansub_status"]
          telegram_url?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      form_fields: {
        Row: {
          id: string
          form_name: string
          field_key: string
          field_label_he: string
          field_label_en: string
          field_type: string
          is_required: boolean
          sort_order: number
          is_active: boolean
          options: Record<string, unknown> | null
          placeholder_he: string | null
        }
        Insert: {
          id?: string
          form_name: string
          field_key: string
          field_label_he: string
          field_label_en: string
          field_type: string
          is_required?: boolean
          sort_order?: number
          is_active?: boolean
          options?: Record<string, unknown> | null
          placeholder_he?: string | null
        }
        Update: {
          id?: string
          form_name?: string
          field_key?: string
          field_label_he?: string
          field_label_en?: string
          field_type?: string
          is_required?: boolean
          sort_order?: number
          is_active?: boolean
          options?: Record<string, unknown> | null
          placeholder_he?: string | null
        }
        Relationships: []
      }
      ratings: {
        Row: {
          id: string
          fansub_id: string
          user_id: string
          score: number
          review: string | null
          created_at: string
        }
        Insert: {
          id?: string
          fansub_id: string
          user_id: string
          score: number
          review?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          fansub_id?: string
          user_id?: string
          score?: number
          review?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_fansub_id_fkey"
            columns: ["fansub_id"]
            isOneToOne: false
            referencedRelation: "fansub_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          display_name: string | null
          id: string
          role: string
        }
        Insert: {
          display_name?: string | null
          id: string
          role?: string
        }
        Update: {
          display_name?: string | null
          id?: string
          role?: string
        }
        Relationships: []
      }
      search_analytics: {
        Row: {
          last_searched: string
          query_string: string
          resolved: boolean
          search_count: number
        }
        Insert: {
          last_searched?: string
          query_string: string
          resolved?: boolean
          search_count?: number
        }
        Update: {
          last_searched?: string
          query_string?: string
          resolved?: boolean
          search_count?: number
        }
        Relationships: []
      }
      translations: {
        Row: {
          anime_id: string
          direct_link: string
          fansub_id: string
          id: string
          notes: string | null
          platform: Database["public"]["Enums"]["translation_platform"]
          status: Database["public"]["Enums"]["translation_status"]
          updated_at: string
        }
        Insert: {
          anime_id: string
          direct_link: string
          fansub_id: string
          id?: string
          notes?: string | null
          platform: Database["public"]["Enums"]["translation_platform"]
          status: Database["public"]["Enums"]["translation_status"]
          updated_at?: string
        }
        Update: {
          anime_id?: string
          direct_link?: string
          fansub_id?: string
          id?: string
          notes?: string | null
          platform?: Database["public"]["Enums"]["translation_platform"]
          status?: Database["public"]["Enums"]["translation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "translations_anime_id_fkey"
            columns: ["anime_id"]
            isOneToOne: false
            referencedRelation: "animes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "translations_fansub_id_fkey"
            columns: ["fansub_id"]
            isOneToOne: false
            referencedRelation: "fansub_groups"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_all_genres: {
        Args: Record<PropertyKey, never>
        Returns: {
          genre: string
        }[]
      }
      get_random_anime: {
        Args: never
        Returns: {
          id: string
          title_en: string
          title_he: string
        }[]
      }
      get_random_anime_filtered: {
        Args: {
          p_genres?: string[] | null
          p_min_ep?: number | null
          p_max_ep?: number | null
          p_min_season?: number | null
          p_max_season?: number | null
        }
        Returns: {
          id: string
          title_he: string
          title_en: string
        }[]
      }
      get_site_stats: {
        Args: never
        Returns: {
          total_animes: number
          total_fansub_groups: number
          total_translations: number
        }[]
      }
      increment_search_count: { Args: { p_query: string }; Returns: undefined }
      get_similar_searches: {
        Args: { p_query: string; p_threshold?: number }
        Returns: {
          query_string: string
          search_count: number
          last_searched: string
          resolved: boolean
          similarity_score: number
        }[]
      }
      search_animes: {
        Args: { search_query: string }
        Returns: {
          cover_image_url: string
          genres: string[]
          id: string
          similarity_score: number
          title_en: string
          title_he: string
          title_romaji: string
        }[]
      }
      search_fansubs: {
        Args: { search_query: string }
        Returns: {
          id: string
          name: string
          logo_url: string | null
          description: string | null
          translation_count: number
          similarity_score: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      announcement_type: "episode_release" | "new_project" | "completed" | "general"
      fansub_status: "pending" | "approved" | "rejected"
      translation_platform: "website" | "telegram" | "discord" | "youtube"
      translation_status: "ongoing" | "completed" | "dropped"
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
      announcement_type: ["episode_release", "new_project", "completed", "general"],
      fansub_status: ["pending", "approved", "rejected"],
      translation_platform: ["website", "telegram", "discord", "youtube"],
      translation_status: ["ongoing", "completed", "dropped"],
    },
  },
} as const
