import React, { useState, FormEvent, ChangeEvent, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import "./auth.css";

interface UserData {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profileImage: string | null;
}

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const redirectMessage = searchParams.get("message");
    if (redirectMessage) {
      setError(redirectMessage);
    }
  }, [location]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const apiUrl = (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/$/, "");
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed. Please check your credentials.");
      }

      const data = await response.json();

      const userData: UserData = {
        userId: data.user.user_id,
        firstName: data.user.first_name,
        lastName: data.user.last_name,
        email: data.user.email,
        role: data.user.role,
        profileImage: data.user.profile_image
      };
      localStorage.setItem("user", JSON.stringify(userData));
      
      navigate("/home", { replace: true });

    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your account</p>
        </div>

        {error && (
          <div className="auth-error">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.953 2C6.465 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.493 2 11.953 2zM12 20c-4.411 0-8-3.589-8-8s3.567-8 7.953-8C16.391 4 20 7.589 20 12s-3.589 8-8 8z"/>
              <path d="M11 7h2v7h-2zm0 8h2v2h-2z"/>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter your email"
              required
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="form-group">
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="form-label">Password</label>
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                minLength={6}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 5c-5.429 0-10 3.533-10 7 0 1.208.473 2.334 1.289 3.308L2 17l2.648 1.249A9.976 9.976 0 0 0 12 19c5.429 0 10-3.533 10-7s-4.571-7-10-7zm0 12c-3.198 0-6.164-1.254-7.747-3.346C5.836 11.754 8.802 10.5 12 10.5s6.164 1.254 7.747 3.346C18.164 15.746 15.198 17 12 17zM12 8.5c-1.93 0-3.5 1.57-3.5 3.5s1.57 3.5 3.5 3.5 3.5-1.57 3.5-3.5-1.57-3.5-3.5-3.5zm0 5c-.827 0-1.5-.673-1.5-1.5s.673-1.5 1.5-1.5 1.5.673 1.5 1.5-.673 1.5-1.5 1.5z"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.885 14.988l3.104-3.098.011.11c0 1.654-1.346 3-3 3l-.115-.012zm8.048-8.032l-3.274 3.268c.212.554.341 1.149.341 1.776 0 2.757-2.243 5-5 5-.631 0-1.229-.13-1.785-.344l-2.377 2.372c1.276.588 2.671.972 4.177.972 5.523 0 10-4.477 10-10 0-1.505-.382-2.902-.97-4.178zm-13.925-1.452l3.339 3.332c-.148.059-.291.126-.43.202-1.433.799-2.5 2.314-2.5 4.068 0 .639.13 1.246.363 1.805l-3.47 3.463C3.072 16.347 2 14.249 2 12c0-5.523 4.477-10 10-10 2.248 0 4.346 1.072 5.794 2.765l-1.786 1.784zm-7.516 3.049l1.94-1.937c1.023.742 1.915 1.638 2.642 2.643l-1.94 1.937c-.723-.915-1.52-1.72-2.342-2.343zm-.344-3.142l3.28 3.273.003-.012c-1.108-.797-2.582-1.261-4.282-1.261-.65 0-1.272.098-1.861.245l.003.017c.86.244 1.649.568 2.372.963l-.515.515z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className={`auth-button ${(isLoading || !formData.email || !formData.password) ? 'opacity-75 cursor-not-allowed' : ''}`}
            disabled={isLoading || !formData.email || !formData.password}
          >
            {isLoading ? (
              <>
                <span className="auth-spinner"></span>
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?{" "}
          <Link to="/register" className="auth-link">
            Create one now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;