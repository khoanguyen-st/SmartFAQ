import { useState, useEffect } from "react";
import {
  Button,
  Input,
  Select,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui";
import type { User, CreateUserRequest, UpdateUserRequest, UserRole } from "../../types/user";

interface UserDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserRequest | UpdateUserRequest) => Promise<void>;
  user?: User | null;
  mode: "create" | "update";
}

const ROLES: UserRole[] = ["Super Admin", "Admin"];

const UserDialog = ({ open, onClose, onSubmit, user, mode }: UserDialogProps) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "Staff" as UserRole,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (mode === "update" && user) {
        setFormData({
          username: user.username,
          email: user.email,
          password: "",
          role: user.role,
        });
      } else {
        setFormData({
          username: "",
          email: "",
          password: "",
          role: "Admin",
        });
      }
      setErrors({});
    }
  }, [open, mode, user]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (mode === "create") {
      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Invalid email format";
      }
    } else {
      // Update mode - only validate if fields are provided
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Invalid email format";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (mode === "create") {
        await onSubmit({
          username: formData.email.split('@')[0], // Generate username from email
          email: formData.email,
          password: "TempPass123!", // Temporary password
          role: formData.role,
        } as CreateUserRequest);
      } else {
        const updateData: UpdateUserRequest = {};
        if (formData.username !== user?.username) updateData.username = formData.username;
        if (formData.email !== user?.email) updateData.email = formData.email;
        if (formData.role !== user?.role) updateData.role = formData.role;
        
        await onSubmit(updateData);
      }
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Account" : "Update Account"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Modify and extend the current session."
              : "Modify and extend the current session."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={!!errors.email}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <Select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              disabled={isSubmitting}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </Select>
          </div>

          {errors.submit && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
              {errors.submit}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : mode === "create" ? "Create" : "Update"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
};

export default UserDialog;
