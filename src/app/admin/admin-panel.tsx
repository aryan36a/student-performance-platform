"use client";

import { useRouter } from "next/navigation";
import { UploadDropzone } from "@/components/admin/upload-dropzone";

export function AdminPanel() {
  const router = useRouter();

  return <UploadDropzone onImported={() => router.refresh()} />;
}
