// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
  console.error('REACT_APP_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('REACT_APP_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
  
  throw new Error(
    'Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in your .env file'
  );
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    flowType: 'pkce',
    //debug: process.env.NODE_ENV === 'development'
  },
  global: {
    headers: {
      'X-Client-Info': 'tool-index-web'
    }
  },
  db: {
    schema: 'public'
  }
});

// Test connection on startup
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('report_tools').select('count').limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Supabase connection error:', error);
    return false;
  }
};

// Initialize connection test on import
//if (process.env.NODE_ENV === 'development') {
//  testSupabaseConnection();
//}

// Helper functions for common operations

// Auth helpers
export const auth = {
  // Sign up with email and password
  signUp: async (email, password, userMetadata = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userMetadata,
          emailRedirectTo: `${window.location.origin}/login`
        }
      });
      
      return { data, error };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    }
  },
  
  // Sign in with email and password
  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      return { data, error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    }
  },
  
  // Sign out
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  },
  
  // Get current session
  getSession: async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      return { data, error };
    } catch (error) {
      console.error('Get session error:', error);
      return { data: null, error };
    }
  },
  
  // Get current user
  getUser: async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      return { data, error };
    } catch (error) {
      console.error('Get user error:', error);
      return { data: null, error };
    }
  },
  
  // Update user profile
  updateProfile: async (updates) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates
      });
      return { data, error };
    } catch (error) {
      console.error('Update profile error:', error);
      return { data: null, error };
    }
  },
  
  // Reset password
  resetPassword: async (email) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      return { data, error };
    } catch (error) {
      console.error('Reset password error:', error);
      return { data: null, error };
    }
  },
  
  // Update password
  updatePassword: async (newPassword) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });
      return { data, error };
    } catch (error) {
      console.error('Update password error:', error);
      return { data: null, error };
    }
  }
};

