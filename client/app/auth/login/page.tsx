"use client";

import { useState } from "react";
import { useLogin } from "@/app/lib/queries";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin();
  const router = useRouter();

  const submit = async (e: any) => {
    e.preventDefault();
    try {
      const res = await login.mutateAsync({ email, password });
      // token already stored in onSuccess
      router.push("/");
    } catch (err: any) {
      alert(err?.response?.data?.error || err?.message || "Login failed");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-xl font-bold mb-4">Login</h1>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full border p-2 rounded" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full border p-2 rounded" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="w-full bg-blue-600 text-white py-2 rounded" type="submit">{login.isPending ? "Logging in..." : "Login"}</button>
      </form>
      <p className="text-center mt-4 text-sm text-gray-600">
        Don't have an account?{" "}
        <a href="/auth/register" className="text-blue-600 hover:underline">
          Register here
        </a>
      </p>
    </div>
  );
}
