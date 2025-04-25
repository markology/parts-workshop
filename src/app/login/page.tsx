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
          className="w-full border border-gray-300 py-2 rounded-lg hover:bg-gray-100 text-black"
          onClick={() => signIn("google", { callbackUrl: "/workspace" })}
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}
