"use client";

import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "./ui/button";
import useAuthStore from "@/stores/authStore";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";

const ROLE_VALUES = ["USER", "HOST", "ADMIN"] as const;

const EditUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50),
  email: z.string().email("Invalid email address"),
  role: z.enum(ROLE_VALUES),
});

type EditUserFormData = z.infer<typeof EditUserSchema>;

export interface EditUserTarget {
  id: string;
  email: string;
  username: string;
  name: string | null;
  role: string;
}

interface EditUserProps {
  user: EditUserTarget;
  onUpdated?: () => void;
}

const normalizeRole = (role: string): (typeof ROLE_VALUES)[number] => {
  return (ROLE_VALUES as readonly string[]).includes(role)
    ? (role as (typeof ROLE_VALUES)[number])
    : "USER";
};

const EditUser = ({ user, onUpdated }: EditUserProps) => {
  const form = useForm<EditUserFormData>({
    resolver: zodResolver(EditUserSchema),
    defaultValues: {
      name: user.name ?? "",
      username: user.username ?? "",
      email: user.email ?? "",
      role: normalizeRole(user.role),
    },
  });

  const { getToken } = useAuthStore();

  const mutation = useMutation({
    mutationFn: async (data: EditUserFormData) => {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/users/${user.id}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        let message = "Failed to update user";
        try {
          const error = await res.json();
          message = error.message || message;
        } catch {
          // swallow JSON parse errors and keep default message
        }
        throw new Error(message);
      }
    },
    onSuccess: () => {
      toast.success("User updated successfully");
      onUpdated?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <SheetContent>
      <SheetHeader>
        <SheetTitle className="mb-4">Edit User</SheetTitle>
        <SheetDescription asChild>
          <Form {...form}>
            <form
              className="space-y-8"
              onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>Enter user full name.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>Public handle.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormDescription>
                      Only admin can see user email.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USER">User</SelectItem>
                          <SelectItem value="HOST">Host</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    {field.value === "ADMIN" ? (
                      <FormDescription className="text-destructive">
                        Warning: Admins have full system access.
                      </FormDescription>
                    ) : (
                      <FormDescription>
                        Determines what this user can do in the platform.
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {mutation.isPending ? "Saving..." : "Save changes"}
              </Button>
            </form>
          </Form>
        </SheetDescription>
      </SheetHeader>
    </SheetContent>
  );
};

export default EditUser;
