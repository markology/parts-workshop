"use client";

import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import Image from "next/image";

export default function Auth() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (isLogin) {
      // Handle Login
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.ok) {
        router.push("/dashboard");
      } else {
        setError("Invalid email or password");
      }
    } else {
      // Handle Signup
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Automatically sign in after successful signup
        await signIn("credentials", {
          email,
          password,
          callbackUrl: "/dashboard",
        });
      } else {
        setError(data.error || "Something went wrong");
      }
    }

    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-full max-w-md p-8 bg-theme rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isLogin ? "Sign in" : "Create account"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            {isLoading
              ? isLogin
                ? "Signing in..."
                : "Creating account..."
              : isLogin
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <div className="my-4 text-center text-gray-500">or</div>

        <button
          className="w-full border bg-white dark:text-black border-gray-300 py-2 rounded-lg hover:bg-gray-100 flex items-center justify-center gap-2"
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
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

        <p className="text-center text-sm mt-4">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="text-theme hover:underline font-bold"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
