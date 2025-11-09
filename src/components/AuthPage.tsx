"use client";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">🏛️ Civic AI</h1>
          <p className="mt-2 text-gray-600">Your local companion for civic engagement</p>
        </div>
        <div className="flex flex-col items-center justify-center mt-8">
          <Button
            className="w-full flex items-center gap-2"
            onClick={() => signIn("google")}
          >
            <Image src="/google.svg" alt="Google logo" width={20} height={20} className="w-5 h-5" />
            Continue with Google
          </Button>
        </div>
      </div>
    </div>
  );
}
