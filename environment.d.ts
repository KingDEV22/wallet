export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT?: number; // 👈️ mark optional
      DB_USER: string;
      SUPABASE_KEY: string;
      TOKEN_SECRET: string;
      ACESS_KEY: string;
      ACCOUNT_ADDRESS: string;
      SERVICE_KEY: string;
      ENV: "test" | "dev" | "prod";
    }
  }
}