// Database helpers
export const db = {
  // Fetch all tools with optional filtering
  fetchTools: async (options = {}) => {
    try {
      let query = supabase
        .from('report_tools')
        .select(`
          *,
          report_tool_images(*)
        `);
      
      // Apply filters
      if (options.userId) {
        query = query.eq('user_id', options.userId);
      }
      
      if (options.email) {
        query = query.eq('email', options.email);
      }
      
      if (options.status) {
        query = query.eq('status', options.status);
      }
      
      // Apply sorting
      if (options.sortBy) {
        const { field, order = 'desc' } = options.sortBy;
        query = query.order(field, { ascending: order === 'asc' });
      } else {
        query = query.order('created_at', { ascending: false });
      }
      
      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      const { data, error } = await query;
      return { data, error };
    } catch (error) {
      console.error('Fetch tools error:', error);
      return { data: null, error };
    }
  },
  
  // Fetch single tool by ID
  fetchToolById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('report_tools')
        .select(`
          *,
          report_tool_images(*)
        `)
        .eq('id', id)
        .single();
      
      return { data, error };
    } catch (error) {
      console.error('Fetch tool by ID error:', error);
      return { data: null, error };
    }
  },
  
  // Create new tool
  createTool: async (toolData) => {
    try {
      const { data, error } = await supabase
        .from('report_tools')
        .insert([toolData])
        .select()
        .single();
      
      return { data, error };
    } catch (error) {
      console.error('Create tool error:', error);
      return { data: null, error };
    }
  },
  
  // Update tool
  updateTool: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('report_tools')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      return { data, error };
    } catch (error) {
      console.error('Update tool error:', error);
      return { data: null, error };
    }
  },
  
  // Delete tool
  deleteTool: async (id) => {
    try {
      const { error } = await supabase
        .from('report_tools')
        .delete()
        .eq('id', id);
      
      return { error };
    } catch (error) {
      console.error('Delete tool error:', error);
      return { error };
    }
  },
  
  // Upload tool image
  uploadToolImage: async (toolId, file, isPrimary = false) => {
    try {
      const fileName = `${toolId}_${Date.now()}_${file.name}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('tools')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('tools')
        .getPublicUrl(fileName);
      
      // Create database record
      const { data, error } = await supabase
        .from('report_tool_images')
        .insert({
          report_tool_id: toolId,
          image_url: publicUrl,
          file_name: fileName,
          is_primary: isPrimary
        })
        .select()
        .single();
      
      return { data, error };
    } catch (error) {
      console.error('Upload tool image error:', error);
      return { data: null, error };
    }
  },
  
  // Delete tool image
  deleteToolImage: async (imageId) => {
    try {
      // First get the image record to get file name
      const { data: image, error: fetchError } = await supabase
        .from('report_tool_images')
        .select('*')
        .eq('id', imageId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Delete from storage
      await supabase.storage
        .from('tools')
        .remove([image.file_name]);
      
      // Delete from database
      const { error } = await supabase
        .from('report_tool_images')
        .delete()
        .eq('id', imageId);
      
      return { error };
    } catch (error) {
      console.error('Delete tool image error:', error);
      return { error };
    }
  },
  
  // Fetch user stats
  fetchUserStats: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('report_tools')
        .select('status')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      const totalTools = data.length;
      const stolenTools = data.filter(tool => tool.status === 'stolen').length;
      const recoveredTools = data.filter(tool => tool.status === 'recovered').length;
      
      return {
        data: { totalTools, stolenTools, recoveredTools },
        error: null
      };
    } catch (error) {
      console.error('Fetch user stats error:', error);
      return { data: null, error };
    }
  }
};

// Storage helpers
export const storage = {
  // Upload file
  uploadFile: async (bucket, file, path = '', options = {}) => {
    try {
      const fileName = path || `${Date.now()}_${file.name}`;
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: options.upsert || false,
          ...options
        });
      
      return { data, error };
    } catch (error) {
      console.error('Upload file error:', error);
      return { data: null, error };
    }
  },
  
  // Get public URL
  getPublicUrl: (bucket, path) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  },
  
  // Delete file
  deleteFile: async (bucket, paths) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .remove(paths);
      
      return { data, error };
    } catch (error) {
      console.error('Delete file error:', error);
      return { data: null, error };
    }
  },
  
  // List files in bucket
  listFiles: async (bucket, path = '', options = {}) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path, options);
      
      return { data, error };
    } catch (error) {
      console.error('List files error:', error);
      return { data: null, error };
    }
  }
};

// Realtime subscriptions
export const realtime = {
  // Subscribe to tools changes
  subscribeToTools: (callback, filters = {}) => {
    const subscription = supabase
      .channel('tools-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'report_tools',
          ...filters
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();
    
    return subscription;
  },
  
  // Subscribe to user's tools
  subscribeToUserTools: (userId, callback) => {
    return realtime.subscribeToTools(callback, {
      filter: `user_id=eq.${userId}`
    });
  },
  
  // Unsubscribe from channel
  unsubscribe: (subscription) => {
    supabase.removeChannel(subscription);
  }
};

// Error handling utilities
export const handleSupabaseError = (error) => {
  console.error('Supabase Error:', error);
  
  // Common error messages for user display
  const errorMessages = {
    'Invalid login credentials': 'Invalid email or password',
    'Email not confirmed': 'Please verify your email address',
    'User already registered': 'An account with this email already exists',
    'Password should be at least 6 characters': 'Password must be at least 6 characters',
    'Failed to fetch': 'Network error. Please check your connection',
    'JWT expired': 'Your session has expired. Please log in again',
    'jwt must be provided': 'Authentication error. Please log in again'
  };
  
  // Return user-friendly message
  return errorMessages[error.message] || error.message || 'An error occurred';
};

// Session utilities
export const session = {
  // Check if user is authenticated
  isAuthenticated: async () => {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  },
  
  // Get current user metadata
  getUserMetadata: async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.user_metadata || null;
  },
  
  // Get user ID
  getUserId: async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id || null;
  },
  
  // Refresh session
  refreshSession: async () => {
    const { data } = await supabase.auth.refreshSession();
    return data;
  }
};

export default supabase;