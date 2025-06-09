"use client";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      // Check if email confirmation is required
      if (data.user && !data.user.email_confirmed_at) {
        setError("Please check your email to confirm your account before signing in.");
      } else {
        router.push("/dashboard");
      }
    }
    setIsLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      router.push("/dashboard");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-96">
        <h1 className="text-3xl font-bold mb-4">Team Brainstorming AI</h1>
        <p className="text-gray-600 mb-6">Sign in to start collaborating</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900 bg-white placeholder-gray-500"
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900 bg-white placeholder-gray-500"
              placeholder="Enter your password"
              required
            />
          </div>
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleSignIn}
              disabled={isLoading}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300"
            >
              {isLoading ? "Loading..." : "Sign In"}
            </button>
            <button
              type="button"
              onClick={handleSignUp}
              disabled={isLoading}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors disabled:bg-gray-50"
            >
              {isLoading ? "Loading..." : "Sign Up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}