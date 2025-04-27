"use client";

import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setIsLoading(false);

    if (res?.ok) {
      router.push("/workspace");
    } else {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-full max-w-md p-8 bg-aside rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">Sign in</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            className="w-full px-4 py-2 border rounded-lg"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full px-4 py-2 border rounded-lg"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            {isLoading ? "Signing In..." : "Sign in"}
          </button>
          <p className="text-center text-sm mt-4">
            Don’t have an account?{" "}
            <button
              onClick={() => router.push("/signup")}
              className="text-blue-600 hover:underline"
            >
              <p className="font-bold">Sign up</p>
            </button>
          </p>
        </form>

        <div className="my-4 text-center text-gray-500">or</div>

        <button
          className="w-full border bg-white dark:text-black border-gray-300 py-2 rounded-lg hover:bg-gray-100 flex items-center justify-center gap-2"
          onClick={() => signIn("google", { callbackUrl: "/workspace" })}
        >
          <Image
            src="/google-logo.svg"
            alt="Google Logo"
            width={20}
            height={20}
            className="w-5 h-5"
          />
          Continue with Google
        </button>
      </div>
    </div>
  );
}
