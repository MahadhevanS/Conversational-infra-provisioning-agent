import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginLocal } from "../authLocal";

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function SignIn() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ✅ Show / Hide password
  const [showPwd, setShowPwd] = useState(false);

  // ✅ CAPTCHA
  const [a, setA] = useState(() => randomInt(2, 9));
  const [b, setB] = useState(() => randomInt(2, 9));
  const [captcha, setCaptcha] = useState("");

  const expected = useMemo(() => a + b, [a, b]);

  const regenerateCaptcha = () => {
    setA(randomInt(2, 9));
    setB(randomInt(2, 9));
    setCaptcha("");
  };

  // ✅ Forgot password (demo)
  const onForgotPassword = () => {
    alert(
      "Demo mode:\nPassword reset needs backend / email service.\nFor now, create a new account or remember your password."
    );
  };

  const onSubmit = (e) => {
    e.preventDefault();

    // Check captcha first
    if (Number(captcha) !== expected) {
      alert("Captcha incorrect. Please try again.");
      regenerateCaptcha();
      return;
    }

    try {
      loginLocal(email, password);
      navigate("/home");
    } catch (err) {
      alert(err.message || "Login failed");
      regenerateCaptcha();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070714] text-white px-4">
      <div className="w-full max-w-md p-8 rounded-2xl bg-white/5 border border-white/10">
        <h1 className="text-3xl font-bold mb-2 text-center">CloudCrafter Login</h1>
        <p className="text-center text-white/70 mb-8">Demo login (stored locally)</p>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="text-sm text-white/70">Email</label>
            <input
              className="mt-1 w-full p-3 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-white/30"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password + Eye */}
          <div>
            <label className="text-sm text-white/70">Password</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                className="w-full p-3 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-white/30"
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm"
                title={showPwd ? "Hide password" : "Show password"}
              >
                {showPwd ? "Hide" : "Show"}
              </button>
            </div>

            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-xs text-white/70 hover:text-white underline"
              >
                Forgot password?
              </button>
            </div>
          </div>

          {/* CAPTCHA */}
          <div className="pt-1">
            <label className="text-sm text-white/70">Human verification</label>

            <div className="mt-2 flex items-center gap-3">
              <div className="flex-1 rounded-xl bg-black/30 border border-white/10 px-4 py-3">
                <span className="text-white/80">Solve:</span>{" "}
                <span className="font-semibold">{a}</span>{" "}
                <span className="text-white/70">+</span>{" "}
                <span className="font-semibold">{b}</span>{" "}
                <span className="text-white/70">=</span>
              </div>

              <button
                type="button"
                onClick={regenerateCaptcha}
                className="px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm"
                title="Refresh captcha"
              >
                Refresh
              </button>
            </div>

            <input
              className="mt-3 w-full p-3 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-white/30"
              type="text"
              inputMode="numeric"
              value={captcha}
              onChange={(e) => setCaptcha(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="Enter answer"
              required
            />

            <p className="mt-1 text-xs text-white/50">
              This helps prevent automated logins (demo captcha).
            </p>
          </div>

          <button className="w-full bg-white text-black py-3 rounded-xl font-semibold">
            Sign In
          </button>
        </form>

        <p className="text-center mt-5 text-sm text-white/70">
          New user?{" "}
          <Link to="/signup" className="underline text-white">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}