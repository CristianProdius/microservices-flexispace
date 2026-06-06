"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, UnauthenticatedError } from "@/lib/apiFetch";
import { toast } from "react-toastify";

export interface CreatedHost {
  id: string;
  name: string | null;
  username: string;
  email: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (host: CreatedHost) => void;
}

export function CreateLeadHostModal({ open, onOpenChange, onCreated }: Props) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName("");
    setUsername("");
    setEmail("");
    setBio("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiFetch(
        `${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/users/hosts/lead`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            username: username.trim().toLowerCase(),
            email: email.trim() || undefined,
            bio: bio.trim() || undefined,
          }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg =
          data && typeof data === "object" && "message" in data
            ? String((data as { message: unknown }).message)
            : "Failed to create lead host";
        toast.error(msg);
        return;
      }
      const host: CreatedHost = await res.json();
      onCreated(host);
      toast.success("Lead host created");
      reset();
      onOpenChange(false);
    } catch (err) {
      if (err instanceof UnauthenticatedError) {
        toast.error("Session expired");
        return;
      }
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Create lead host</SheetTitle>
          <SheetDescription>
            Creates a HOST account with a random password. The lead cannot log
            in until you send them an invite.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="flex flex-col flex-1">
          <div className="flex-1 space-y-4 px-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="lh-name">Name *</Label>
              <Input
                id="lh-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={80}
                placeholder="Jane Smith"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lh-username">Username *</Label>
              <Input
                id="lh-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                pattern="^[a-z0-9_-]+$"
                minLength={3}
                maxLength={32}
                placeholder="janesmith"
              />
              <p className="text-xs text-muted-foreground">
                Lowercase letters, digits, underscores, dashes.
              </p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="lh-email">Email (optional)</Label>
              <Input
                id="lh-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hosts+username@spacefly.ai"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lh-bio">Bio (optional)</Label>
              <Textarea
                id="lh-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={500}
                placeholder="Brief description…"
              />
            </div>
          </div>
          <SheetFooter className="flex-row justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating…" : "Create"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
