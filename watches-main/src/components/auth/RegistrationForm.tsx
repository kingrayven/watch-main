import React, { useState, ChangeEvent, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./auth.css";

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: string;
}

const RegistrationForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    role: "admin",
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
    if (error && (error.includes(name) || error.includes("already exists"))) {
      setError(null);
    }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) {
        setErrors(prev => ({ ...prev, profileImage: "Only image files are allowed" }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, profileImage: "Image must be less than 5MB" }));
        return;
      }
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
      setErrors(prev => ({ ...prev, profileImage: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!profileImage) newErrors.profileImage = "Profile image is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("username", formData.username);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("password", formData.password);
      formDataToSend.append("firstName", formData.firstName);
      formDataToSend.append("lastName", formData.lastName);
      formDataToSend.append("role", formData.role);
      if (profileImage) formDataToSend.append("profileImage", profileImage);

      const apiUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: "POST",
        body: formDataToSend,
        credentials: "include"
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          const newErrors: Record<string, string> = {};
          
          if (data.exists?.username) {
            newErrors.username = "Username already exists";
          }
          if (data.exists?.email) {
            newErrors.email = "Email already exists";
          }
          
          setErrors(newErrors);
          setError(data.message || "This email or username is already registered");
          return;
        }
        
        throw new Error(data.message || "Registration failed. Please try again.");
      }

      navigate("/login", { 
        state: { message: "Registration successful! Please login." },
        replace: true 
      });

    } catch (err) {
      console.error("Registration error:", err);
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">Create Admin Account</h1>
          <p className="auth-subtitle">Register to access the dashboard</p>
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

        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-grid">
            <div className="form-column">
              <div className="form-group">
                <label className="form-label">Profile Image</label>
                <div className="image-upload-container">
                  <label htmlFor="profileImage" className="image-upload-label">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Profile preview" className="profile-preview" />
                    ) : (
                      <div className="upload-placeholder">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                        </svg>
                        <span>Upload Image</span>
                      </div>
                    )}
                  </label>
                  <input
                    type="file"
                    id="profileImage"
                    name="profileImage"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="file-input"
                  />
                </div>
                {errors.profileImage && (
                  <span className="error-message">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.953 2C6.465 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.493 2 11.953 2zM12 20c-4.411 0-8-3.589-8-8s3.567-8 7.953-8C16.391 4 20 7.589 20 12s-3.589 8-8 8z"/>
                      <path d="M11 7h2v7h-2zm0 8h2v2h-2z"/>
                    </svg>
                    {errors.profileImage}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="firstName" className="form-label">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`form-input ${errors.firstName ? "input-error" : ""}`}
                />
                {errors.firstName && (
                  <span className="error-message">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.953 2C6.465 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.493 2 11.953 2zM12 20c-4.411 0-8-3.589-8-8s3.567-8 7.953-8C16.391 4 20 7.589 20 12s-3.589 8-8 8z"/>
                      <path d="M11 7h2v7h-2zm0 8h2v2h-2z"/>
                    </svg>
                    {errors.firstName}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="lastName" className="form-label">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`form-input ${errors.lastName ? "input-error" : ""}`}
                />
                {errors.lastName && (
                  <span className="error-message">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.953 2C6.465 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.493 2 11.953 2zM12 20c-4.411 0-8-3.589-8-8s3.567-8 7.953-8C16.391 4 20 7.589 20 12s-3.589 8-8 8z"/>
                      <path d="M11 7h2v7h-2zm0 8h2v2h-2z"/>
                    </svg>
                    {errors.lastName}
                  </span>
                )}
              </div>
            </div>

            <div className="form-column">
              <div className="form-group">
                <label htmlFor="username" className="form-label">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`form-input ${errors.username ? "input-error" : ""}`}
                />
                {errors.username && (
                  <span className="error-message">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.953 2C6.465 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.493 2 11.953 2zM12 20c-4.411 0-8-3.589-8-8s3.567-8 7.953-8C16.391 4 20 7.589 20 12s-3.589 8-8 8z"/>
                      <path d="M11 7h2v7h-2zm0 8h2v2h-2z"/>
                    </svg>
                    {errors.username}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-input ${errors.email ? "input-error" : ""}`}
                />
                {errors.email && (
                  <span className="error-message">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.953 2C6.465 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.493 2 11.953 2zM12 20c-4.411 0-8-3.589-8-8s3.567-8 7.953-8C16.391 4 20 7.589 20 12s-3.589 8-8 8z"/>
                      <path d="M11 7h2v7h-2zm0 8h2v2h-2z"/>
                    </svg>
                    {errors.email}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`form-input ${errors.password ? "input-error" : ""}`}
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
                {errors.password && (
                  <span className="error-message">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.953 2C6.465 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.493 2 11.953 2zM12 20c-4.411 0-8-3.589-8-8s3.567-8 7.953-8C16.391 4 20 7.589 20 12s-3.589 8-8 8z"/>
                      <path d="M11 7h2v7h-2zm0 8h2v2h-2z"/>
                    </svg>
                    {errors.password}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`form-input ${errors.confirmPassword ? "input-error" : ""}`}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
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
                {errors.confirmPassword && (
                  <span className="error-message">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.953 2C6.465 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.493 2 11.953 2zM12 20c-4.411 0-8-3.589-8-8s3.567-8 7.953-8C16.391 4 20 7.589 20 12s-3.589 8-8 8z"/>
                      <path d="M11 7h2v7h-2zm0 8h2v2h-2z"/>
                    </svg>
                    {errors.confirmPassword}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="role" className="form-label">Role</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-footer">
            <button 
              type="submit" 
              className={`auth-button ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="auth-spinner"></span>
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
            <p className="auth-footer-text">
              Already have an account?{" "}
              <Link to="/login" className="auth-link">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistrationForm;