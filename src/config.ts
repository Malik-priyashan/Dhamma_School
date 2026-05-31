export const locales = ["en", "si"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "si";

// Cloudinary configuration (use NEXT_PUBLIC_ env vars for client-side access)
export const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';
export const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? '';
