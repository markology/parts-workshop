"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/workspace");
    }
  }, [status, router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    const data = await res.json();
    setIsLoading(false);

    if (res.ok) {
      await signIn("credentials", {
        email,
        password,
        callbackUrl: "/workspace",
      });
    } else {
      setError(data.error || "Something went wrong");
    }
  };

  if (status === "loading") {
    return <p className="text-center p-8">Checking session...</p>;
  }

  return (
    <div
      id="login-form"
      className="flex min-h-screen items-center justify-center bg-gray-100"
    >
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">Sign in</h2>

        <form onSubmit={handleSignup} className="space-y-4">
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
            {isLoading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <div className="my-4 text-center text-gray-500">or</div>

        <button
          className="w-full border border-gray-300 py-2 rounded-lg hover:bg-gray-100 text-black"
          onClick={() => signIn("google", { callbackUrl: "/workspace" })}
        >
          Continue with Google
        </button>
        <p className="text-center text-sm mt-4">
          Already have an account?{" "}
          <button
            onClick={() => router.push("/login")}
            className="text-blue-600 hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
