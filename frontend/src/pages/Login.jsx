import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import API from "../api/axios";

function Login() {

  const navigate = useNavigate();

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

      const response = await API.post("/login", formData);

      localStorage.setItem(
        "token",
        response.data.access_token
      );

      const fallbackName = formData.email.split("@")[0];
      const capitalizedFallback = fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1);
      localStorage.setItem(
        "userName",
        capitalizedFallback
      );

      navigate("/dashboard");

    } catch (error) {
      console.log(error.response.data);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">

      <form
        onSubmit={handleSubmit}
        className="w-80 p-6 border rounded-lg flex flex-col gap-4"
      >

        <h1 className="text-2xl font-bold">
          Login
        </h1>

        <input
          type="email"
          name="email"
          placeholder="Email"
          className="border p-2 rounded"
          value={formData.email}
          onChange={handleChange}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          className="border p-2 rounded"
          value={formData.password}
          onChange={handleChange}
        />

        <button className="bg-black text-white p-2 rounded">
          Login
        </button>
        <p className="text-sm text-center">
          Don't have an account?{" "}

          <Link
            to="/register"
            className="text-blue-500"
          >
            Register
          </Link>
        </p>

      </form>

    </div>
  );
}

export default Login;