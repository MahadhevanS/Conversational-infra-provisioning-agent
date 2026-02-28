import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signupLocal } from "../authLocal";

export default function SignUp() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // ✅ NEW

  const [awsAccountId, setAwsAccountId] = useState("");
  const [awsRegion, setAwsRegion] = useState("ap-south-1");
  const [roleArn, setRoleArn] = useState("");
  const [externalId, setExternalId] = useState("");

  // validations
  const accountIdOk = useMemo(() => /^\d{12}$/.test(awsAccountId.trim()), [awsAccountId]);
  const regionOk = useMemo(() => /^[a-z]{2}-[a-z]+-\d$/.test(awsRegion.trim()), [awsRegion]);
  const roleArnOk = useMemo(
    () => /^arn:aws:iam::\d{12}:role\/[\w+=,.@\-_/]+$/.test(roleArn.trim()),
    [roleArn]
  );

  // ✅ password match validation
  const passwordsMatch = useMemo(() => password === confirmPassword && password.length > 0, [password, confirmPassword]);

  const canSubmit = useMemo(() => {
    return (
      fullName.trim().length >= 2 &&
      email.trim().length > 3 &&
      password.length >= 6 &&
      passwordsMatch &&
      accountIdOk &&
      regionOk &&
      roleArnOk
    );
  }, [fullName, email, password, passwordsMatch, accountIdOk, regionOk, roleArnOk]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      signupLocal({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        aws: {
          aws_account_id: awsAccountId.trim(),
          aws_region: awsRegion.trim(),
          role_arn: roleArn.trim(),
          external_id: externalId.trim() || "",
        },
      });

      alert("Account created! Now Sign In.");
      navigate("/signin");
    } catch (err) {
      alert(err.message || "Signup failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#070714] text-white px-4 py-10 overflow-y-auto">
      <div className="w-full max-w-lg mx-auto rounded-2xl bg-white/5 border border-white/10">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-2 text-center">Create Account</h1>
          <p className="text-center text-white/70 mb-8">
            Demo signup (stored locally). Add AWS role details for provisioning.
          </p>

          <form onSubmit={onSubmit} className="space-y-4">

            {/* Full Name */}
            <div>
              <label className="text-sm text-white/70">Full Name</label>
              <input
                className="mt-1 w-full p-3 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-white/30"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

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

            {/* Password */}
            <div>
              <label className="text-sm text-white/70">Password</label>
              <input
                className="mt-1 w-full p-3 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-white/30"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="mt-1 text-xs text-white/50">Minimum 6 characters.</p>
            </div>

            {/* ✅ Confirm Password */}
            <div>
              <label className="text-sm text-white/70">Confirm Password</label>
              <input
                className={`mt-1 w-full p-3 rounded-xl bg-black/30 border outline-none focus:border-white/30 ${
                  confirmPassword.length > 0
                    ? passwordsMatch
                      ? "border-green-500"
                      : "border-red-500"
                    : "border-white/10"
                }`}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              {/* Error message */}
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="mt-1 text-xs text-red-400">Passwords do not match</p>
              )}

              {confirmPassword.length > 0 && passwordsMatch && (
                <p className="mt-1 text-xs text-green-400">Passwords match ✓</p>
              )}
            </div>

            {/* AWS Account ID */}
            <div>
              <label className="text-sm text-white/70">AWS Account ID</label>
              <input
                className="mt-1 w-full p-3 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-white/30"
                value={awsAccountId}
                onChange={(e) => setAwsAccountId(e.target.value.replace(/\D/g, "").slice(0, 12))}
                placeholder="123456789012"
                required
              />
              {!accountIdOk && awsAccountId.length > 0 && (
                <p className="mt-1 text-xs text-red-300">Must be exactly 12 digits.</p>
              )}
            </div>

            {/* Region */}
            <div>
              <label className="text-sm text-white/70">Default Region</label>
              <input
                className="mt-1 w-full p-3 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-white/30"
                value={awsRegion}
                onChange={(e) => setAwsRegion(e.target.value)}
                placeholder="ap-south-1"
                required
              />
            </div>

            {/* Role ARN */}
            <div>
              <label className="text-sm text-white/70">IAM Role ARN</label>
              <input
                className="mt-1 w-full p-3 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-white/30"
                value={roleArn}
                onChange={(e) => setRoleArn(e.target.value)}
                placeholder="arn:aws:iam::123456789012:role/CloudCrafterRole"
                required
              />
            </div>

            {/* External ID */}
            <div>
              <label className="text-sm text-white/70">External ID (optional)</label>
              <input
                className="mt-1 w-full p-3 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-white/30"
                value={externalId}
                onChange={(e) => setExternalId(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-white text-black py-3 rounded-xl font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Create Account
            </button>

            <p className="text-center mt-4 text-sm text-white/70">
              Already have an account?{" "}
              <Link to="/signin" className="underline text-white">
                Sign In
              </Link>
            </p>

          </form>
        </div>
      </div>
    </div>
  );
}