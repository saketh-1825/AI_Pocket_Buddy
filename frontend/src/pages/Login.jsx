import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { login } from "../services/auth/authService";

function Login() {

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {

      const response = await login(formData);

      const fallbackName = formData.email.split("@")[0];
      const capitalizedFallback = fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1);
      
      setAuth(response.access_token, capitalizedFallback);

      navigate("/");

    } catch (error) {
      console.log(error.response.data);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6] font-sans px-4 select-none">
      <div className="w-full max-w-md bg-white border border-[#E5E7EB] rounded-2xl p-8 shadow-soft space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="text-3xl font-extrabold tracking-tight text-[#111827]">
            Pocket Buddy
          </span>
          <h2 className="text-lg font-bold text-[#111827] tracking-wide pt-2">
            Log in to your account
          </h2>
          <p className="text-[15px] text-[#6B7280] font-normal">
            Track your spending and savings.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[12px] font-bold uppercase tracking-wider text-[#6B7280]">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              placeholder="name@example.com"
              className="w-full bg-slate-50 border border-[#E5E7EB] rounded-xl px-4 py-3 text-[#111827] focus:outline-none focus:border-[#4F46E5] transition-colors font-sans text-[14px]"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[12px] font-bold uppercase tracking-wider text-[#6B7280]">
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="Enter password"
              className="w-full bg-slate-50 border border-[#E5E7EB] rounded-xl px-4 py-3 text-[#111827] focus:outline-none focus:border-[#4F46E5] transition-colors font-sans text-[14px]"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl py-3 text-sm font-semibold transition-all shadow-sm cursor-pointer mt-2"
          >
            Log In
          </button>
        </form>

        <p className="text-sm text-center text-[#6B7280]">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-[#4F46E5] font-semibold hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;