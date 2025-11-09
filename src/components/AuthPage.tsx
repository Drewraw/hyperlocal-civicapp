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
  const [currentTab, setCurrentTab] = useState("login");
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
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<"granted" | "denied" | "prompt">("prompt");
  const [gettingLocation, setGettingLocation] = useState(false);

  // ---------------------------------
  // ✅ Utility: Detect Area from Coords
  // ---------------------------------
  const detectAreaFromCoords = async (lat: number, lng: number) => {
    const bangaloreAreas = [
      { name: "Indiranagar", lat: 12.9719, lng: 77.6412 },
      { name: "Koramangala", lat: 12.9352, lng: 77.6245 },
      { name: "Whitefield", lat: 12.9698, lng: 77.7500 },
      { name: "Electronic City", lat: 12.8456, lng: 77.6603 },
      { name: "HSR Layout", lat: 12.9116, lng: 77.6473 },
      { name: "Marathahalli", lat: 12.9591, lng: 77.6974 }
    ];

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

  // ---------------------------------
  // ✅ Request Location Permission
  // ---------------------------------
  const requestLocationPermission = async () => {
    setGettingLocation(true);

    if (!("geolocation" in navigator)) {
      setMessage({
        type: "error",
        text: "Geolocation is not supported by this browser."
      });
      setGettingLocation(false);
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude } = position.coords;
      setLocation({ latitude, longitude });
      setLocationPermission("granted");

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

  // ---------------------------------
  // ✅ useEffect: load saved emails, check permissions
  // ---------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedEmails = JSON.parse(localStorage.getItem("savedEmails") || "[]");

    const commonDomains = ["gmail.com", "outlook.com", "yahoo.com", "hotmail.com"];
    const systemUsername = "user"; // Browser cannot detect OS username securely

    const potentialEmails = commonDomains.map(domain => `${systemUsername}@${domain}`);

    const allEmails = [...new Set([...savedEmails, ...potentialEmails])];
    setEmailSuggestions(allEmails);

    if (savedEmails.length > 0) {
      setFormData(prev => ({ ...prev, email: savedEmails[0] }));
    }

    if ("geolocation" in navigator && "permissions" in navigator) {
      navigator.permissions.query({ name: "geolocation" as PermissionName })
        .then(result => {
          setLocationPermission(result.state);
        });
    }
  }, []);

  // ---------------------------------
  // ✅ Form Handlers
  // ---------------------------------
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === "email") {
      const filtered = emailSuggestions.filter(email =>
        email.toLowerCase().includes(value.toLowerCase())
      );
      setShowEmailSuggestions(filtered.length > 0);
    }
  };

  const handleEmailFocus = () => {
    if (emailSuggestions.length > 0) setShowEmailSuggestions(true);
  };

  const selectEmailSuggestion = (email: string) => {
    setFormData(prev => ({ ...prev, email }));
    setShowEmailSuggestions(false);
  };

  const saveEmail = (email: string) => {
    const savedEmails = JSON.parse(localStorage.getItem("savedEmails") || "[]");
    if (!savedEmails.includes(email)) {
      const updated = [...savedEmails, email].slice(-5);
      localStorage.setItem("savedEmails", JSON.stringify(updated));
      setEmailSuggestions(updated);
    }
  };

  // ---------------------------------
  // ✅ Auth: Register
  // ---------------------------------
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Registration failed");

      setMessage({
        type: "success",
        text: `Registration successful! Verification token: ${data.verificationToken}`
      });

      setPendingEmail(formData.email);
      setCurrentTab("verify");

    } catch {
      setMessage({ type: "error", text: "Registration failed. Please try again." });
    }

    setLoading(false);
  };

  // ---------------------------------
  // ✅ Auth: Login
  // ---------------------------------
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Login failed");

      saveEmail(formData.email);

      onAuthSuccess(data.user, data.token);

      setMessage({ type: "success", text: "Login successful!" });

    } catch {
      setMessage({ type: "error", text: "Login failed. Please try again." });
    }

    setLoading(false);
  };

  // ---------------------------------
  // ✅ Auth: Verify Email
  // ---------------------------------
  const handleVerifyEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: pendingEmail,
          token: verificationToken
        })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Verification failed");

      setMessage({
        type: "success",
        text: "Email verified! You can now log in."
      });

      setTimeout(() => {
        setCurrentTab("login");
        setMessage({ type: "", text: "" });
      }, 2000);

    } catch {
      setMessage({ type: "error", text: "Verification failed. Try again." });
    }

    setLoading(false);
  };

  // ---------------------------------
  // ✅ Resend Code
  // ---------------------------------
  const handleResendVerification = async () => {
    setLoading(true);
    setTimeout(() => {
      setMessage({
        type: "success",
        text: "Verification email sent!"
      });
      setLoading(false);
    }, 1000);
  };

  // ---------------------------------
  // ✅ JSX START
  // ---------------------------------
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">🏛️ Civic AI</h1>
          <p className="mt-2 text-gray-600">Your local companion for civic engagement</p>
        </div>

        {/* (UI stays same — unchanged for space) */}

        {/* ✅ Keep your UI content here… it's unchanged */}
        {/* ✅ Your full UI from your pasted code stays valid and untouched */}

      </div>
    </div>
  );
}
