'use client';

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MapPin, Send, MessageSquare, ThumbsUp, CheckCircle, AlertTriangle, Bell, Users, Home, MessageCircle, Upload, X, Image, Video, LogOut } from "lucide-react";
import AuthPage from "@/components/AuthPage";

interface User {
  id: string;
  name: string;
  email: string;
  area: string;
  distance?: number;
}

interface Issue {
  id: string;
  category: string;
  area: string;
  text: string;
  userId: string;
  userName: string;
  timestamp: string;
  status: string;
  upvotes: string[];
  comments: Array<{
    userId: string;
    userName: string;
    text: string;
    timestamp: string;
  }>;
  verifications: {
    positive: number;
    negative: number;
    details: Array<{
      userId: string;
      response: string;
      media?: string[];
    }>;
  };
  aiFollowUpScheduled: boolean;
}

interface VerificationRequest {
  id: string;
  issueId: string;
  message: string;
  timestamp: string;
  responded: boolean;
}

interface Notification {
  id: string;
  type: string;
  message: string;
  issueId?: string;
  timestamp: string;
}

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

export default function CivicAIPlatform() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState("feed");
  const [chatInput, setChatInput] = useState("");
  const [reportInput, setReportInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("potholes");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [verificationMedia, setVerificationMedia] = useState<Record<string, UploadedFile[]>>({});
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [chatHistory, setChatHistory] = useState([
    {
      from: "ai",
      message: "Hi! I'm your civic AI assistant. Ask me about areas, nearby issues, scams, or department contacts!",
      timestamp: "Today"
    }
  ]);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Check if user session is valid
      const response = await fetch('http://localhost:5001/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
        setIsAuthenticated(true);
        loadData();
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = (userData: User, token: string) => {
    localStorage.setItem('token', token);
    setCurrentUser(userData);
    setIsAuthenticated(true);
    loadData();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setIsAuthenticated(false);
    setIssues([]);
    setVerificationRequests([]);
    setNotifications([]);
  };

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Load user's area data and sample data
      const sampleIssues = [
        {
          id: "i1",
          category: "potholes",
          area: "Indiranagar, Bangalore",
          text: "Large pothole near the market road junction causing traffic issues",
          userId: "user2",
          userName: "Priya K",
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: "pending",
          upvotes: ["user2", "user3", "user4"],
          comments: [
            { userId: "ai", userName: "AI", text: "I've notified 4 nearby users to verify this issue.", timestamp: new Date().toISOString() }
          ],
          verifications: {
            confirmed: ["user3", "user4"],
            pending: ["user1", "user5"],
            denied: []
          },
          aiFollowUpScheduled: true
        }
      ];
      setIssues(sampleIssues);

      const sampleRequests = [
        {
          id: "vr1",
          issueId: "i1",
          message: "Priya K reported a pothole on Market Road. Can you verify?",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          responded: false
        }
      ];
      setVerificationRequests(sampleRequests);

      setNotifications([
        {
          id: "n1",
          type: "followup",
          message: "You reported a pothole 2 days ago. Has it been fixed yet?",
          issueId: "i1",
          timestamp: "2 hours ago"
        }
      ]);

    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const fileData = files.map(file => ({
      id: Math.random().toString(36).slice(2),
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file)
    }));
    setUploadedFiles(prev => [...prev, ...fileData]);
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleVerificationFileUpload = (requestId, e) => {
    const files = Array.from(e.target.files);
    const fileData = files.map(file => ({
      id: Math.random().toString(36).slice(2),
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file),
      file: file // Keep the actual file object for upload
    }));
    
    setVerificationMedia(prev => ({
      ...prev,
      [requestId]: [...(prev[requestId] || []), ...fileData]
    }));
  };

  const removeVerificationFile = (requestId, fileId) => {
    setVerificationMedia(prev => ({
      ...prev,
      [requestId]: prev[requestId]?.filter(f => f.id !== fileId) || []
    }));
  };

  const handleReportIssue = async () => {
    if (!reportInput.trim()) return;
    
    const newIssue = {
      id: `i${Date.now()}`,
      category: selectedCategory,
      area: "Indiranagar, Bangalore",
      text: reportInput,
      userId: currentUser.id,
      userName: currentUser.name,
      timestamp: new Date().toISOString(),
      status: "pending",
      upvotes: [currentUser.id],
      media: uploadedFiles,
      comments: [{
        userId: "ai",
        userName: "AI",
        text: `Report logged! Notifying 4 nearby users. I'll follow up in 48 hours.`,
        timestamp: new Date().toISOString()
      }],
      verifications: { confirmed: [], pending: [], denied: [] },
      aiFollowUpScheduled: true
    };

    const updatedIssues = [newIssue, ...issues];
    setIssues(updatedIssues);
    setReportInput("");
    setUploadedFiles([]);
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    
    setChatHistory(prev => [...prev, { from: "user", message: chatInput, timestamp: "Just now" }]);
    
    setTimeout(() => {
      let aiResponse = "I can help with area comparisons, nearby issues, scam alerts, and department contacts. What would you like to know?";
      const lower = chatInput.toLowerCase();
      
      if (lower.includes("area") || lower.includes("good")) {
        aiResponse = "Top Areas: Indiranagar (fast resolution), Koramangala (active community), Jayanagar (well-maintained). Want a detailed comparison?";
      } else if (lower.includes("issue") || lower.includes("nearby")) {
        aiResponse = "Recent issues: 1) Pothole on Market Rd (4 confirmed) 2) Water shortage in Koramangala. Want details?";
      } else if (lower.includes("scam")) {
        aiResponse = "Recent scams: UPI fraud near ATMs (2 reports), fake delivery agents. Stay alert and report suspicious activity!";
      }
      
      setChatHistory(prev => [...prev, { from: "ai", message: aiResponse, timestamp: "Just now" }]);
    }, 800);
    
    setChatInput("");
  };

  const handleVerificationResponse = async (requestId, issueId, response) => {
    try {
      // Prepare form data for API call
      const formData = new FormData();
      formData.append('request_id', requestId);
      formData.append('issue_id', issueId);
      formData.append('user_id', currentUser.id);
      formData.append('status', response);
      
      // Add verification media files if any
      const mediaFiles = verificationMedia[requestId] || [];
      mediaFiles.forEach(file => {
        if (file.file) {
          formData.append('media', file.file);
        }
      });
      
      // In a real app, you would make an API call here
      // const response = await fetch('/api/verifications/respond', {
      //   method: 'POST',
      //   body: formData
      // });
      
      // Update local state (mock implementation)
      const updatedRequests = verificationRequests.map(vr => 
        vr.id === requestId ? { ...vr, responded: true } : vr
      );
      setVerificationRequests(updatedRequests);

      const updatedIssues = issues.map(issue => {
        if (issue.id === issueId) {
          const newVerifications = { ...issue.verifications };
          newVerifications.pending = newVerifications.pending.filter(id => id !== currentUser.id);
          
          if (response === "confirmed") {
            newVerifications.confirmed.push(currentUser.id);
          } else {
            newVerifications.denied.push(currentUser.id);
          }

          const mediaText = mediaFiles.length > 0 ? ` (with ${mediaFiles.length} photo${mediaFiles.length > 1 ? 's' : ''})` : '';
          const verificationText = response === "confirmed" ? `✓ Confirmed${mediaText}` : `✗ Not visible${mediaText}`;
          
          issue.comments.push({
            userId: currentUser.id,
            userName: currentUser.name,
            text: verificationText,
            timestamp: new Date().toISOString(),
            isVerification: true
          });

          return { ...issue, verifications: newVerifications };
        }
        return issue;
      });

      setIssues(updatedIssues);
      
      // Clear verification media for this request
      setVerificationMedia(prev => ({
        ...prev,
        [requestId]: []
      }));
      
    } catch (error) {
      console.error('Error submitting verification:', error);
    }
  };

  const handleUpvote = async (issueId) => {
    const updatedIssues = issues.map(issue => {
      if (issue.id === issueId) {
        const upvotes = issue.upvotes.includes(currentUser?.id)
          ? issue.upvotes.filter(id => id !== currentUser.id)
          : [...issue.upvotes, currentUser.id];
        return { ...issue, upvotes };
      }
      return issue;
    });
    setIssues(updatedIssues);
  };

  const getTimeAgo = (timestamp) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  const pendingVerifications = verificationRequests.filter(vr => !vr.responded).length;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-blue-600">Civic AI</h1>
          <p className="text-xs text-gray-600">{currentUser?.area}</p>
        </div>
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-600" />
          <button
            onClick={handleLogout}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="lg:flex lg:h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:w-64 bg-white border-r flex-col">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold">Civic AI</h1>
          <p className="text-sm text-gray-600 mt-1">Local companion</p>
        </div>
        
        <nav className="flex-1 p-4">
          <button
            onClick={() => setCurrentPage("feed")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 ${
              currentPage === "feed" ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Home size={20} />
            <span>Feed</span>
          </button>
          
          <button
            onClick={() => setCurrentPage("ask-ai")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 ${
              currentPage === "ask-ai" ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <MessageCircle size={20} />
            <span>Ask AI</span>
          </button>
          
          <button
            onClick={() => setCurrentPage("notifications")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 relative ${
              currentPage === "notifications" ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Bell size={20} />
            <span>Follow-ups</span>
            {notifications.length > 0 && (
              <span className="absolute right-3 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setCurrentPage("verifications")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 relative ${
              currentPage === "verifications" ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <CheckCircle size={20} />
            <span>Verify</span>
            {pendingVerifications > 0 && (
              <span className="absolute right-3 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {pendingVerifications}
              </span>
            )}
          </button>
        </nav>
        
        <div className="p-4 border-t">
          <div className="text-sm text-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={14} />
              <span>Indiranagar</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={14} />
              <span>5 nearby users</span>
            </div>
          </div>
        </div>
      </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <div className="max-w-4xl mx-auto p-4 lg:p-8">
          
          {/* FEED PAGE */}
          {currentPage === "feed" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold mb-2">Community Feed</h2>
                <p className="text-gray-600">Report and track local issues</p>
              </div>

              <Card className="p-6 shadow-sm">
                <h3 className="font-semibold mb-4">Report Issue</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <MapPin size={16} /> Indiranagar (Auto-detected)
                </div>
                <Textarea
                  placeholder="Describe the issue..."
                  value={reportInput}
                  onChange={(e) => setReportInput(e.target.value)}
                  className="min-h-[100px] mb-4"
                />
                
                {/* File Upload Section */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attach Photos/Videos
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                      <p className="text-sm text-gray-600">
                        Click to upload photos or videos
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, MP4, MOV up to 10MB
                      </p>
                    </label>
                  </div>
                  
                  {/* Uploaded Files Preview */}
                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {uploadedFiles.map(file => (
                        <div key={file.id} className="relative group">
                          <div className="border rounded-lg p-2 bg-gray-50">
                            {file.type.startsWith('image/') ? (
                              <div className="relative">
                                <img 
                                  src={file.url} 
                                  alt={file.name}
                                  className="w-full h-32 object-cover rounded"
                                />
                                <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                  <Image size={12} />
                                  Photo
                                </div>
                              </div>
                            ) : (
                              <div className="relative">
                                <video 
                                  src={file.url}
                                  className="w-full h-32 object-cover rounded"
                                />
                                <div className="absolute top-1 left-1 bg-purple-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                  <Video size={12} />
                                  Video
                                </div>
                              </div>
                            )}
                            <p className="text-xs text-gray-600 mt-1 truncate">{file.name}</p>
                            <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <button
                            onClick={() => removeFile(file.id)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2 flex-wrap">
                    {["potholes", "water", "waste", "streetlights", "scam"].map(cat => (
                      <Button
                        key={cat}
                        size="sm"
                        variant={selectedCategory === cat ? "default" : "outline"}
                        className="rounded-full"
                        onClick={() => setSelectedCategory(cat)}
                      >
                        {cat}
                      </Button>
                    ))}
                  </div>
                  <Button onClick={handleReportIssue} className="bg-blue-600">
                    <Send size={16} className="mr-2" /> Post
                  </Button>
                </div>
              </Card>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Recent Issues</h3>
                {issues.map(issue => (
                  <Card key={issue.id} className="p-6">
                    <div className="mb-3">
                      <div className="flex gap-2 mb-2">
                        <Badge variant="secondary">{issue.status}</Badge>
                        <Badge variant="outline">{issue.category}</Badge>
                        {issue.media && issue.media.length > 0 && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {issue.media.length} {issue.media.length === 1 ? 'file' : 'files'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {issue.userName} • {getTimeAgo(issue.timestamp)}
                      </p>
                      <p className="text-gray-900 mb-3">{issue.text}</p>
                      
                      {/* Media Gallery */}
                      {issue.media && issue.media.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                          {issue.media.map(file => (
                            <div key={file.id} className="relative rounded-lg overflow-hidden">
                              {file.type.startsWith('image/') ? (
                                <img 
                                  src={file.url} 
                                  alt="Issue evidence"
                                  className="w-full h-40 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => window.open(file.url, '_blank')}
                                />
                              ) : (
                                <video 
                                  src={file.url}
                                  controls
                                  className="w-full h-40 object-cover"
                                />
                              )}
                              <div className={`absolute top-2 right-2 text-white text-xs px-2 py-1 rounded ${
                                file.type.startsWith('image/') ? 'bg-blue-500' : 'bg-purple-500'
                              }`}>
                                {file.type.startsWith('image/') ? 'Photo' : 'Video'}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="bg-gray-50 rounded-xl p-3 mb-3">
                      <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <CheckCircle size={16} className="text-green-600" />
                          <span>{issue.verifications.confirmed.length} confirmed</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertTriangle size={16} className="text-orange-500" />
                          <span>{issue.verifications.pending.length} pending</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 py-3 border-t border-b mb-3">
                      <Button size="sm" variant="ghost" onClick={() => handleUpvote(issue.id)}>
                        <ThumbsUp size={16} className={issue.upvotes.includes(currentUser?.id) ? "fill-current" : ""} />
                        <span className="ml-2">{issue.upvotes.length}</span>
                      </Button>
                      <Button size="sm" variant="ghost">
                        <MessageSquare size={16} />
                        <span className="ml-2">{issue.comments.length}</span>
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {issue.comments.map((comment, i) => (
                        <div key={i} className={`text-sm p-3 rounded-xl ${
                          comment.userId === "ai" ? "bg-blue-50" : "bg-gray-50"
                        }`}>
                          <span className="font-semibold">{comment.userName}: </span>
                          <span>{comment.text}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ASK AI PAGE */}
          {currentPage === "ask-ai" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold mb-2">Ask Civic AI</h2>
                <p className="text-gray-600">Get area insights and civic info</p>
              </div>

              <Card className="p-6">
                <div className="space-y-4 mb-6 max-h-[500px] overflow-y-auto">
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-xl rounded-2xl p-4 ${
                        msg.from === "user" ? "bg-blue-600 text-white" : "bg-gray-100"
                      }`}>
                        <p className="whitespace-pre-line">{msg.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask about areas, issues, scams..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendChat()}
                  />
                  <Button onClick={handleSendChat}>
                    <Send size={18} />
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* NOTIFICATIONS PAGE */}
          {currentPage === "notifications" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold mb-2">AI Follow-ups</h2>
                <p className="text-gray-600">AI checking on your reports</p>
              </div>

              <div className="space-y-3">
                {notifications.map(notif => (
                  <Card key={notif.id} className="p-4">
                    <div className="flex gap-3">
                      <Bell className="text-blue-600 mt-1" size={20} />
                      <div className="flex-1">
                        <p>{notif.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{notif.timestamp}</p>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm">Yes, fixed</Button>
                          <Button size="sm" variant="outline">Not yet</Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* VERIFICATIONS PAGE */}
          {currentPage === "verifications" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold mb-2">Verify Issues</h2>
                <p className="text-gray-600">Help confirm nearby reports</p>
              </div>

              <div className="space-y-3">
                {verificationRequests.filter(vr => !vr.responded).map(request => {
                  const issue = issues.find(i => i.id === request.issueId);
                  if (!issue) return null;
                  
                  return (
                    <Card key={request.id} className="p-4 bg-orange-50">
                      <div className="flex gap-3">
                        <AlertTriangle className="text-orange-600 mt-1" size={20} />
                        <div className="flex-1">
                          <p className="font-medium mb-2">{request.message}</p>
                          <div className="bg-white rounded-lg p-3 mb-3 text-sm">
                            <p>{issue.text}</p>
                          </div>
                          
                          {/* Photo/Video Upload Section for Verification */}
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Can you share a photo/video as evidence? (Optional)
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-3 text-center hover:border-orange-400 transition-colors">
                              <input
                                type="file"
                                multiple
                                accept="image/*,video/*"
                                onChange={(e) => handleVerificationFileUpload(request.id, e)}
                                className="hidden"
                                id={`verification-upload-${request.id}`}
                              />
                              <label htmlFor={`verification-upload-${request.id}`} className="cursor-pointer">
                                <Upload className="mx-auto text-gray-400 mb-1" size={24} />
                                <p className="text-xs text-gray-600">
                                  Add photos/videos to support your verification
                                </p>
                              </label>
                            </div>
                            
                            {/* Uploaded Verification Files Preview */}
                            {verificationMedia[request.id] && verificationMedia[request.id].length > 0 && (
                              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {verificationMedia[request.id].map(file => (
                                  <div key={file.id} className="relative group">
                                    <div className="border rounded-lg p-2 bg-gray-50">
                                      {file.type.startsWith('image/') ? (
                                        <div className="relative">
                                          <img 
                                            src={file.url} 
                                            alt={file.name}
                                            className="w-full h-20 object-cover rounded"
                                          />
                                          <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded flex items-center gap-1">
                                            <Image size={10} alt="" />
                                            Photo
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="relative">
                                          <video 
                                            src={file.url}
                                            className="w-full h-20 object-cover rounded"
                                          />
                                          <div className="absolute top-1 left-1 bg-purple-500 text-white text-xs px-1 py-0.5 rounded flex items-center gap-1">
                                            <Video size={10} alt="" />
                                            Video
                                          </div>
                                        </div>
                                      )}
                                      <p className="text-xs text-gray-600 mt-1 truncate">{file.name}</p>
                                    </div>
                                    <button
                                      onClick={() => removeVerificationFile(request.id, file.id)}
                                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X size={10} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              className="bg-green-600"
                              onClick={() => handleVerificationResponse(request.id, issue.id, "confirmed")}
                            >
                              ✓ Yes, I see it
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleVerificationResponse(request.id, issue.id, "denied")}
                            >
                              ✗ No
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
                {pendingVerifications === 0 && (
                  <Card className="p-8 text-center">
                    <CheckCircle className="mx-auto text-green-500 mb-2" size={48} />
                    <p className="text-gray-500">All caught up!</p>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-2">
        <div className="flex justify-around">
          <button
            onClick={() => setCurrentPage("feed")}
            className={`flex flex-col items-center p-2 rounded-lg ${
              currentPage === "feed" ? "text-blue-600" : "text-gray-600"
            }`}
          >
            <Home size={20} />
            <span className="text-xs mt-1">Feed</span>
          </button>
          
          <button
            onClick={() => setCurrentPage("report")}
            className={`flex flex-col items-center p-2 rounded-lg ${
              currentPage === "report" ? "text-orange-600" : "text-gray-600"
            }`}
          >
            <AlertTriangle size={20} />
            <span className="text-xs mt-1">Report</span>
          </button>
          
          <button
            onClick={() => setCurrentPage("verify")}
            className={`flex flex-col items-center p-2 rounded-lg relative ${
              currentPage === "verify" ? "text-green-600" : "text-gray-600"
            }`}
          >
            <CheckCircle size={20} />
            <span className="text-xs mt-1">Verify</span>
            {pendingVerifications > 0 && (
              <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {pendingVerifications}
              </div>
            )}
          </button>
          
          <button
            onClick={() => setCurrentPage("chat")}
            className={`flex flex-col items-center p-2 rounded-lg ${
              currentPage === "chat" ? "text-purple-600" : "text-gray-600"
            }`}
          >
            <MessageCircle size={20} />
            <span className="text-xs mt-1">Chat</span>
          </button>
        </div>
      </div>
    </div>
  );
}