import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pika Wiya SignIn Page",
  description: "This is Pika Wiya SignIn page for Pika Wiya Health Service created by RedBank Technologies",
};

export default function SignIn() {
  return <SignInForm />;
}
