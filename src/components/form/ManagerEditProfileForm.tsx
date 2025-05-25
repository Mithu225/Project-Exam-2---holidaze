"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface ManagerEditProfileFormProps {
  userData: any;
  formData: { bio: string; avatarUrl: string };
  setFormData: (data: { bio: string; avatarUrl: string }) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export default function ManagerEditProfileForm({
  formData,
  setFormData,
  loading,
  onSubmit,
  onCancel,
}: ManagerEditProfileFormProps) {
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  return (
    <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-primary">Edit Profile</h2>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <form onSubmit={onSubmit}>
        <div className="mb-4">
          <Label htmlFor="bio" className="block mb-1">
            Your Bio
          </Label>
          <Textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            className="resize-none"
            rows={3}
            placeholder="Tell us a bit about yourself"
          />
        </div>
        <div className="mb-4">
          <Label htmlFor="avatarUrl" className="block mb-1">
            Avatar URL
          </Label>
          <Input
            type="text"
            id="avatarUrl"
            name="avatarUrl"
            value={formData.avatarUrl}
            onChange={handleInputChange}
            placeholder="Enter avatar image URL"
          />
        </div>
        <div className="flex space-x-3">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
