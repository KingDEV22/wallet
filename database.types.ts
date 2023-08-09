export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];

export interface Database {
  public: {
    Tables: {
      tokens: {
        Row: {
          created_at: string;
          id: number;
          token: string | null;
        };
        Insert: {
          created_at?: string;
          id?: number;
          token?: string | null;
        };
        Update: {
          created_at?: string;
          id?: number;
          token?: string | null;
        };
        Relationships: [];
      };
      transaction: {
        Row: {
          asset: string | null;
          blockNum: string | null;
          category: string | null;
          date: string | null;
          hash: string | null;
          receiver: string | null;
          sender: string | null;
          uniqueId: string;
          value: number | null;
        };
        Insert: {
          asset?: string | null;
          blockNum?: string | null;
          category?: string | null;
          date?: string | null;
          hash?: string | null;
          receiver?: string | null;
          sender?: string | null;
          uniqueId: string;
          value?: number | null;
        };
        Update: {
          asset?: string | null;
          blockNum?: string | null;
          category?: string | null;
          date?: string | null;
          hash?: string | null;
          receiver?: string | null;
          sender?: string | null;
          uniqueId?: string;
          value?: number | null;
        };
        Relationships: [];
      };
      user_details: {
        Row: {
          email: string | null;
          fname: string | null;
          id: number;
          lname: string | null;
          password: string | null;
        };
        Insert: {
          email?: string | null;
          fname?: string | null;
          id?: number;
          lname?: string | null;
          password?: string | null;
        };
        Update: {
          email?: string | null;
          fname?: string | null;
          id?: number;
          lname?: string | null;
          password?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
