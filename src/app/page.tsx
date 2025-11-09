'use client';

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MapPin, Send, MessageSquare, ThumbsUp, CheckCircle, AlertTriangle, Bell, Users, Home, MessageCircle, Upload, X, Image, Video, LogOut, Menu } from "lucide-react";
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
  media?: UploadedFile[];
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
  file?: File;
}

export default function CivicAIPlatform() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState("feed");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
      const sampleIssues: Issue[] = [
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
            positive: 3,
            negative: 0,
            details: [
              { userId: "user3", response: "confirmed", media: [] },
              { userId: "user4", response: "confirmed", media: [] }
            ]
          },
          aiFollowUpScheduled: true
        }
      ];
      setIssues(sampleIssues);

      const sampleRequests: VerificationRequest[] = [
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const fileData = files.map(file => ({
      id: Math.random().toString(36).slice(2),
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file),
      file: file
    }));
    setUploadedFiles(prev => [...prev, ...fileData]);
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleVerificationFileUpload = (requestId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const fileData = files.map(file => ({
      id: Math.random().toString(36).slice(2),
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file),
      file: file
    }));
    
    setVerificationMedia(prev => ({
      ...prev,
      [requestId]: [...(prev[requestId] || []), ...fileData]
    }));
  };

  const removeVerificationFile = (requestId: string, fileId: string) => {
    setVerificationMedia(prev => ({
      ...prev,
      [requestId]: prev[requestId]?.filter(f => f.id !== fileId) || []
    }));
  };

  const handleReportIssue = async () => {
    if (!reportInput.trim() || !currentUser) return;
    
    const newIssue: Issue = {
      id: `i${Date.now()}`,
      category: selectedCategory,
      area: currentUser.area,
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
      verifications: { 
        positive: 0, 
        negative: 0, 
        details: [] 
      },
      aiFollowUpScheduled: true
    };

    setIssues(prev => [newIssue, ...prev]);
    setReportInput("");
    setUploadedFiles([]);
  };

  const handleVerificationResponse = async (requestId: string, response: string) => {
    if (!currentUser) return;

    try {
      // Update local state
      setVerificationRequests(prev => 
        prev.map(req => req.id === requestId ? { ...req, responded: true } : req)
      );

      // Clear media for this request
      setVerificationMedia(prev => {
        const updated = { ...prev };
        delete updated[requestId];
        return updated;
      });
    } catch (error) {
      console.error('Failed to submit verification:', error);
    }
  };

  const handleUpvote = async (issueId: string) => {
    if (!currentUser) return;

    const updatedIssues = issues.map(issue => {
      if (issue.id === issueId) {
        const upvotes = issue.upvotes.includes(currentUser.id)
          ? issue.upvotes.filter(id => id !== currentUser.id)
          : [...issue.upvotes, currentUser.id];
        return { ...issue, upvotes };
      }
      return issue;
    });
    setIssues(updatedIssues);
  };

  const getTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  const pendingVerifications = verificationRequests.filter(vr => !vr.responded).length;

  // Show authentication page if not logged in
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AuthPage onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const navigationItems = [
    { key: "feed", label: "Feed", icon: Home, color: "blue" },
    { key: "report", label: "Report", icon: AlertTriangle, color: "orange", badge: "!" },
    { key: "verify", label: "Verify", icon: CheckCircle, color: "green", count: pendingVerifications },
    { key: "chat", label: "AI Chat", icon: MessageCircle, color: "purple" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar & Mobile Overlay */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-blue-600">Civic AI</h1>
                <p className="text-sm text-gray-600 mt-1">Local companion</p>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden p-2 rounded-md hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setCurrentPage(item.key);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    currentPage === item.key 
                      ? `bg-${item.color}-50 text-${item.color}-700 font-medium` 
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={20} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <Badge className={`bg-${item.color}-100 text-${item.color}-800`}>
                      {item.badge}
                    </Badge>
                  )}
                  {item.count && item.count > 0 && (
                    <Badge className={`bg-${item.color}-100 text-${item.color}-800`}>
                      {item.count}
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>
          
          {/* User Info */}
          <div className="p-4 border-t">
            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={14} />
                <span className="text-sm">{currentUser?.area}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={14} />
                  <span className="text-sm">5 nearby users</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1 text-gray-600 hover:bg-gray-200 rounded"
                >
                  <LogOut size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 rounded-md hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-lg font-bold text-blue-600">Civic AI</h1>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-600" />
            <button
              onClick={handleLogout}
              className="p-2 -mr-2 rounded-md hover:bg-gray-100"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-4 lg:p-8 pb-20 lg:pb-8">
            
            {/* FEED PAGE */}
            {currentPage === "feed" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl lg:text-3xl font-bold mb-2">Community Feed</h2>
                  <p className="text-gray-600">Report and track local issues</p>
                </div>

                {/* Quick Report Card */}
                <Card className="p-4 lg:p-6 shadow-sm">
                  <h3 className="font-semibold mb-4">Report Issue</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <MapPin size={16} /> {currentUser?.area}
                  </div>
                  <Textarea
                    placeholder="Describe the issue..."
                    value={reportInput}
                    onChange={(e) => setReportInput(e.target.value)}
                    className="min-h-[100px] mb-4"
                  />
                  
                  {/* Category & Upload */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="potholes">Potholes & Roads</option>
                      <option value="safety">Safety & Security</option>
                      <option value="cleanliness">Cleanliness</option>
                      <option value="utilities">Utilities</option>
                    </select>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Upload size={16} />
                      <span className="text-sm">Add photos/videos</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Uploaded Files */}
                  {uploadedFiles.length > 0 && (
                    <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                                  Photo
                                </div>
                              </div>
                            ) : (
                              <div className="relative">
                                <video 
                                  src={file.url}
                                  className="w-full h-32 object-cover rounded"
                                />
                                <div className="absolute top-1 left-1 bg-purple-500 text-white text-xs px-2 py-1 rounded">
                                  Video
                                </div>
                              </div>
                            )}
                            <p className="text-xs text-gray-600 mt-1 truncate">{file.name}</p>
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

                  <Button 
                    onClick={handleReportIssue}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={!reportInput.trim()}
                  >
                    Submit Report
                  </Button>
                </Card>

                {/* Issues Feed */}
                <div className="space-y-4">
                  {issues.map(issue => (
                    <Card key={issue.id} className="p-4 lg:p-6">
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline">{issue.category}</Badge>
                        <Badge variant={issue.status === "open" ? "destructive" : "default"}>
                          {issue.status}
                        </Badge>
                        {issue.media && issue.media.length > 0 && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {issue.media.length} {issue.media.length === 1 ? 'file' : 'files'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {issue.userName} • {getTimeAgo(issue.timestamp)} • {issue.area}
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

                      {/* Verification Status */}
                      <div className="bg-gray-50 rounded-xl p-3 mb-3">
                        <div className="flex gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <CheckCircle size={16} className="text-green-600" />
                            <span>{issue.verifications.positive} confirmed</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <X size={16} className="text-red-600" />
                            <span>{issue.verifications.negative} denied</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-4 pt-3 border-t">
                        <button 
                          onClick={() => handleUpvote(issue.id)}
                          className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                            issue.upvotes.includes(currentUser?.id || "")
                              ? "bg-blue-100 text-blue-700"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          <ThumbsUp size={16} />
                          <span>{issue.upvotes.length}</span>
                        </button>
                        <button className="flex items-center gap-1 px-3 py-1 rounded-full text-sm text-gray-600 hover:bg-gray-100">
                          <MessageSquare size={16} />
                          <span>{issue.comments.length}</span>
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* REPORT PAGE */}
            {currentPage === "report" && (
              <div className="space-y-6">
                <h2 className="text-2xl lg:text-3xl font-bold">Report an Issue</h2>
                {/* Report form content here */}
                <Card className="p-6">
                  <p className="text-gray-600">Detailed reporting interface coming soon...</p>
                </Card>
              </div>
            )}

            {/* VERIFY PAGE */}
            {currentPage === "verify" && (
              <div className="space-y-6">
                <h2 className="text-2xl lg:text-3xl font-bold">Verification Requests</h2>
                {verificationRequests.length === 0 ? (
                  <Card className="p-8 text-center">
                    <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
                    <p className="text-gray-500">All caught up! No verification requests.</p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {verificationRequests.map(request => (
                      <Card key={request.id} className="p-6">
                        <div className="mb-4">
                          <p className="font-medium text-gray-800">{request.message}</p>
                          <p className="text-sm text-gray-500 mt-1">{getTimeAgo(request.timestamp)}</p>
                        </div>

                        {!request.responded && (
                          <div className="space-y-4">
                            {/* Photo/Video Upload */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Can you share a photo/video as evidence? (Optional)
                              </label>
                              <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-400 transition-colors">
                                <input
                                  type="file"
                                  multiple
                                  accept="image/*,video/*"
                                  onChange={(e) => handleVerificationFileUpload(request.id, e)}
                                  className="hidden"
                                  id={`verification-upload-${request.id}`}
                                />
                                <label htmlFor={`verification-upload-${request.id}`} className="cursor-pointer">
                                  <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                                  <p className="text-sm text-gray-600">
                                    Add photos/videos to support your verification
                                  </p>
                                </label>
                              </div>
                              
                              {/* Uploaded Files Preview */}
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
                                              <Image size={10} />
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
                                              <Video size={10} />
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
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                onClick={() => handleVerificationResponse(request.id, "confirmed")}
                              >
                                ✓ Yes, I see it
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                                onClick={() => handleVerificationResponse(request.id, "denied")}
                              >
                                ✗ No, it's not there
                              </Button>
                            </div>
                          </div>
                        )}

                        {request.responded && (
                          <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-green-800 text-sm font-medium">✓ Response submitted</p>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CHAT PAGE */}
            {currentPage === "chat" && (
              <div className="space-y-6">
                <h2 className="text-2xl lg:text-3xl font-bold">AI Assistant</h2>
                
                <Card className="flex flex-col h-96">
                  <div className="flex-1 p-4 overflow-y-auto">
                    {chatHistory.map((chat, index) => (
                      <div key={index} className={`mb-4 ${chat.from === 'user' ? 'text-right' : 'text-left'}`}>
                        <div className={`inline-block p-3 rounded-lg max-w-xs lg:max-w-md ${
                          chat.from === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="text-sm">{chat.message}</p>
                          <p className={`text-xs mt-1 ${
                            chat.from === 'user' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {chat.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask about your area..."
                        className="flex-1"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            // Handle chat submission
                          }
                        }}
                      />
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Send size={16} />
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t safe-area-pb">
        <div className="flex justify-around py-2">
          {navigationItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => setCurrentPage(item.key)}
                className={`flex flex-col items-center p-2 rounded-lg relative transition-colors ${
                  currentPage === item.key ? `text-${item.color}-600` : "text-gray-600"
                }`}
              >
                <Icon size={20} />
                <span className="text-xs mt-1">{item.label}</span>
                {item.count && item.count > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {item.count}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}