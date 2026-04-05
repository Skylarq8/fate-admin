"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);

    const res = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    setLoading(false);

    if (res.ok) {
      router.push("/dashboard");
    } else {
      alert("❌ Нэвтрэх нэр эсвэл нууц үг буруу");
    }
  };

  return (
    <div className="min-h-screen px-5 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
      
      {/* Card */}
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
        
        {/* Title */}
        <h1 className="text-2xl font-bold text-white text-center mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-400 text-center mb-6">
          Нэвтэрч орно уу
        </p>

        {/* Username */}
        <div className="mb-4">
          <label className="text-sm text-gray-400">Username</label>
          <input
            type="text"
            placeholder="username"
            className="w-full mt-1 p-3 rounded-lg bg-white/10 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white/30"
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="text-sm text-gray-400">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full mt-1 p-3 rounded-lg bg-white/10 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white/30"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full p-3 rounded-lg bg-white text-black font-semibold hover:bg-gray-200 transition disabled:opacity-50"
        >
          {loading ? "Loading..." : "Нэвтрэх"}
        </button>

        {/* Footer */}
        <p className="text-xs text-gray-500 text-center mt-6">
          © 2026 FATE Admin Dashboard
        </p>
      </div>
    </div>
  );
}