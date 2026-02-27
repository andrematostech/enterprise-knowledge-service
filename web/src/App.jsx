
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FiBarChart2,
  FiDatabase,
  FiFileText,
  FiGrid,
  FiHome,
  FiInbox,
  FiLayers,
  FiMessageCircle,
  FiSearch,
  FiSettings,
  FiUser
} from "react-icons/fi";
import AppShell from "./components/AppShell.jsx";
import Drawer from "./components/Drawer.jsx";
import Panel from "./components/Panel.jsx";
import EmptyState from "./components/EmptyState.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Documents from "./pages/Documents.jsx";
import Query from "./pages/Query.jsx";
import Inbox from "./pages/Inbox.jsx";
import Usage from "./pages/Usage.jsx";
import Settings from "./pages/Settings.jsx";
import Account from "./pages/Account.jsx";
import { apiRequest, buildHeaders, extractDetail } from "./lib/api.js";
import { formatDateTime, getInitials } from "./lib/format.js";
import { getStorageNumber, setStorageNumber } from "./lib/storage.js";
import logo from "./assets/logo.png";

const defaultBaseUrl = "http://127.0.0.1:8000";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [baseUrl, setBaseUrl] = useState(() => localStorage.getItem("baseUrl") || defaultBaseUrl);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("apiKey") || "changeme");
  const [token, setToken] = useState(() => localStorage.getItem("kivo_token") || "");
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [registerName, setRegisterName] = useState("");
  const [registerPosition, setRegisterPosition] = useState("");
  const [registerAvatarFile, setRegisterAvatarFile] = useState(null);
  const [registerAvatarPreview, setRegisterAvatarPreview] = useState("");

  const [kbId, setKbId] = useState(() => localStorage.getItem("kbId") || "");
  const [kbList, setKbList] = useState([]);
  const [kbLoading, setKbLoading] = useState(false);
  const [kbError, setKbError] = useState("");
  const [kbName, setKbName] = useState("");
  const [kbDescription, setKbDescription] = useState("");
  const [kbCreating, setKbCreating] = useState(false);

  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [docSearch, setDocSearch] = useState("");

  const [question, setQuestion] = useState("");
  const [topK, setTopK] = useState(5);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastLatencyMs, setLastLatencyMs] = useState(() => getStorageNumber("lastLatencyMs", 0));
  const [avgLatencyMs, setAvgLatencyMs] = useState(() => getStorageNumber("avgLatencyMs", 0));
  const [queryCount, setQueryCount] = useState(() => getStorageNumber("queryCount", 0));
  const [lastIngestAt, setLastIngestAt] = useState(() => localStorage.getItem("lastIngestAt") || "");
  const [dashboardRange, setDashboardRange] = useState("7d");
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [queryVolumeData, setQueryVolumeData] = useState([]);
  const [queryVolumeLoading, setQueryVolumeLoading] = useState(false);
  const [recentQueriesData, setRecentQueriesData] = useState([]);
  const [recentIngestsData, setRecentIngestsData] = useState([]);

  const [inboxMessages, setInboxMessages] = useState([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxError, setInboxError] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [composeScope, setComposeScope] = useState("direct");
  const [composeRecipient, setComposeRecipient] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [inboxFilter, setInboxFilter] = useState("all");

  const [healthStatus, setHealthStatus] = useState("Unknown");
  const [healthLoading, setHealthLoading] = useState(false);

  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [announcementsOpen, setAnnouncementsOpen] = useState(false);
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem("themeMode") || "dark");
  const [globalSearch, setGlobalSearch] = useState("");
  const [utilitiesOpen, setUtilitiesOpen] = useState(false);

  const [toasts, setToasts] = useState([]);

  const fileInputRef = useRef(null);

  const pushToast = (type, message) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3500);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  useEffect(() => {
    localStorage.setItem("baseUrl", baseUrl || "");
    localStorage.setItem("apiKey", apiKey || "");
    localStorage.setItem("kivo_token", token || "");
    localStorage.setItem("kbId", kbId || "");
    if (lastIngestAt) localStorage.setItem("lastIngestAt", lastIngestAt);
    setStorageNumber("lastLatencyMs", lastLatencyMs);
    setStorageNumber("avgLatencyMs", avgLatencyMs);
    setStorageNumber("queryCount", queryCount);
    localStorage.setItem("themeMode", themeMode);
  }, [baseUrl, apiKey, token, kbId, lastIngestAt, lastLatencyMs, avgLatencyMs, queryCount, themeMode]);

  useEffect(() => {
    document.body.classList.toggle("theme-light", themeMode === "light");
  }, [themeMode]);

  const authReady = Boolean(apiKey || token);
  const settingsIncomplete = !baseUrl || !authReady;
  const kbMissing = !kbId;

  const calendarMonthKey = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = String(calendarMonth.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }, [calendarMonth]);

  const fetchMe = async () => {
    if (!token) return;
    setAuthLoading(true);
    try {
      const { res, data } = await apiRequest({
        baseUrl,
        path: "/api/v1/auth/me",
        headers: buildHeaders({ token, includeApiKey: false })
      });
      if (!res.ok) throw new Error(extractDetail(data) || "Authentication failed");
      setCurrentUser(data);
      return data;
    } catch (err) {
      pushToast("error", err.message || "Session expired");
      setToken("");
      setCurrentUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchAdminUsers = async () => {
    if (!token) return;
    setAdminUsersLoading(true);
    try {
      const { res, data } = await apiRequest({
        baseUrl,
        path: "/api/v1/auth/users",
        headers: buildHeaders({ token, includeApiKey: false })
      });
      if (!res.ok) throw new Error(extractDetail(data) || "Failed to load users");
      setAdminUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      pushToast("error", err.message || "Failed to load users");
    } finally {
      setAdminUsersLoading(false);
    }
  };

  const handleLogout = () => {
    setToken("");
    setCurrentUser(null);
    pushToast("success", "Logged out.");
  };

  const handleDeleteAccount = async () => {
    if (!token || !currentUser?.id) return;
    const confirmed = window.confirm("Delete this account? This cannot be undone.");
    if (!confirmed) return;
    try {
      const { res, data } = await apiRequest({
        baseUrl,
        path: `/api/v1/auth/users/${currentUser.id}`,
        method: "DELETE",
        headers: buildHeaders({ token, includeApiKey: false })
      });
      if (!res.ok) throw new Error(extractDetail(data) || "Failed to delete account");
      pushToast("success", "Account deleted.");
      handleLogout();
    } catch (err) {
      pushToast("error", err.message || "Failed to delete account");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!token) return;
    const confirmed = window.confirm("Delete this user? This cannot be undone.");
    if (!confirmed) return;
    try {
      const { res, data } = await apiRequest({
        baseUrl,
        path: `/api/v1/auth/users/${userId}`,
        method: "DELETE",
        headers: buildHeaders({ token, includeApiKey: false })
      });
      if (!res.ok) throw new Error(extractDetail(data) || "Failed to delete user");
      setAdminUsers((prev) => prev.filter((user) => user.id !== userId));
      pushToast("success", "User deleted.");
      if (currentUser?.id === userId) {
        handleLogout();
      }
    } catch (err) {
      pushToast("error", err.message || "Failed to delete user");
    }
  };

  const handleToggleAdmin = async (userId, nextAdmin) => {
    if (!token) return;
    try {
      const { res, data } = await apiRequest({
        baseUrl,
        path: `/api/v1/auth/users/${userId}/role`,
        method: "PATCH",
        headers: buildHeaders({ token, includeApiKey: false, json: true }),
        body: JSON.stringify({ is_admin: nextAdmin })
      });
      if (!res.ok) throw new Error(extractDetail(data) || "Failed to update role");
      setAdminUsers((prev) =>
        prev.map((user) => (user.id === userId ? { ...user, is_admin: nextAdmin } : user))
      );
      if (currentUser?.id === userId) {
        setCurrentUser((prev) => (prev ? { ...prev, is_admin: nextAdmin } : prev));
      }
      pushToast("success", "Role updated.");
    } catch (err) {
      pushToast("error", err.message || "Failed to update role");
    }
  };

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      pushToast("error", "Email and password are required.");
      return;
    }
    setAuthLoading(true);
    try {
      const { res, data } = await apiRequest({
        baseUrl,
        path: "/api/v1/auth/login",
        method: "POST",
        headers: buildHeaders({ json: true, includeAuth: false, includeApiKey: false }),
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      if (!res.ok) throw new Error(extractDetail(data) || "Login failed");
      setToken(data.access_token);
      setLoginPassword("");
      pushToast("success", "Logged in.");
    } catch (err) {
      pushToast("error", err.message || "Login failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      if (!file) return resolve("");
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  const handleRegister = async () => {
    if (!registerEmail || !registerPassword) {
      pushToast("error", "Email and password are required.");
      return;
    }
    setAuthLoading(true);
    try {
      const avatarUrl = registerAvatarFile ? await readFileAsDataUrl(registerAvatarFile) : undefined;
      const { res, data } = await apiRequest({
        baseUrl,
        path: "/api/v1/auth/register",
        method: "POST",
        headers: buildHeaders({ json: true, includeAuth: false, includeApiKey: false }),
        body: JSON.stringify({
          email: registerEmail,
          password: registerPassword,
          full_name: registerName || undefined,
          position: registerPosition || undefined,
          avatar_url: avatarUrl || undefined
        })
      });
      if (!res.ok) throw new Error(extractDetail(data) || "Registration failed");
      pushToast("success", "Account created. Please log in.");
      setRegisterPassword("");
      setRegisterAvatarFile(null);
      setRegisterAvatarPreview("");
    } catch (err) {
      pushToast("error", err.message || "Registration failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchInbox = async () => {
    if (!token) return;
    setInboxLoading(true);
    setInboxError("");
    try {
      const { res, data } = await apiRequest({
        baseUrl,
        path: "/api/v1/messages/inbox",
        headers: buildHeaders({ token, includeApiKey: false })
      });
      if (!res.ok) throw new Error(extractDetail(data) || "Failed to load inbox");
      const list = Array.isArray(data) ? data : data.items || [];
      setInboxMessages(list);
    } catch (err) {
      setInboxError(err.message || "Failed to load inbox");
    } finally {
      setInboxLoading(false);
    }
  };

  const fetchCalendarEvents = async () => {
    if (!token) return;
    setCalendarLoading(true);
    try {
      const { res, data } = await apiRequest({
        baseUrl,
        path: `/api/v1/calendar/events?month=${calendarMonthKey}`,
        headers: buildHeaders({ token, includeApiKey: false })
      });
      if (!res.ok) throw new Error(extractDetail(data) || "Failed to load calendar");
      setCalendarEvents(Array.isArray(data) ? data : []);
      setCalendarError("");
    } catch (err) {
      setCalendarError(err.message || "Failed to load calendar");
    } finally {
      setCalendarLoading(false);
    }
  };

  const createCalendarEvent = async (payload) => {
    if (!token) return;
    try {
      const { res, data } = await apiRequest({
        baseUrl,
        path: "/api/v1/calendar/events",
        method: "POST",
        headers: buildHeaders({ token, includeApiKey: false, json: true }),
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(extractDetail(data) || "Failed to create event");
      setCalendarEvents((prev) =>
        [...prev, data].sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")))
      );
      return data;
    } catch (err) {
      pushToast("error", err.message || "Failed to create event");
      return null;
    }
  };

  const updateCalendarEvent = async (eventId, payload) => {
    if (!token) return;
    try {
      const { res, data } = await apiRequest({
        baseUrl,
        path: `/api/v1/calendar/events/${eventId}`,
        method: "PATCH",
        headers: buildHeaders({ token, includeApiKey: false, json: true }),
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(extractDetail(data) || "Failed to update event");
      setCalendarEvents((prev) => prev.map((event) => (event.id === eventId ? data : event)));
      return data;
    } catch (err) {
      pushToast("error", err.message || "Failed to update event");
      return null;
    }
  };

  const deleteCalendarEvent = async (eventId) => {
    if (!token) return;
    try {
      const { res, data } = await apiRequest({
        baseUrl,
        path: `/api/v1/calendar/events/${eventId}`,
        method: "DELETE",
        headers: buildHeaders({ token, includeApiKey: false })
      });
      if (!res.ok) throw new Error(extractDetail(data) || "Failed to delete event");
      setCalendarEvents((prev) => prev.filter((event) => event.id !== eventId));
      return data;
    } catch (err) {
      pushToast("error", err.message || "Failed to delete event");
      return null;
    }
  };

  const handleSendMessage = async () => {
    if (!token) {
      pushToast("error", "Login required to send messages.");
      return;
    }
    if (composeScope === "direct" && !composeRecipient) {
      pushToast("error", "Recipient email is required.");
      return;
    }
    if (!composeBody.trim()) {
      pushToast("error", "Message body is required.");
      return;
    }
    try {
      const { res, data } = await apiRequest({
        baseUrl,
        path: "/api/v1/messages",
        method: "POST",
        headers: buildHeaders({ json: true, token, includeApiKey: false }),
        body: JSON.stringify({
          scope: composeScope,
          recipient_email: composeScope === "direct" ? composeRecipient : undefined,
          subject: composeSubject || undefined,
          body: composeBody
        })
      });
      if (!res.ok) throw new Error(extractDetail(data) || "Failed to send message");
      setComposeSubject("");
      setComposeBody("");
      setComposeRecipient("");
      pushToast("success", "Message sent.");
      await fetchInbox();
    } catch (err) {
      pushToast("error", err.message || "Failed to send message");
    }
  };

  const handleMarkRead = async (messageId) => {
    if (!token) return;
    try {
      const { res, data } = await apiRequest({
        baseUrl,
        path: `/api/v1/messages/${messageId}/read`,
        method: "POST",
        headers: buildHeaders({ token, includeApiKey: false })
      });
      if (!res.ok) throw new Error(extractDetail(data) || "Failed to mark as read");
      await fetchInbox();
    } catch (err) {
      pushToast("error", err.message || "Failed to mark as read");
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!token) return;
    try {
      const { res, data } = await apiRequest({
        baseUrl,
        path: `/api/v1/messages/${messageId}`,
        method: "DELETE",
        headers: buildHeaders({ token, includeApiKey: false })
      });
      if (!res.ok) throw new Error(extractDetail(data) || "Failed to delete message");
      setInboxMessages((prev) => prev.filter((message) => message.id !== messageId));
      setSelectedMessage((prev) => (prev?.id === messageId ? null : prev));
      pushToast("success", "Message deleted.");
    } catch (err) {
      pushToast("error", err.message || "Failed to delete message");
    }
  };

  const fetchKnowledgeBases = async () => {
    if (!baseUrl || !apiKey) return;
    setKbLoading(true);
    setKbError("");
    try {
      const { res, data } = await apiRequest({
        baseUrl,
        path: "/api/v1/knowledge-bases",
        headers: buildHeaders({ apiKey })
      });
      if (!res.ok) throw new Error(extractDetail(data) || "Failed to load knowledge bases");
      const list = Array.isArray(data) ? data : data.items || [];
      setKbList(list);
      const hasUserSelection = localStorage.getItem("kbSelectedByUser") === "true";
      if (!kbId && list.length && !hasUserSelection) {
        setKbId(list[0].id);
      }
    } catch (err) {
      setKbError(err.message || "Failed to load knowledge bases");
    } finally {
      setKbLoading(false);
    }
  };

  const fetchDocuments = async () => {
    if (!baseUrl || !apiKey || !kbId) return;
    setDocsLoading(true);
    setDocsError("");
    try {
      const { res, data } = await apiRequest({
        baseUrl,
        path: `/api/v1/knowledge-bases/${kbId}/documents`,
        headers: buildHeaders({ apiKey })
      });
      if (!res.ok) throw new Error(extractDetail(data) || "Failed to load documents");
      const list = Array.isArray(data) ? data : data.items || [];
      setDocuments(list);
    } catch (err) {
      setDocsError(err.message || "Failed to load documents");
    } finally {
      setDocsLoading(false);
    }
  };

  const fetchOverview = async () => {
    if (!baseUrl || !authReady) return;
    setOverviewLoading(true);
    try {
      const { res, data } = await apiRequest({
        baseUrl,
        path: `/api/v1/workspace/overview?range=${dashboardRange}`,
        headers: buildHeaders({ apiKey, token })
      });
      if (!res.ok) throw new Error(extractDetail(data) || "Failed to load overview");
      setOverview(data);
    } catch (err) {
      pushToast("error", err.message || "Failed to load overview");
    } finally {
      setOverviewLoading(false);
    }
  };

  const fetchQueryVolume = async () => {
    if (!baseUrl || !authReady || !kbId) {
      setQueryVolumeData([]);
      return;
    }
    setQueryVolumeLoading(true);
    try {
      const { res, data } = await apiRequest({
        baseUrl,
        path: `/api/v1/knowledge-bases/${kbId}/analytics/query-volume?range=${dashboardRange}&bucket=day`,
        headers: buildHeaders({ apiKey, token })
      });
      if (!res.ok) throw new Error(extractDetail(data) || "Failed to load query volume");
      setQueryVolumeData(Array.isArray(data) ? data : []);
    } catch (err) {
      pushToast("error", err.message || "Failed to load query volume");
    } finally {
      setQueryVolumeLoading(false);
    }
  };

  const fetchRecentQueries = async () => {
    if (!baseUrl || !authReady || !kbId) {
      setRecentQueriesData([]);
      return;
    }
    try {
      const { res, data } = await apiRequest({
        baseUrl,
        path: `/api/v1/knowledge-bases/${kbId}/analytics/recent-queries?limit=10`,
        headers: buildHeaders({ apiKey, token })
      });
      if (!res.ok) throw new Error(extractDetail(data) || "Failed to load recent queries");
      setRecentQueriesData(Array.isArray(data) ? data : []);
    } catch (err) {
      pushToast("error", err.message || "Failed to load recent queries");
    }
  };

  const fetchRecentIngests = async () => {
    if (!baseUrl || !authReady || !kbId) {
      setRecentIngestsData([]);
      return;
    }
    try {
      const { res, data } = await apiRequest({
        baseUrl,
        path: `/api/v1/knowledge-bases/${kbId}/analytics/recent-ingests?limit=10`,
        headers: buildHeaders({ apiKey, token })
      });
      if (!res.ok) throw new Error(extractDetail(data) || "Failed to load recent ingests");
      setRecentIngestsData(Array.isArray(data) ? data : []);
    } catch (err) {
      pushToast("error", err.message || "Failed to load recent ingests");
    }
  };

  const runQuery = async () => {
    setError("");
    setResponse(null);
    if (!kbId) {
      setError("Please select a knowledge base in Settings.");
      return;
    }
    if (!question.trim()) {
      setError("Please enter a question.");
      return;
    }
    setLoading(true);
    const start = performance.now();
    try {
      const { res, data } = await apiRequest({
        baseUrl,
        path: `/api/v1/knowledge-bases/${kbId}/query`,
        method: "POST",
        headers: buildHeaders({ apiKey, token, json: true }),
        body: JSON.stringify({ question, top_k: Number(topK) || 5 })
      });
      if (!res.ok) throw new Error(extractDetail(data) || "Request failed");
      setResponse(data);
      const latency = Math.round(performance.now() - start);
      const nextCount = queryCount + 1;
      const nextAvg = Math.round((avgLatencyMs * queryCount + latency) / nextCount);
      setQueryCount(nextCount);
      setLastLatencyMs(latency);
      setAvgLatencyMs(nextAvg);
      pushToast("success", "Answer ready.");
      fetchRecentQueries();
      fetchOverview();
      fetchQueryVolume();
    } catch (err) {
      setError(err.message || "Query failed");
      pushToast("error", err.message || "Query failed");
    } finally {
      setLoading(false);
    }
  };

  const createKnowledgeBase = async () => {
    if (!kbName.trim()) return;
    setKbCreating(true);
    setKbError("");
    try {
      const { res, data } = await apiRequest({
        baseUrl,
        path: "/api/v1/knowledge-bases",
        method: "POST",
        headers: buildHeaders({ apiKey, token, json: true }),
        body: JSON.stringify({ name: kbName.trim(), description: kbDescription.trim() || undefined })
      });
      if (!res.ok) throw new Error(extractDetail(data) || "Failed to create knowledge base");
      setKbName("");
      setKbDescription("");
      localStorage.setItem("kbSelectedByUser", "true");
      await fetchKnowledgeBases();
      if (data?.id) setKbId(data.id);
      pushToast("success", "Knowledge base created.");
    } catch (err) {
      setKbError(err.message || "Failed to create knowledge base");
      pushToast("error", err.message || "Failed to create knowledge base");
    } finally {
      setKbCreating(false);
    }
  };

  const handleUpload = async (files) => {
    if (!files || !files.length) return;
    if (!kbId) {
      setDocsError("Select or create a knowledge base in Settings.");
      return;
    }
    setUploading(true);
    setDocsError("");
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const { res, data } = await apiRequest({
          baseUrl,
          path: `/api/v1/knowledge-bases/${kbId}/documents`,
          method: "POST",
          headers: buildHeaders({ apiKey, token }),
          body: formData
        });
        if (!res.ok) throw new Error(extractDetail(data) || `Failed to upload ${file.name}`);
      }
      await fetchDocuments();
      if (fileInputRef.current) fileInputRef.current.value = "";
      pushToast("success", "Documents uploaded.");
    } catch (err) {
      setDocsError(err.message || "Upload failed");
      pushToast("error", err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!kbId) return;
    const confirmed = window.confirm("Delete this document?");
    if (!confirmed) return;
    setDeletingId(docId);
    try {
      const { res, data } = await apiRequest({
        baseUrl,
        path: `/api/v1/knowledge-bases/${kbId}/documents/${docId}`,
        method: "DELETE",
        headers: buildHeaders({ apiKey, token })
      });
      if (!res.ok) throw new Error(extractDetail(data) || "Delete failed");
      await fetchDocuments();
      pushToast("success", "Document deleted.");
    } catch (err) {
      setDocsError(err.message || "Delete failed");
      pushToast("error", err.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const handleIngest = async () => {
    if (!kbId) return;
    setIngesting(true);
    setDocsError("");
    try {
      const { res, data } = await apiRequest({
        baseUrl,
        path: `/api/v1/knowledge-bases/${kbId}/ingest`,
        method: "POST",
        headers: buildHeaders({ apiKey, token })
      });
      if (!res.ok) throw new Error(extractDetail(data) || "Ingestion failed");
      const nowIso = new Date().toISOString();
      setLastIngestAt(nowIso);
      await fetchDocuments();
      fetchRecentIngests();
      fetchOverview();
      pushToast("success", "Ingestion started.");
    } catch (err) {
      setDocsError(err.message || "Ingestion failed");
      pushToast("error", err.message || "Ingestion failed");
    } finally {
      setIngesting(false);
    }
  };

  const handleHealthCheck = async () => {
    if (!baseUrl) return;
    setHealthLoading(true);
    try {
      const { res } = await apiRequest({ baseUrl, path: "/health" });
      setHealthStatus(res.ok ? "Connected" : "Error");
    } catch (err) {
      setHealthStatus("Error");
    } finally {
      setHealthLoading(false);
    }
  };

  const handleRegisterAvatar = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setRegisterAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setRegisterAvatarPreview(reader.result || "");
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (baseUrl && (apiKey || token)) fetchKnowledgeBases();
  }, [baseUrl, apiKey, token]);

  useEffect(() => {
    if (baseUrl && (apiKey || token) && kbId) fetchDocuments();
  }, [baseUrl, apiKey, token, kbId]);

  useEffect(() => {
    if (baseUrl && authReady) fetchOverview();
  }, [baseUrl, apiKey, token, dashboardRange]);

  useEffect(() => {
    if (baseUrl && authReady && kbId) {
      fetchQueryVolume();
      fetchRecentQueries();
      fetchRecentIngests();
    }
  }, [baseUrl, apiKey, token, kbId, dashboardRange]);

  useEffect(() => {
    if (token) {
      fetchMe().then(() => {
        fetchAdminUsers();
      });
      fetchInbox();
    } else {
      setCurrentUser(null);
      setInboxMessages([]);
      setAdminUsers([]);
    }
  }, [token, baseUrl]);

  useEffect(() => {
    if (!token) return;
    const intervalId = setInterval(() => {
      fetchInbox();
    }, 15000);
    return () => clearInterval(intervalId);
  }, [token, baseUrl]);

  useEffect(() => {
    if (token && baseUrl) {
      fetchCalendarEvents();
    } else {
      setCalendarEvents([]);
    }
  }, [token, baseUrl, calendarMonthKey]);

  const navGroups = [
    {
      id: "workspace",
      label: "Workspace",
      items: [{ id: "dashboard", label: "Dashboard", icon: <FiHome /> }]
    },
    {
      id: "ask",
      label: "Ask",
      items: [
        { id: "query", label: "Ask AI", icon: <FiSearch /> },
        { id: "conversations", label: "Conversations", icon: <FiMessageCircle /> }
      ]
    },
    {
      id: "knowledge",
      label: "Knowledge",
      items: [
        { id: "documents", label: "Documents", icon: <FiFileText /> },
        { id: "ingestion", label: "Ingestion", icon: <FiLayers /> },
        { id: "retrieval", label: "Retrieval", icon: <FiDatabase /> }
      ]
    },
    {
      id: "messages",
      label: "Messages",
      items: [{ id: "inbox", label: "Inbox", icon: <FiInbox /> }]
    },
    {
      id: "insights",
      label: "Insights",
      items: [{ id: "usage", label: "Usage", icon: <FiBarChart2 /> }]
    },
    {
      id: "settings",
      label: "Settings",
      items: [{ id: "settings", label: "Settings", icon: <FiSettings /> }]
    },
    // Account entry is handled by the footer profile button.
  ];

  const pageTitleMap = {
    dashboard: "Dashboard",
    query: "Ask AI",
    documents: "Documents",
    inbox: "Inbox",
    usage: "Usage",
    settings: "Settings",
    account: "Account",
    conversations: "Conversations",
    ingestion: "Ingestion",
    retrieval: "Retrieval"
  };

  const broadcastMessages = inboxMessages.filter((message) => message.scope === "broadcast");

  const dashboardMetrics = [
    {
      label: "Docs Indexed",
      value: overview?.documents_count ?? documents.length ?? 0,
      sub: overview?.documents_count ? `${overview.documents_count} total` : "No documents"
    },
    {
      label: "Queries (7d)",
      value: overview?.queries_count ?? queryCount ?? 0,
      sub: overview?.queries_count ? `${overview.queries_count} total` : "No queries"
    },
    {
      label: "Avg Latency",
      value: overview?.avg_latency_ms ? `${overview.avg_latency_ms} ms` : "-",
      sub: overview?.avg_latency_ms ? "Average" : "No data"
    },
    {
      label: "Last Ingest",
      value: overview?.last_ingest_at ? formatDateTime(overview.last_ingest_at) : "-",
      sub: overview?.last_ingest_at ? "Last run" : "Not indexed"
    }
  ];

  const retrievalSnapshot = [
    { label: "Top-k", value: topK },
    { label: "Embedding model", value: response?.embedding_model || "Default" },
    { label: "Vector DB", value: "Chroma" },
    { label: "Last indexed", value: overview?.last_ingest_at ? formatDateTime(overview.last_ingest_at) : "-" }
  ];

  const recentQueries = recentQueriesData.map((item) => ({
    question: item.query_text?.slice(0, 48) || "-",
    latency: item.latency_ms ? `${item.latency_ms} ms` : "-",
    time: item.created_at ? formatDateTime(item.created_at) : "-"
  }));

  const recentIngests = recentIngestsData.map((item) => ({
    status: item.status || "-",
    chunks: item.chunks_created ?? "-",
    time: item.finished_at ? formatDateTime(item.finished_at) : formatDateTime(item.created_at)
  }));

  const usageMetrics = [
    { label: "Monthly queries", value: queryCount || 0, sub: "Total" },
    { label: "Average latency", value: avgLatencyMs ? `${avgLatencyMs} ms` : "-", sub: "Mean" },
    { label: "Last latency", value: lastLatencyMs ? `${lastLatencyMs} ms` : "-", sub: "Latest" }
  ];

  const workspaceItems = kbList.map((kb) => ({ value: kb.id, label: kb.name }));

  const documentsView = useMemo(() => {
    const term = docSearch.trim().toLowerCase();
    const list = documents.map((doc) => ({
      id: doc.id || doc.document_id,
      key: doc.id || doc.document_id || doc.filename,
      name: doc.filename || doc.name || "Untitled",
      status: doc.status,
      chunks: doc.chunks ?? doc.chunk_count ?? "-",
      createdAt: doc.created_at
    }));
    return term ? list.filter((doc) => doc.name.toLowerCase().includes(term)) : list;
  }, [documents, docSearch]);

  const rightRailProps = {
    statusRows: [
      { label: "Connection", value: settingsIncomplete ? "Not configured" : "Configured" },
      { label: "Workspace", value: kbList.find((kb) => kb.id === kbId)?.name || "-" },
      { label: "Documents", value: documents.length }
    ],
    tips: [
      "Upload files, then run ingest to update answers.",
      "Use specific queries for more accurate retrieval.",
      "Check Inbox for broadcasts and team updates."
    ],
    announcements: broadcastMessages.slice(0, 3).map((message) => ({
      id: message.id,
      title: message.subject || "Announcement",
      preview: message.body,
      sender: message.sender_name || message.sender_email || "System",
      senderPosition: message.sender_position || "",
      initials: getInitials(message.sender_name || message.sender_email || ""),
      avatar: message.sender_avatar_url,
      time: formatDateTime(message.created_at)
    })),
    onAnnouncementsClick: () => setAnnouncementsOpen(true)
  };

  const weeklyWeather = [
    { day: "Mon", condition: "Sunny", tempC: 22, tempF: 72 },
    { day: "Tue", condition: "Cloudy", tempC: 19, tempF: 66 },
    { day: "Wed", condition: "Rain", tempC: 17, tempF: 63 },
    { day: "Thu", condition: "Cloudy", tempC: 20, tempF: 68 },
    { day: "Fri", condition: "Sunny", tempC: 24, tempF: 75 },
    { day: "Sat", condition: "Rain", tempC: 18, tempF: 64 },
    { day: "Sun", condition: "Sunny", tempC: 23, tempF: 73 }
  ];

  const todayKey = new Date().toISOString().slice(0, 10);
  const upcomingEvents = [...calendarEvents]
    .filter((event) => event.date >= todayKey)
    .sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")))
    .slice(0, 5);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index);
    return day;
  });

  const placeholderPanel = (title, subtitle) => (
    <Panel title={title} subtitle={subtitle} variant="sunken">
      <EmptyState title="Coming soon" subtitle="This section will be available soon." />
    </Panel>
  );

  const content = {
    dashboard: (
      <Dashboard
        metrics={dashboardMetrics}
        queryVolume={queryVolumeData}
        queryRange={dashboardRange}
        onQueryRangeChange={setDashboardRange}
        queryVolumeEmpty={!kbId}
        queryVolumeLoading={queryVolumeLoading || overviewLoading}
        retrievalSnapshot={retrievalSnapshot}
        recentQueries={recentQueries}
        recentIngests={recentIngests}
        recentQueriesEmpty={!kbId}
        recentIngestsEmpty={!kbId}
      />
    ),
    documents: (
      <Documents
        documents={documentsView}
        loading={docsLoading}
        error={docsError}
        onUploadFiles={handleUpload}
        onDelete={handleDelete}
        onIngest={handleIngest}
        uploading={uploading}
        ingesting={ingesting}
        search={docSearch}
        setSearch={setDocSearch}
        lastIngestAt={lastIngestAt ? formatDateTime(lastIngestAt) : "-"}
        disabled={settingsIncomplete || kbMissing}
        fileInputRef={fileInputRef}
      />
    ),
    query: (
      <Query
        question={question}
        setQuestion={setQuestion}
        topK={topK}
        setTopK={setTopK}
        response={response}
        error={error}
        loading={loading}
        onRun={runQuery}
        onClear={() => {
          setQuestion("");
          setResponse(null);
          setError("");
        }}
        latency={lastLatencyMs}
      />
    ),
    conversations: placeholderPanel("Conversations", "Threaded activity"),
    ingestion: placeholderPanel("Ingestion", "Pipeline runs"),
    retrieval: placeholderPanel("Retrieval", "Index diagnostics"),
    inbox: (
      <Inbox
        token={token}
        messages={inboxMessages}
        loading={inboxLoading}
        error={inboxError}
        onRefresh={fetchInbox}
        selected={selectedMessage}
        onSelect={setSelectedMessage}
        onMarkRead={handleMarkRead}
        onDelete={handleDeleteMessage}
        filter={inboxFilter}
        onFilter={setInboxFilter}
        composeScope={composeScope}
        setComposeScope={setComposeScope}
        composeRecipient={composeRecipient}
        setComposeRecipient={setComposeRecipient}
        composeSubject={composeSubject}
        setComposeSubject={setComposeSubject}
        composeBody={composeBody}
        setComposeBody={setComposeBody}
        onSend={handleSendMessage}
        isAdmin={Boolean(currentUser?.is_admin)}
        currentUserEmail={currentUser?.email || ""}
      />
    ),
    usage: <Usage metrics={usageMetrics} />,
    settings: (
      <Settings
        baseUrl={baseUrl}
        apiKey={apiKey}
        onBaseUrl={setBaseUrl}
        onApiKey={setApiKey}
        kbItems={workspaceItems}
        kbId={kbId}
        onKbSelect={(value) => {
          setKbId(value);
          localStorage.setItem("kbSelectedByUser", "true");
        }}
        kbLoading={kbLoading}
        kbError={kbError}
        onRefreshKb={fetchKnowledgeBases}
        kbName={kbName}
        kbDescription={kbDescription}
        onKbName={setKbName}
        onKbDescription={setKbDescription}
        onCreateKb={createKnowledgeBase}
        kbCreating={kbCreating}
        healthStatus={healthStatus}
        healthLoading={healthLoading}
        onHealthCheck={handleHealthCheck}
      />
    ),
    account: (
      <Account
        currentUser={currentUser}
        adminUsers={adminUsers}
        adminUsersLoading={adminUsersLoading}
        loginEmail={loginEmail}
        setLoginEmail={setLoginEmail}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        showLoginPassword={showLoginPassword}
        onToggleLoginPassword={() => setShowLoginPassword((prev) => !prev)}
        registerEmail={registerEmail}
        setRegisterEmail={setRegisterEmail}
        registerPassword={registerPassword}
        setRegisterPassword={setRegisterPassword}
        showRegisterPassword={showRegisterPassword}
        onToggleRegisterPassword={() => setShowRegisterPassword((prev) => !prev)}
        registerName={registerName}
        setRegisterName={setRegisterName}
        registerPosition={registerPosition}
        setRegisterPosition={setRegisterPosition}
        registerAvatarPreview={registerAvatarPreview}
        onRegisterAvatar={handleRegisterAvatar}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onLogout={handleLogout}
        onDeleteAccount={handleDeleteAccount}
        onDeleteUser={handleDeleteUser}
        onToggleAdmin={handleToggleAdmin}
        onRefreshUsers={fetchAdminUsers}
        loading={authLoading}
      />
    )
  };

  return (
    <>
      <AppShell
        sidebarProps={{
          brand: { logo, label: "KIVO" },
          navGroups,
          activeId: activeTab,
          onSelect: setActiveTab,
          collapsed: sidebarCollapsed,
          onToggle: () => setSidebarCollapsed((prev) => !prev),
          utilitiesAction: {
            id: "utilities",
            label: "Utilities",
            icon: <FiGrid />,
            onClick: () => setUtilitiesOpen(true)
          },
          account: {
            avatar: currentUser?.avatar_url || "",
            initials: getInitials(currentUser?.full_name || currentUser?.email || ""),
            name: currentUser?.full_name || currentUser?.email || "Account",
            subtitle: currentUser?.position || (token ? "Signed in" : "Guest")
          }
        }}
        topbarProps={{
          title: pageTitleMap[activeTab],
          workspaceLabel: "Workspace",
          workspaceItems,
          workspaceValue: kbId,
          onWorkspaceChange: (value) => {
            setKbId(value);
            localStorage.setItem("kbSelectedByUser", "true");
          },
          searchValue: globalSearch,
          onSearchChange: setGlobalSearch,
          onAlerts: () => pushToast("info", "No alerts yet."),
          avatar: currentUser?.avatar_url || "",
          initials: getInitials(currentUser?.full_name || currentUser?.email || ""),
          onMobileMenu: () => setMobileSidebarOpen(true),
          themeMode,
          onToggleTheme: () => setThemeMode((prev) => (prev === "dark" ? "light" : "dark"))
        }}
        rightRailProps={rightRailProps}
        toasts={toasts}
        onDismissToast={dismissToast}
        sidebarOpen={mobileSidebarOpen}
        onCloseSidebar={() => setMobileSidebarOpen(false)}
      >
        {content[activeTab]}
      </AppShell>

      <Drawer title="Utilities" open={utilitiesOpen} onClose={() => setUtilitiesOpen(false)}>
        <div className="utilities_stack">
          <Panel title="Weather" subtitle="This week" variant="sunken">
            <div className="utilities_weather">
              {weeklyWeather.map((entry) => (
                <div key={entry.day} className="utilities_weather_day">
                  <div className="utilities_weather_label">{entry.day}</div>
                  <div className="utilities_weather_temp">
                    <span>{entry.tempC}°C</span>
                    <span>{entry.tempF}°F</span>
                  </div>
                  <div className="panel_subtitle">{entry.condition}</div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Calendar" subtitle="Upcoming" variant="sunken">
            <div className="utilities_calendar">
              <div className="utilities_week_strip">
                {weekDays.map((day) => (
                  <div key={day.toISOString()} className="utilities_week_day">
                    <span className="utilities_week_label">
                      {day.toLocaleDateString("en-US", { weekday: "short" })}
                    </span>
                    <span className="utilities_week_date">{day.getDate()}</span>
                  </div>
                ))}
              </div>
              <div className="utilities_upcoming">
                {calendarLoading ? (
                  <EmptyState title="Loading events" subtitle="Syncing calendar." />
                ) : calendarError ? (
                  <EmptyState title="Calendar error" subtitle={calendarError} />
                ) : upcomingEvents.length ? (
                  <div className="list">
                    {upcomingEvents.map((event) => (
                      <div key={event.id} className="list_row">
                        <div>
                          <strong>{event.title}</strong>
                          <div className="panel_subtitle">{event.note || "No details"}</div>
                        </div>
                        <div className="panel_subtitle">
                          {event.date}{event.time ? ` · ${String(event.time).slice(0, 5)}` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No events" subtitle="Add reminders in the calendar." />
                )}
              </div>
            </div>
          </Panel>
        </div>
      </Drawer>

      {announcementsOpen ? (
        <div className="modal_overlay" onClick={() => setAnnouncementsOpen(false)} role="presentation">
          <div className="modal_panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modal_header">
              <div>
                <div className="panel_title">All announcements</div>
                <div className="panel_subtitle">Broadcast messages sent to your team.</div>
              </div>
              <button className="btn btn--ghost btn--sm" type="button" onClick={() => setAnnouncementsOpen(false)}>
                Close
              </button>
            </div>
            <div className="modal_body">
              <div className="list">
                {broadcastMessages.map((message) => (
                  <div key={message.id} className="list_row">
                    <div>
                      <strong>{message.subject || "Announcement"}</strong>
                      <div className="panel_subtitle">{message.body}</div>
                      <div className="panel_subtitle">
                        {message.sender_name || message.sender_email || "System"}
                        {message.sender_position ? ` · ${message.sender_position}` : ""}
                      </div>
                    </div>
                    <div className="panel_subtitle">{formatDateTime(message.created_at)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
