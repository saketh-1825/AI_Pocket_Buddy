import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";

function Register() {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
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

      const response = await API.post(
        "/register",
        formData
      );

      console.log(response.data);

      localStorage.setItem(
        "token",
        response.data.access_token
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
          Register
        </h1>

        <input
          type="text"
          name="name"
          placeholder="Name"
          className="border p-2 rounded"
          value={formData.name}
          onChange={handleChange}
        />

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
          Register
        </button>

        <p className="text-sm text-center">
          Already have an account?{" "}

          <Link
            to="/"
            className="text-blue-500"
          >
            Login
          </Link>
        </p>

      </form>

    </div>
  );
}

export default Register;