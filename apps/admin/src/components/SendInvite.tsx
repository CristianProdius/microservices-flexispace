"use client";

import { useState } from "react";
import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { inviteUser } from "@/lib/invites";
import { toast } from "react-toastify";

interface SendInviteProps {
  userId: string;
  email: string;
}

const SendInvite = ({ userId, email }: SendInviteProps) => {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    setLoading(true);
    try {
      const { inviteUrl: url } = await inviteUser(userId);
      setInviteUrl(url);
      toast.success("Invite emailed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send invite");
    } finally {
      setLoading(false);
    }
  };

  const copy = async (label: string, value: string) => {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Couldn't copy ${label} — copy it manually`);
    }
  };

  return (
    <SheetContent>
      <SheetHeader>
        <SheetTitle className="mb-4">Send invite</SheetTitle>
        <SheetDescription asChild>
          <div className="space-y-6 text-left">
            <p className="text-sm text-muted-foreground">
              Emails {email} a one-time magic link to set their password and sign in.
              Re-sending invalidates any earlier link.
            </p>
            <Button onClick={send} disabled={loading}>
              {loading ? "Sending…" : inviteUrl ? "Resend invite" : "Send invite (email link)"}
            </Button>
            {inviteUrl && (
              <div className="space-y-4">
                <CredentialRow label="Invite link" value={inviteUrl} onCopy={copy} />
                <p className="text-xs text-amber-600">
                  Share this link only as a fallback — the host also received it by email.
                </p>
              </div>
            )}
          </div>
        </SheetDescription>
      </SheetHeader>
    </SheetContent>
  );
};

function CredentialRow({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: (label: string, value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <code
          aria-label={label}
          className="flex-1 rounded-md border border-black/10 bg-muted px-3 py-2 font-mono text-sm break-all"
        >
          {value}
        </code>
        <Button type="button" variant="outline" onClick={() => onCopy(label, value)}>
          Copy
        </Button>
      </div>
    </div>
  );
}

export default SendInvite;
