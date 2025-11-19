import { useState, useEffect, type FormEvent } from "react";
import {
  Button,
  Input,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui";
import CheckboxDropdown from "./CheckboxDropdown";
import type { CreateUserRequest, UpdateUserRequest } from "@/types/user";
import type { UserDialogProps } from "@/interfaces/UserDialogProps";

const CAMPUS_OPTIONS = ["Ha Noi", "Da Nang", "Can Tho", "Ho Chi Minh"];
const DEPARTMENT_OPTIONS = ["Academic Affairs", "Student Affairs", "Information Technology"];

const UserDialog = ({ open, onClose, onSubmit, user, mode }: UserDialogProps) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    campus: [] as string[],
    department: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (mode === "update" && user) {
        setFormData({
          username: user.username,
          email: user.email,
          campus: user.campus || [],
          department: user.department || [],
        });
      } else {
        setFormData({
          username: "",
          email: "",
          campus: [],
          department: [],
        });
      }
      setErrors({});
    }
  }, [open, mode, user]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation for both create and update
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    // Username validation for create mode
    if (mode === "create") {
      if (!formData.username.trim()) {
        newErrors.username = "Username is required";
      }
      if (formData.campus.length === 0) {
        newErrors.campus = "At least one campus is required";
      }
      if (formData.department.length === 0) {
        newErrors.department = "At least one department is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (mode === "create") {
        await onSubmit({
          username: formData.username,
          email: formData.email,
          campus: formData.campus,
          department: formData.department,
        } as CreateUserRequest);
      } else {
        const updateData: UpdateUserRequest = {
          username: formData.username,
          email: formData.email,
          campus: formData.campus,
          department: formData.department,
        };
        
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
              ? "Create account for Student Affairs Department staff."
              : "Update account for Student Affairs Department staff."}
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
            <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1">
              Username <span className="text-red-500">*</span>
            </label>
            <Input
              id="username"
              type="text"
              placeholder="Enter username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              error={!!errors.username}
              disabled={isSubmitting}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username}</p>
            )}
          </div>

          {mode === "create" && (
            <>
              <div>
                <CheckboxDropdown
                  label="Campus"
                  required
                  options={CAMPUS_OPTIONS}
                  selected={formData.campus}
                  onChange={(selected) => setFormData({ ...formData, campus: selected })}
                  placeholder="Choose campus"
                  error={!!errors.campus}
                  disabled={isSubmitting}
                />
                {errors.campus && (
                  <p className="mt-1 text-sm text-red-600">{errors.campus}</p>
                )}
              </div>

              <div>
                <CheckboxDropdown
                  label="Department"
                  required
                  options={DEPARTMENT_OPTIONS}
                  selected={formData.department}
                  onChange={(selected) => setFormData({ ...formData, department: selected })}
                  placeholder="Choose department"
                  error={!!errors.department}
                  disabled={isSubmitting}
                />
                {errors.department && (
                  <p className="mt-1 text-sm text-red-600">{errors.department}</p>
                )}
              </div>
            </>
          )}

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
