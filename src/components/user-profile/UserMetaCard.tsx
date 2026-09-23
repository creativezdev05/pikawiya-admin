// UserMetaCard.tsx
"use client";

import { PencilIcon } from "@/icons";
import Image from "next/image";
import { useState, useTransition, ChangeEvent, useEffect } from "react";
import { useModal } from "../../hooks/useModal";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";
import { User } from "@supabase/supabase-js";
import { updateUserProfile } from "@/app/actions/profile";
import { createClient } from "@/utils/supabase/client"; // Import browser Supabase client

export interface UserClaims {
  fullName: string;
  avatarUrl: string;
  email: string;
  role: string;
  rawUserMetadata: Record<string, any>;
  rawAppMetadata: Record<string, any>;
}

interface ProfileData {
  id: string;
  address?: string;
  city?: string;
  country?: string;
  phone_number?: string;
  bio?: string;
  role?: string;
  avatar_url?: string;
  [key: string]: any;
}

interface UserMetaCardProps {
  user: User;
  profile: ProfileData | null;
  claims: UserClaims;
}

export default function UserMetaCard({ user, profile, claims }: UserMetaCardProps) {
  const { isOpen, openModal, closeModal } = useModal();
  const [isPending, startTransition] = useTransition();

  const currentAvatar =
    profile?.avatar_url || claims.avatarUrl || user.user_metadata?.avatar_url || "/images/user/owner.png";

  const [previewAvatar, setPreviewAvatar] = useState<string>(currentAvatar);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    setPreviewAvatar(currentAvatar);
  }, [currentAvatar]);

  const firstName = user?.user_metadata?.first_name || claims.fullName.split(" ")[0] || "";
  const lastName = user?.user_metadata?.last_name || claims.fullName.split(" ").slice(1).join(" ") || "";
  const phone = user?.user_metadata?.phone || profile?.phone_number || "";
  const bio = profile?.role || "";
  const country = profile?.country || "Australia";

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewAvatar(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      let uploadedAvatarUrl = "";

      // CLIENT-SIDE UPLOAD
      if (selectedFile) {
        const supabase = createClient();
        const fileExt = selectedFile.name.split(".").pop();
        const filePath = `${user.id}/avatar-${Date.now()}.${fileExt}`;

        // 1. Upload file directly from browser to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, selectedFile, { upsert: true });

        if (uploadError) {
          alert(`Failed to upload avatar image: ${uploadError.message}`);
          return;
        }

        // 2. Get Public URL with cache-busting query parameter
        const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
        uploadedAvatarUrl = `${data.publicUrl}?v=${Date.now()}`;
      }

      // 3. Send form fields + lightweight image URL string to Server Action
      const res = await updateUserProfile(formData, uploadedAvatarUrl);

      if (res.success) {
        setSelectedFile(null);
        closeModal();
      } else {
        alert(`Failed to update profile: ${res.error}`);
      }
    });
  };

  return (
    <>
      <div className="mb-6 rounded-2xl border border-gray-200 p-5 lg:p-6 dark:border-gray-800">
        <div className="flex flex-col gap-5 sm:flex-row xl:gap-10">
          <div className="flex-1">
            <div className="mb-4 flex flex-col gap-5 sm:flex-row lg:mb-6 xl:items-center xl:justify-between">
              <div className="flex w-full flex-col items-start gap-4 sm:flex-row sm:items-center lg:gap-6">
                <div className="overflow-hidden rounded-full border border-gray-200 dark:border-gray-800">
                  <Image
                    src={previewAvatar}
                    width={80}
                    height={80}
                    className="size-20 object-cover"
                    alt="user"
                  />
                </div>
                <div className="text-start">
                  <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
                    {claims.fullName || user.email}
                  </h4>
                  <div className="flex items-center gap-1 sm:gap-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {claims.role}
                    </p>
                    <div className="hidden h-3.5 w-px bg-gray-300 sm:block dark:bg-gray-700"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {country}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 xl:gap-x-11 xl:gap-y-7">
              <div className="w-full">
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  First Name
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {firstName || "N/A"}
                </p>
              </div>
              <div className="w-full">
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Last Name
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {lastName || "N/A"}
                </p>
              </div>
              <div className="hidden xl:block"></div>
              <div className="hidden xl:block"></div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Email address
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user.email}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Phone
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {phone || "N/A"}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Bio
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {bio || "N/A"}
                </p>
              </div>
            </div>
          </div>
          <div>
            <button
              onClick={openModal}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 lg:inline-flex lg:w-auto dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/3 dark:hover:text-gray-200"
            >
              <PencilIcon className="size-5" />
              Edit
            </button>
          </div>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="m-4 max-w-[700px]">
        <div className="relative no-scrollbar w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 lg:p-11 dark:bg-gray-900">
          <div className="px-2 pe-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Personal Information
            </h4>
            <p className="mb-6 text-sm text-gray-500 lg:mb-7 dark:text-gray-400">
              Update your details to keep your profile up-to-date.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div>
                <h4 className="mb-6 text-lg font-medium text-gray-800 dark:text-white/90">
                  Change Profile Picture
                </h4>
                <div className="mb-6 flex max-w-sm items-center gap-6 lg:pe-5">
                  <div className="relative size-20 shrink-0 rounded-full sm:size-25">
                    <Image
                      src={previewAvatar}
                      alt="Profile Picture"
                      width={100}
                      height={100}
                      className="size-20 rounded-full object-cover sm:size-25"
                    />
                    <label
                      htmlFor="file-upload"
                      className="absolute end-0 bottom-0 flex size-8 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400"
                    >
                      <input
                        type="file"
                        id="file-upload"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12.6731 3.41904C12.4371 3.10308 12.0659 2.91699 11.6715 2.91699H8.32809C7.93374 2.91699 7.56252 3.10308 7.32656 3.41904L6.83173 4.08164C6.59576 4.3976 6.22454 4.58369 5.83019 4.58369H3.5415C2.85115 4.58369 2.2915 5.14333 2.2915 5.83369V14.3754C2.2915 15.0657 2.85115 15.6254 3.5415 15.6254H16.4582C17.1485 15.6254 17.7082 15.0657 17.7082 14.3754V5.83369C17.7082 5.14333 17.1485 4.58369 16.4582 4.58369H14.1694C13.7751 4.58369 13.4039 4.3976 13.1679 4.08164L12.6731 3.41904Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M13.3332 9.79362C13.3332 11.6346 11.8408 13.127 9.99984 13.127C8.15889 13.127 6.6665 11.6346 6.6665 9.79362C6.6665 7.95267 8.15889 6.46029 9.99984 6.46029C11.8408 6.46029 13.3332 7.95267 13.3332 9.79362Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </label>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Upload a square image (200×200 px) in JPEG or PNG format.
                    </p>
                  </div>
                </div>
              </div>

              <div className="my-7">
                <h5 className="mb-5 text-lg font-medium text-gray-800 lg:mb-6 dark:text-white/90">
                  Personal Information
                </h5>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div className="col-span-2 lg:col-span-1">
                    <Label>First Name</Label>
                    <Input type="text" name="firstName" defaultValue={firstName} />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Last Name</Label>
                    <Input type="text" name="lastName" defaultValue={lastName} />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Email Address</Label>
                    <Input
                      type="text"
                      name="email"
                      defaultValue={user.email}
                      disabled
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Phone</Label>
                    <Input type="text" name="phone" defaultValue={phone} />
                  </div>

                  <div className="col-span-2">
                    <Label>Bio</Label>
                    <Input type="text" name="bio" defaultValue={bio} />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-3 px-2 lg:justify-end">
              <Button size="sm" variant="outline" type="button" onClick={closeModal}>
                Close
              </Button>
              <Button size="sm" type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}