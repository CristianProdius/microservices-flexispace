import z from "zod";

export type Role = "USER" | "HOST" | "ADMIN";

export interface User {
  id: string;
  email: string;
  username: string;
  name: string | null;
  role: Role;
  image: string | null;
  phone: string | null;
  bio: string | null;
  emailVerified: boolean;
  hostVerified: boolean;
  hostingSince: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters"),
  name: z.string().optional(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be at most 100 characters"),
});

export const UserFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be at most 100 characters"),
  role: z.enum(["USER", "HOST", "ADMIN"]).default("USER"),
});

export const BecomeHostSchema = z.object({
  bio: z.string().min(10, "Bio must be at least 10 characters"),
  phone: z.string().min(7, "Phone number is required"),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type UserFormInput = z.infer<typeof UserFormSchema>;
export type BecomeHostInput = z.infer<typeof BecomeHostSchema>;
