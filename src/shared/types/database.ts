// Supabase CLI로 자동 생성 가능:
// npx supabase gen types typescript --project-id <your-project-id> > src/shared/types/database.ts

export type ActivityTypeEnum =
  | 'electricity'
  | 'fuel'
  | 'raw_material'
  | 'transport'
  | 'waste';

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          country: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          country?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          country?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      emission_factors: {
        Row: {
          id: string;
          category: string;
          name: string;
          activity_type: ActivityTypeEnum;
          factor: number;
          unit: string;
          scope: number;
          valid_from: string;
          valid_to: string | null;
          source: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          category: string;
          name: string;
          activity_type: ActivityTypeEnum;
          factor: number;
          unit: string;
          scope: number;
          valid_from: string;
          valid_to?: string | null;
          source?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          category?: string;
          name?: string;
          activity_type?: ActivityTypeEnum;
          factor?: number;
          unit?: string;
          scope?: number;
          valid_from?: string;
          valid_to?: string | null;
          source?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      activities: {
        Row: {
          id: string;
          company_id: string;
          date: string;
          year_month: string;
          type: ActivityTypeEnum;
          description: string;
          factor_category: string;
          quantity: number;
          unit: string;
          scope: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          date: string;
          type: ActivityTypeEnum;
          description: string;
          factor_category: string;
          quantity: number;
          unit: string;
          scope: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          date?: string;
          type?: ActivityTypeEnum;
          description?: string;
          factor_category?: string;
          quantity?: number;
          unit?: string;
          scope?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          title: string;
          resource_uid: string;
          date_time: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          resource_uid: string;
          date_time: string;
          content?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          resource_uid?: string;
          date_time?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      emission_results: {
        Row: {
          id: string;
          activity_id: string;
          factor_id: string;
          company_id: string;
          year_month: string;
          quantity: number;
          factor: number;
          emission_kg_co2e: number;
          scope: number;
          calculated_at: string;
        };
        Insert: {
          id?: string;
          activity_id: string;
          factor_id: string;
          company_id: string;
          year_month: string;
          quantity: number;
          factor: number;
          emission_kg_co2e: number;
          scope: number;
          calculated_at?: string;
        };
        Update: {
          id?: string;
          activity_id?: string;
          factor_id?: string;
          company_id?: string;
          year_month?: string;
          quantity?: number;
          factor?: number;
          emission_kg_co2e?: number;
          scope?: number;
          calculated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_activity_with_emission: {
        Args: {
          p_company_id: string;
          p_date: string;
          p_type: ActivityTypeEnum;
          p_description: string;
          p_factor_category: string;
          p_quantity: number;
          p_unit: string;
        };
        Returns: {
          id: string;
          company_id: string;
          date: string;
          year_month: string;
          type: ActivityTypeEnum;
          description: string;
          factor_category: string;
          quantity: number;
          unit: string;
          scope: number;
          created_at: string;
        };
      };
    };
    Enums: {
      activity_type_enum: ActivityTypeEnum;
    };
    CompositeTypes: Record<string, never>;
  };
};
