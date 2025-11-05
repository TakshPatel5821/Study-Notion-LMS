import loginImg from "../assets/Images/login.png"
import Template from "../components/core/Auth/Template"
import axiosInstance from "../services/api";

function Login() {
  return (
    <Template
      title="Welcome Back"
      description1="Build skills for today, tomorrow, and beyond."
      description2="Education to future-proof your career."
      image={loginImg}
      formType="login"
    />
  )
}

async function handleLogin(formData) {
  try {
    const response = await axiosInstance.post("/api/v1/auth/login", formData);
    console.log("✅ Login success:", response.data);
  } catch (error) {
    console.error("❌ Login failed:", error.response?.data || error.message);
  }
}

export default Login