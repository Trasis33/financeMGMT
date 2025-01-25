export interface User {
  id: number;
  email: string;
  name: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
}

export interface AuthResponse {
  user: User;
  token: string;
  data?: {
    user: User;
    token: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}
