"use client";

import { useState } from "react";
import { useRegister } from "@/app/lib/queries";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const register = useRegister();
  const router = useRouter();

  const submit = async (e: any) => {
    e.preventDefault();
    try {
      await register.mutateAsync({ email, password, name });
      router.push("/");
    } catch (err: any) {
      alert(err?.response?.data?.error || err?.message || "Registration failed");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-xl font-bold mb-4">Register</h1>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full border p-2 rounded" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="w-full border p-2 rounded" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full border p-2 rounded" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="w-full bg-blue-600 text-white py-2 rounded" type="submit">{register.isPending ? "Registering..." : "Register"}</button>
      </form>
      <p className="text-center mt-4 text-sm text-gray-600">
        Already have an account?{" "}
        <a href="/auth/login" className="text-blue-600 hover:underline">
          Login here
        </a>
      </p>
    </div>
  );
}
