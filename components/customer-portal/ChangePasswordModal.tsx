"use client";

import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useChangePasswordMutation } from "@/redux/api/authApi";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";

export function ChangePasswordModal() {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const [changePasswordMutation, { isLoading }] = useChangePasswordMutation();

  const handleReset = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!currentPassword) {
      setError("Please enter your current password.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    try {
      const res = await changePasswordMutation({
        currentPassword,
        newPassword,
      }).unwrap();

      toast.success("Password changed successfully!", {
        description: res.message || "Your password has been updated.",
      });

      handleReset();
      setOpen(false);
    } catch (err: unknown) {
      const anyErr = err as {
        data?: { message?: string | string[]; error?: string };
        message?: string;
      };
      const errorMessage =
        (Array.isArray(anyErr.data?.message)
          ? anyErr.data.message.join(", ")
          : anyErr.data?.message) ||
        anyErr.data?.error ||
        "Failed to change password. Please verify your current password.";

      setError(errorMessage);
      toast.error("Password update failed", {
        description: errorMessage,
      });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) handleReset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-md text-xs font-medium">
          <KeyRound size={13} className="mr-1.5" />
          Change Password
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Update your account password. You will use this new password for subsequent logins.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Current Password <span className="text-rose-600">*</span>
              </label>
              <Input
                type="password"
                placeholder="Enter current password..."
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                New Password <span className="text-rose-600">*</span>
              </label>
              <Input
                type="password"
                placeholder="Minimum 8 characters..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Confirm New Password <span className="text-rose-600">*</span>
              </label>
              <Input
                type="password"
                placeholder="Re-type new password..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-9 text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                handleReset();
                setOpen(false);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
