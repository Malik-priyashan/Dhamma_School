import { redirect } from "next/navigation";
import { defaultLocale } from "../config";

export default function RootPage() {
  // Redirect the user to the default locale when `/` is requested
  redirect(`/${defaultLocale}`);
}
