'use client';

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, CheckCircle, Mail, User, MapPin, Navigation } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  area: string;
  emailVerified?: boolean;
}

interface AuthPageProps {
  onAuthSuccess: (user: User, token: string) => void;
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [currentTab, setCurrentTab] = useState("login"); // login, register, verify
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    area: "Indiranagar"
  });
  const [verificationToken, setVerificationToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [pendingEmail, setPendingEmail] = useState("");
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  const [location, setLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [locationPermission, setLocationPermission] = useState<"granted" | "denied" | "prompt">("prompt");
  const [gettingLocation, setGettingLocation] = useState(false);

  // Check for saved emails and location permission on component mount
  useEffect(() => {
    // Get saved emails from localStorage for auto-complete
    const savedEmails = JSON.parse(localStorage.getItem('savedEmails') || '[]');
    
    // Try to get system email or add common email domains
    const commonDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com'];
    const systemUsername = window.navigator.userAgent.includes('Windows') ? 
      (process.env.USERNAME || process.env.USER || 'user') : 'user';
    
    // Add potential emails based on system username
    const potentialEmails = commonDomains.map(domain => `${systemUsername}@${domain}`);
    
    // Combine saved emails with potential emails (remove duplicates)
    const allEmails = [...new Set([...savedEmails, ...potentialEmails])];
    setEmailSuggestions(allEmails);
    
    // Auto-fill with most recent saved email if available
    if (savedEmails.length > 0) {
      setFormData(prev => ({ ...prev, email: savedEmails[0] }));
    }
    
    // Check location permission status
    if ('geolocation' in navigator && 'permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationPermission(result.state);
      });
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Show email suggestions when typing in email field
    if (name === 'email') {
      if (value.length >= 0) { // Show suggestions even for empty input
        const filtered = emailSuggestions.filter(email => 
          email.toLowerCase().includes(value.toLowerCase())
        );
        setShowEmailSuggestions(filtered.length > 0);
      }
    }
  };

  // Handle focus on email field to show suggestions
  const handleEmailFocus = () => {
    if (emailSuggestions.length > 0) {
      setShowEmailSuggestions(true);
    }
  };

  const selectEmailSuggestion = (email) => {
    setFormData(prev => ({ ...prev, email }));
    setShowEmailSuggestions(false);
  };

  const saveEmail = (email) => {
    const savedEmails = JSON.parse(localStorage.getItem('savedEmails') || '[]');
    if (!savedEmails.includes(email)) {
      const updatedEmails = [...savedEmails, email].slice(-5); // Keep only last 5 emails
      localStorage.setItem('savedEmails', JSON.stringify(updatedEmails));
      setEmailSuggestions(updatedEmails);
    }
  };

  const requestLocationPermission = async () => {
    setGettingLocation(true);
    
    if (!('geolocation' in navigator)) {
      setMessage({
        type: "error",
        text: "Geolocation is not supported by this browser."
      });
      setGettingLocation(false);
      return;
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude } = position.coords;
      setLocation({ latitude, longitude });
      setLocationPermission("granted");
      
      // Reverse geocode to get area name (you can integrate with a geocoding service)
      // For now, we'll use a mock area detection
      const detectedArea = await detectAreaFromCoords(latitude, longitude);
      setFormData(prev => ({ ...prev, area: detectedArea }));
      
      setMessage({
        type: "success",
        text: `Location detected: ${detectedArea}`
      });
    } catch (error) {
      setLocationPermission("denied");
      setMessage({
        type: "error",
        text: "Unable to get location. Please enter your area manually."
      });
    } finally {
      setGettingLocation(false);
    }
  };

  const detectAreaFromCoords = async (lat, lng) => {
    // Mock area detection - in a real app, you'd use a geocoding service like Google Maps API
    // This is a simplified example for Bangalore areas
    const bangaloreAreas = [
      { name: "Indiranagar", lat: 12.9719, lng: 77.6412 },
      { name: "Koramangala", lat: 12.9352, lng: 77.6245 },
      { name: "Whitefield", lat: 12.9698, lng: 77.7500 },
      { name: "Electronic City", lat: 12.8456, lng: 77.6603 },
      { name: "HSR Layout", lat: 12.9116, lng: 77.6473 },
      { name: "Marathahalli", lat: 12.9591, lng: 77.6974 }
    ];

    // Find closest area
    let closestArea = "Indiranagar";
    let minDistance = Infinity;

    bangaloreAreas.forEach(area => {
      const distance = Math.sqrt(
        Math.pow(lat - area.lat, 2) + Math.pow(lng - area.lng, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestArea = area.name;
      }
    });

    return closestArea;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // Real API call to Next.js API route
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Success response
      setMessage({
        type: "success",
        text: `Registration successful! Verification token: ${data.verificationToken}`
      });
      setPendingEmail(formData.email);
      setCurrentTab("verify");
      setLoading(false);

    } catch (error) {
      setMessage({
        type: "error",
        text: "Registration failed. Please try again."
      });
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // Real API call to Next.js API route
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Success - save email for future suggestions
      saveEmail(formData.email);
      
      // Pass user data to parent component
      onAuthSuccess(data.user, data.token);
      
      setMessage({
        type: "success",
        text: "Login successful!"
      });
      setLoading(false);

    } catch (error) {
      setMessage({
        type: "error",
        text: "Login failed. Please try again."
      });
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // Real API call to Next.js API route
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: pendingEmail, 
          token: verificationToken 
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setMessage({
        type: "success",
        text: "Email verified successfully! You can now log in."
      });
      
      setTimeout(() => {
        setCurrentTab("login");
        setMessage({ type: "", text: "" });
      }, 2000);
      
      setLoading(false);

    } catch (error) {
      setMessage({
        type: "error",
        text: "Verification failed. Please try again."
      });
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    try {
      // Mock API call
      setTimeout(() => {
        setMessage({
          type: "success",
          text: "Verification email sent! Please check your inbox."
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to send verification email."
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">🏛️ Civic AI</h1>
          <p className="mt-2 text-gray-600">Your local companion for civic engagement</p>
        </div>

        <Card className="p-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setCurrentTab("login")}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                currentTab === "login" 
                  ? "bg-white text-blue-600 shadow-sm" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setCurrentTab("register")}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                currentTab === "register" 
                  ? "bg-white text-blue-600 shadow-sm" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Register
            </button>
          </div>

          {/* GPS Permission Popup */}
          {(currentTab === "register" || currentTab === "login") && locationPermission === "prompt" && !location && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Navigation className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Enable Location Services</p>
                    <p className="text-xs text-blue-600">Help us find your local area for better community features</p>
                  </div>
                </div>
                <Button
                  onClick={requestLocationPermission}
                  disabled={gettingLocation}
                  size="sm"
                  className="ml-3"
                >
                  {gettingLocation ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    "Enable"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Message Display */}
          {message.text && (
            <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
              message.type === "success" ? "bg-green-50 text-green-700" :
              message.type === "warning" ? "bg-yellow-50 text-yellow-700" :
              "bg-red-50 text-red-700"
            }`}>
              {message.type === "success" && <CheckCircle size={16} />}
              {message.type === "warning" && <AlertTriangle size={16} />}
              {message.type === "error" && <AlertTriangle size={16} />}
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          {/* Login Form */}
          {currentTab === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onFocus={handleEmailFocus}
                    onBlur={() => setTimeout(() => setShowEmailSuggestions(false), 200)}
                    placeholder="your.email@example.com"
                    className="pl-10"
                    required
                  />
                  <Mail className="absolute left-3 top-3 text-gray-400" size={16} />
                  
                  {/* Email Suggestions Dropdown */}
                  {showEmailSuggestions && emailSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                      {emailSuggestions
                        .filter(email => formData.email.length === 0 || email.toLowerCase().includes(formData.email.toLowerCase()))
                        .map((email, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => selectEmailSuggestion(email)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                        >
                          {email}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Area
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    placeholder="Your area/locality"
                    className="pl-10 pr-10"
                    required
                  />
                  <MapPin className="absolute left-3 top-3 text-gray-400" size={16} />
                  <Button
                    type="button"
                    onClick={requestLocationPermission}
                    disabled={gettingLocation}
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8 w-8 p-0"
                  >
                    {gettingLocation ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    ) : (
                      <Navigation className="w-4 h-4 text-blue-600" />
                    )}
                  </Button>
                </div>
                {locationPermission === "denied" && (
                  <p className="text-xs text-amber-600 mt-1">
                    Location access denied. Please enter your area manually.
                  </p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>
          )}

          {/* Register Form */}
          {currentTab === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your full name"
                    className="pl-10"
                    required
                  />
                  <User className="absolute left-3 top-3 text-gray-400" size={16} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onFocus={handleEmailFocus}
                    onBlur={() => setTimeout(() => setShowEmailSuggestions(false), 200)}
                    placeholder="your.email@example.com"
                    className="pl-10"
                    required
                  />
                  <Mail className="absolute left-3 top-3 text-gray-400" size={16} />
                  
                  {/* Email Suggestions Dropdown */}
                  {showEmailSuggestions && emailSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                      {emailSuggestions
                        .filter(email => formData.email.length === 0 || email.toLowerCase().includes(formData.email.toLowerCase()))
                        .map((email, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => selectEmailSuggestion(email)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                        >
                          {email}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Area
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    placeholder="Your area/locality"
                    className="pl-10 pr-10"
                    required
                  />
                  <MapPin className="absolute left-3 top-3 text-gray-400" size={16} />
                  <Button
                    type="button"
                    onClick={requestLocationPermission}
                    disabled={gettingLocation}
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8 w-8 p-0"
                  >
                    {gettingLocation ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    ) : (
                      <Navigation className="w-4 h-4 text-blue-600" />
                    )}
                  </Button>
                </div>
                {locationPermission === "denied" && (
                  <p className="text-xs text-amber-600 mt-1">
                    Location access denied. Please enter your area manually.
                  </p>
                )}
                {location && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Location detected: {formData.area}
                  </p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create Account"}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                By registering, you&apos;ll receive an email verification link to activate your account.
              </p>
            </form>
          )}

          {/* Email Verification */}
          {currentTab === "verify" && (
            <div className="space-y-4">
              <div className="text-center">
                <Mail className="mx-auto text-blue-600 mb-3" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Check Your Email
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  We sent a verification link to <strong>{pendingEmail}</strong>
                </p>
              </div>

              <form onSubmit={handleVerifyEmail} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Verification Code (from email)
                  </label>
                  <Input
                    type="text"
                    value={verificationToken}
                    onChange={(e) => setVerificationToken(e.target.value)}
                    placeholder="Enter verification code"
                    className="text-center tracking-wider"
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Verify Email"}
                </Button>
              </form>

              <div className="text-center pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">
                  Didn&apos;t receive the email?
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleResendVerification}
                  disabled={loading}
                >
                  Resend Verification Email
                </Button>
              </div>
            </div>
          )}
        </Card>

        <div className="text-center text-sm text-gray-500">
          <p>Join your community in making local issues visible and actionable.</p>
        </div>
      </div>
    </div>
  );
}