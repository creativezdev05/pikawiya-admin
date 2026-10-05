import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pika Wiya SignUp Page",
  description: "This is Pika Wiya SignUp page for Pika Wiya Health Service created by RedBank Technologies",
  // other metadata
};

export default function SignUp() {
  return <SignUpForm />;
}
