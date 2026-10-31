import { createClient } from '@supabase/supabase-js';

export class RememberDeviceStorage {
  private isRememberEnabled(): boolean {
    try {
      if (typeof window === 'undefined') return true;
      const rememberVal = localStorage.getItem('voltacc_pos_remember_terminal_v1');
      return rememberVal !== 'false';
    } catch {
      return true;
    }
  }

  getItem(key: string): string | null {
    try {
      if (typeof window === 'undefined') return null;
      if (this.isRememberEnabled()) {
        return localStorage.getItem(key) ?? sessionStorage.getItem(key);
      }
      return sessionStorage.getItem(key) ?? localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      if (typeof window === 'undefined') return;
      if (this.isRememberEnabled()) {
        localStorage.setItem(key, value);
        sessionStorage.removeItem(key);
      } else {
        sessionStorage.setItem(key, value);
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn('[RememberDeviceStorage] setItem failed:', e);
    }
  }

  removeItem(key: string): void {
    try {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch (e) {
      console.warn('[RememberDeviceStorage] removeItem failed:', e);
    }
  }
}

export const rememberDeviceStorage = new RememberDeviceStorage();

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Faltan las variables de entorno de Supabase. Revisa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: rememberDeviceStorage,
  },
});

// En desarrollo local, exponemos supabase en window para pruebas rápidas desde la consola
if (typeof window !== 'undefined' && (import.meta as any).env?.DEV) {
  (window as any).supabase = supabase;
}
