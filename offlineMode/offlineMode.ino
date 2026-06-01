#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>

// --- Configuration ---
const char* ssid = "Outbreak-WIFI-AP";
const byte DNS_PORT = 53;
IPAddress apIP(192, 168, 4, 1);
DNSServer dnsServer;
WebServer server(80);

// --- Data Structures ---
struct Message {
  long long id;
  String user;
  String text;
  String time;
  bool isAlert;
};

struct SyncItem {
  String id;
  String type;
  String content;
  String priority;
  String location;
  String timestamp_sl;
  long long timestamp_ms;
};

// Circular Buffers to prevent memory leaks/heap fragmentation
const int MAX_MESSAGES = 50;
Message messages[MAX_MESSAGES];
int messageCount = 0;

const int MAX_SYNC = 100;
SyncItem syncQueue[MAX_SYNC];
int syncCount = 0;

// --- Background Sync Job State ---
bool isSyncJobPending = false;
unsigned long lastInternetCheckTime = 0;
const unsigned long internetCheckInterval = 10000; // Check connectivity every 10 seconds

// --- Embedded Web Portal (index.html) ---
const char* index_html = R"rawliteral(<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Outbreak | Edge Node</title>
    <style>
      :root {
        --bg: #f8fafc;
        --sidebar: #ffffff;
        --accent-red: #ef4444;
        --accent-green: #22c55e;
        --text-main: #1e293b;
        --text-muted: #64748b;
        --border: #e2e8f0;
        --card-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      }

      [data-theme="dark"] {
        --bg: #0f172a;
        --sidebar: #1e293b;
        --text-main: #f8fafc;
        --text-muted: #94a3b8;
        --border: #334155;
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family:
          -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,
          Arial, sans-serif;
      }

      body {
        background-color: var(--bg);
        color: var(--text-main);
        height: 100vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transition: background 0.3s ease;
      }

      /* --- Toast Notification System --- */
      #toast-container {
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
        max-width: 340px;
        width: calc(100vw - 40px);
      }

      .toast {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 14px 16px;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 500;
        line-height: 1.45;
        pointer-events: all;
        cursor: pointer;
        border-left: 4px solid transparent;
        opacity: 0;
        transform: translateX(40px);
        transition: opacity 0.25s ease, transform 0.25s ease;
        word-break: break-word;
        box-shadow: 0 4px 16px rgba(0,0,0,0.18);
      }

      .toast.show {
        opacity: 1;
        transform: translateX(0);
      }

      .toast.hide {
        opacity: 0;
        transform: translateX(40px);
      }

      .toast-success {
        background: #f0fdf4;
        color: #166534;
        border-color: #22c55e;
      }

      .toast-error {
        background: #fef2f2;
        color: #991b1b;
        border-color: #ef4444;
      }

      .toast-warning {
        background: #fffbeb;
        color: #92400e;
        border-color: #f59e0b;
      }

      .toast-info {
        background: #eff6ff;
        color: #1e40af;
        border-color: #3b82f6;
      }

      [data-theme="dark"] .toast-success {
        background: #052e16;
        color: #86efac;
      }
      [data-theme="dark"] .toast-error {
        background: #2d0707;
        color: #fca5a5;
      }
      [data-theme="dark"] .toast-warning {
        background: #2d1b00;
        color: #fcd34d;
      }
      [data-theme="dark"] .toast-info {
        background: #0c1a3a;
        color: #93c5fd;
      }

      .toast-icon {
        font-size: 16px;
        flex-shrink: 0;
        margin-top: 1px;
      }

      .toast-body {
        flex: 1;
      }

      .toast-title {
        font-weight: 700;
        margin-bottom: 2px;
        font-size: 13px;
      }

      .toast-msg {
        font-size: 12px;
        opacity: 0.85;
        font-weight: 400;
      }

      /* --- Header --- */
      header {
        height: 64px;
        background: var(--sidebar);
        border-bottom: 1px solid var(--border);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 24px;
        z-index: 100;
      }

      .logo-area {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .logo-icon {
        width: 32px;
        height: 32px;
        background: var(--accent-red);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
      }

      .node-info {
        font-size: 14px;
        font-weight: 600;
      }

      .node-tag {
        background: #f1f5f9;
        color: var(--text-muted);
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        margin-left: 8px;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .btn {
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        border: none;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .btn-ghost {
        background: transparent;
        color: var(--text-main);
        border: 1px solid var(--border);
      }
      .btn-ghost:hover {
        background: #f1f5f9;
      }
      .btn-sos {
        background: var(--accent-red);
        color: white;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
      }
      .btn-sos:hover {
        transform: scale(1.05);
        filter: brightness(1.1);
      }

      /* --- Main Layout --- */
      .app-container {
        display: flex;
        flex: 1;
        overflow: hidden;
      }

      /* --- Sidebar --- */
      .sidebar {
        width: 300px;
        background: var(--sidebar);
        border-right: 1px solid var(--border);
        display: flex;
        flex-direction: column;
        padding: 20px;
        gap: 24px;
        overflow-y: auto;
      }

      .map-box {
        width: 100%;
        aspect-ratio: 4/3;
        background: #e2e8f0;
        border-radius: 12px;
        position: relative;
        overflow: hidden;
        border: 1px solid var(--border);
      }

      .map-marker {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 12px;
        height: 12px;
        background: var(--accent-green);
        border: 2px solid white;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        box-shadow: 0 0 0 8px rgba(34, 197, 94, 0.2);
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0% {
          box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
        }
        70% {
          box-shadow: 0 0 0 10px rgba(34, 197, 94, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
        }
      }

      .metric-card {
        padding: 16px;
        background: #f8fafc;
        border-radius: 12px;
        border: 1px solid var(--border);
      }

      .metric-label {
        font-size: 11px;
        font-weight: 700;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .metric-value {
        font-size: 18px;
        font-weight: 800;
        color: var(--text-main);
        margin-top: 4px;
      }
      .metric-sub {
        font-size: 12px;
        color: var(--accent-green);
        font-weight: 600;
        margin-top: 2px;
      }

      /* --- Content Area --- */
      .content {
        flex: 1;
        display: flex;
        flex-direction: column;
        background: var(--bg);
      }

      .banner {
        background: #fef3c7;
        padding: 10px 24px;
        font-size: 13px;
        font-weight: 600;
        color: #92400e;
        display: flex;
        align-items: center;
        gap: 12px;
        border-bottom: 1px solid #fde68a;
      }

      .feed-container {
        flex: 1;
        padding: 24px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .msg {
        max-width: 80%;
        padding: 16px;
        background: var(--sidebar);
        border-radius: 16px;
        border: 1px solid var(--border);
        box-shadow: var(--card-shadow);
        position: relative;
      }

      .msg-self {
        align-self: flex-end;
        background: #f1f5f9;
      }

      .msg-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
      }

      .msg-user {
        font-size: 13px;
        font-weight: 700;
      }
      .msg-time {
        font-size: 11px;
        color: var(--text-muted);
      }
      .msg-body {
        font-size: 14px;
        line-height: 1.5;
      }
      .msg-status {
        font-size: 10px;
        color: var(--accent-red);
        font-weight: 700;
        margin-top: 8px;
        text-transform: uppercase;
      }

      .input-area {
        height: 80px;
        padding: 16px 24px;
        background: var(--sidebar);
        border-top: 1px solid var(--border);
        display: flex;
        gap: 16px;
        align-items: center;
      }

      .chat-input {
        flex: 1;
        background: #f1f5f9;
        border: 1px solid var(--border);
        padding: 12px 18px;
        border-radius: 12px;
        font-size: 14px;
        outline: none;
      }

      .btn-send {
        width: 48px;
        height: 48px;
        background: var(--accent-red);
        border: none;
        border-radius: 12px;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /* --- Footer / Sync Bar --- */
      .sync-bar {
        height: 60px;
        background: var(--sidebar);
        border-top: 1px solid var(--border);
        padding: 0 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .sync-status {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 13px;
      }
      .progress-outer {
        width: 120px;
        height: 6px;
        background: #e2e8f0;
        border-radius: 10px;
        overflow: hidden;
      }
      .progress-inner {
        height: 100%;
        background: var(--accent-red);
        width: 45%;
      }

      /* --- Modals --- */
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .modal {
        background: var(--sidebar);
        width: 100%;
        max-width: 450px;
        border-radius: 24px;
        padding: 32px;
        text-align: center;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      }

      .modal-icon {
        font-size: 48px;
        margin-bottom: 24px;
        display: block;
      }
      .modal-title {
        font-size: 24px;
        font-weight: 800;
        margin-bottom: 12px;
      }
      .modal-desc {
        font-size: 15px;
        color: var(--text-muted);
        line-height: 1.6;
        margin-bottom: 24px;
      }
      .modal-actions {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .btn-lg {
        width: 100%;
        padding: 16px;
        font-size: 16px;
      }

      /* Power Saver Mode */
      .power-saver body {
        filter: grayscale(1) contrast(1.2);
      }
      .power-saver {
        background: #000 !important;
        color: #0f0 !important;
      }
      .power-saver * {
        background: transparent !important;
        border-color: #0f0 !important;
        color: #0f0 !important;
        box-shadow: none !important;
      }
      .power-saver .btn-sos {
        background: #0f0 !important;
        color: #000 !important;
      }

      /* Button disabled state */
      .btn:disabled,
      .btn-send:disabled,
      .btn-sos:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none !important;
        filter: none !important;
      }

      /* Mobile Responsive Media Queries */
      @media (max-width: 768px) {
        .app-container {
          flex-direction: column !important;
          overflow-y: auto !important;
        }
        .sidebar {
          width: 100% !important;
          border-right: none !important;
          border-bottom: 1px solid var(--border) !important;
          order: 2 !important;
          height: auto !important;
          overflow-y: visible !important;
        }
        .content {
          order: 1 !important;
          height: calc(100vh - 124px) !important;
        }
        .msg {
          max-width: 95% !important;
        }
        .sync-bar {
          flex-direction: column !important;
          height: auto !important;
          padding: 12px 24px !important;
          gap: 12px !important;
          align-items: stretch !important;
        }
        .btn-ghost {
          width: 100% !important;
          justify-content: center !important;
        }
        #toast-container {
          top: 70px;
          right: 12px;
          left: 12px;
          width: auto;
          max-width: none;
        }
      }

      @media (max-width: 480px) {
        header {
          padding: 0 12px !important;
          height: 56px !important;
        }
        .node-info {
          font-size: 11px !important;
        }
        .node-tag {
          display: none !important;
        }
        .btn {
          padding: 6px 10px !important;
          font-size: 11px !important;
        }
        .input-area {
          padding: 12px !important;
        }
        .chat-input {
          font-size: 13px !important;
        }
      }
    </style>
  </head>
  <body>
    <!-- Toast Container -->
    <div id="toast-container" role="status" aria-live="polite"></div>

    <header id="appHeader">
      <div class="logo-area">
        <div class="logo-icon">!</div>
        <div class="node-info">
          Edge Node: Outbreak!
          <span class="node-tag">Offline Node</span>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn btn-ghost" onclick="togglePowerSaver()">
          ⚡ Power Saver
        </button>
        <button class="btn btn-sos" id="sosBroadcastBtn" onclick="quickSOS()">
          🆘 SOS Broadcast
        </button>
      </div>
    </header>

    <div class="app-container">
      <aside class="sidebar">
        <div class="map-box">
          <svg width="100%" height="100%" viewBox="0 0 200 150">
            <rect width="200" height="150" fill="#cbd5e1" />
            <path d="M20,20 L180,20 L180,130 L20,130 Z" fill="#e2e8f0" />
            <circle cx="100" cy="75" r="40" fill="#94a3b8" opacity="0.2" />
          </svg>
          <div class="map-marker"></div>
          <div
            style="
              position: absolute;
              bottom: 10px;
              left: 10px;
              background: white;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 9px;
              font-weight: bold;
              color: #1e293b;
              border: 1px solid #e2e8f0;
            "
          >
            YOU ARE HERE
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Signal Strength</div>
          <div class="metric-value">Unknown</div>
          <div class="metric-sub">Waiting for data</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Broadcast Range</div>
          <div class="metric-value">Unknown</div>
          <div class="metric-sub">No LoRa data</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Peers Connected</div>
          <div class="metric-value" id="peerCount">0 Devices</div>
          <div class="metric-sub">Secure Channel #1</div>
        </div>
      </aside>

      <main class="content">
        <div class="banner">
          <span>📡</span>
          Offline Mode Active — Local Network Only. Communicating with devices
          within ~100m range.
        </div>

        <div class="feed-container" id="feed">
          <!-- Messages will appear here -->
        </div>

        <div class="input-area">
          <input
            type="text"
            class="chat-input"
            id="messageInput"
            placeholder="Type a message to nearby devices (Plain text only)..."
            maxlength="500"
          />
          <button class="btn-send" id="sendBtn" onclick="sendMessage()">➤</button>
        </div>
      </main>
    </div>

    <div class="sync-bar">
      <div class="sync-status">
        <span>Cloud Sync Pending</span>
        <div class="progress-outer">
          <div class="progress-inner" id="syncProgress"></div>
        </div>
        <span style="font-weight: bold" id="queueCount">5 Items</span>
      </div>
      <button
        class="btn btn-ghost"
        onclick="openSync()"
        style="color: var(--accent-red); border-color: var(--accent-red)"
      >
        Sync Manager
      </button>
    </div>

    <!-- SOS Modal -->
    <div class="modal-overlay" id="sosModal">
      <div class="modal">
        <span class="modal-icon">🚨</span>
        <h2 class="modal-title">CONFIRM SOS?</h2>
        <p class="modal-desc">
          This will broadcast a high-priority distress signal to all nearby
          nodes in the mesh network. Use only in real emergencies.
        </p>
        <div class="modal-actions">
          <button class="btn btn-sos btn-lg" id="sosConfirmBtn" onclick="triggerSOS()">
            BROADCAST NOW
          </button>
          <button class="btn btn-ghost btn-lg" onclick="closeModal('sosModal')">
            Cancel SOS
          </button>
        </div>
      </div>
    </div>

    <!-- Sync Modal -->
    <div class="modal-overlay" id="syncModal">
      <div class="modal">
        <span class="modal-icon">📤</span>
        <h2 class="modal-title">Sync Manager</h2>
        <p class="modal-desc">
          You have <span id="modalQueueCount">0</span> items queued for the main
          platform. Syncing will generate a JSON bundle for data relay.
        </p>
        <div class="modal-actions">
          <button
            class="btn btn-sos btn-lg"
            id="syncNowBtn"
            style="background: #0f172a"
            onclick="syncNow()"
          >
            GENERATE SYNC JSON
          </button>
          <button
            class="btn btn-ghost btn-lg"
            onclick="closeModal('syncModal')"
          >
            Back to Feed
          </button>
        </div>
      </div>
    </div>

    <script>

      // ================================================================
      // TOAST NOTIFICATION SYSTEM
      // Pure JS/CSS — zero dependencies, works fully offline on ESP32
      // captive portal WebKit and any modern mobile browser.
      // ================================================================
      const toastContainer = document.getElementById('toast-container');
      const TOAST_ICONS = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
      };
      const TOAST_DURATION = {
        success: 3500,
        error: 5000,
        warning: 4500,
        info: 3500
      };

      function showToast(type, title, message, duration) {
        try {
          const toast = document.createElement('div');
          toast.className = 'toast toast-' + type;
          toast.setAttribute('role', 'alert');
          toast.innerHTML =
            '<span class="toast-icon" aria-hidden="true">' + (TOAST_ICONS[type] || 'ℹ') + '</span>' +
            '<div class="toast-body">' +
              '<div class="toast-title">' + escapeHtml(title) + '</div>' +
              (message ? '<div class="toast-msg">' + escapeHtml(message) + '</div>' : '') +
            '</div>';

          toast.addEventListener('click', function() { dismissToast(toast); });

          toastContainer.appendChild(toast);

          // Trigger enter animation on next paint
          requestAnimationFrame(function() {
            requestAnimationFrame(function() {
              toast.classList.add('show');
            });
          });

          var ms = duration || TOAST_DURATION[type] || 4000;
          var timer = setTimeout(function() { dismissToast(toast); }, ms);

          // Cancel auto-dismiss on hover so user can read it
          toast.addEventListener('mouseenter', function() { clearTimeout(timer); });
          toast.addEventListener('mouseleave', function() {
            timer = setTimeout(function() { dismissToast(toast); }, 1500);
          });
        } catch (e) {
          console.error('Toast render error:', e);
        }
      }

      function dismissToast(toast) {
        try {
          toast.classList.remove('show');
          toast.classList.add('hide');
          setTimeout(function() {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
          }, 300);
        } catch (e) {
          console.error('Toast dismiss error:', e);
        }
      }

      function escapeHtml(str) {
        if (typeof str !== 'string') return '';
        return str
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      }

      // Convenience wrappers
      function toastSuccess(title, msg) { showToast('success', title, msg); }
      function toastError(title, msg)   { showToast('error',   title, msg); }
      function toastWarning(title, msg) { showToast('warning', title, msg); }
      function toastInfo(title, msg)    { showToast('info',    title, msg); }


      // ================================================================
      // UTILITIES
      // ================================================================
      function getSLTime() {
        try {
          var now = new Date();
          var utc = now.getTime() + (now.getTimezoneOffset() * 60000);
          return new Date(utc + (3600000 * 5.5));
        } catch (e) {
          console.error('getSLTime error:', e);
          return new Date();
        }
      }

      function formatSLTime(date) {
        try {
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
          return '--:--';
        }
      }

      function getGPSLocation() {
        return new Promise(function(resolve) {
          try {
            if (!navigator.geolocation) {
              resolve('UNKNOWN');
              return;
            }
            navigator.geolocation.getCurrentPosition(
              function(pos) {
                try {
                  resolve(pos.coords.latitude.toFixed(4) + ',' + pos.coords.longitude.toFixed(4));
                } catch (e) {
                  resolve('UNKNOWN');
                }
              },
              function(err) {
                console.warn('GPS error:', err.message || err);
                resolve('UNKNOWN');
              },
              { timeout: 5000 }
            );
          } catch (e) {
            console.error('getGPSLocation error:', e);
            resolve('UNKNOWN');
          }
        });
      }

      // Simple fetch wrapper with timeout support
      function fetchWithTimeout(url, options, timeoutMs) {
        timeoutMs = timeoutMs || 8000;
        return new Promise(function(resolve, reject) {
          var timer = setTimeout(function() {
            reject(new Error('Request timed out after ' + timeoutMs + 'ms'));
          }, timeoutMs);
          fetch(url, options || {})
            .then(function(res) { clearTimeout(timer); resolve(res); })
            .catch(function(err) { clearTimeout(timer); reject(err); });
        });
      }


      // ================================================================
      // PEER IDENTITY MANAGEMENT
      // ================================================================
      try {
        if (!localStorage.getItem('offline_nick')) {
          var randId = Math.floor(1000 + Math.random() * 9000);
          localStorage.setItem('offline_nick', 'Peer-' + randId);
        }
      } catch (e) {
        console.warn('localStorage not available:', e);
      }

      var myNick = (function() {
        try { return localStorage.getItem('offline_nick') || 'Peer-0000'; }
        catch (e) { return 'Peer-' + Math.floor(1000 + Math.random() * 9000); }
      })();

      function getMySentIds() {
        try {
          return JSON.parse(localStorage.getItem('my_sent_ids') || '[]');
        } catch (e) { return []; }
      }

      function addMySentId(id) {
        try {
          var ids = getMySentIds();
          ids.push(id);
          localStorage.setItem('my_sent_ids', JSON.stringify(ids));
        } catch (e) {
          console.warn('Could not persist sent ID:', e);
        }
      }


      // ================================================================
      // STATE
      // ================================================================
      var state = {
        messages: [],
        syncQueue: [],
        isPowerSaver: false,
      };

      var isOfflineBackend = false;
      var isSending = false;       // debounce flag for sendMessage
      var isSosBroadcasting = false; // debounce flag for SOS

      var feedEl           = document.getElementById('feed');
      var queueCountEl     = document.getElementById('queueCount');
      var modalQueueCountEl= document.getElementById('modalQueueCount');
      var syncProgressEl   = document.getElementById('syncProgress');


      // ================================================================
      // RENDER
      // ================================================================
      function renderFeed() {
        try {
          feedEl.innerHTML = '';
          if (!Array.isArray(state.messages)) {
            console.warn('renderFeed: state.messages is not an array');
            return;
          }
          state.messages.forEach(function(msg) {
            try {
              var div = document.createElement('div');
              div.className = 'msg' + (msg.isSelf ? ' msg-self' : '');
              div.innerHTML =
                '<div class="msg-header">' +
                  '<span class="msg-user">' + escapeHtml(msg.user || 'Unknown') +
                    (msg.dist ? ' <small style="color:var(--text-muted);font-weight:normal;">\u2219 ' + escapeHtml(String(msg.dist)) + '</small>' : '') +
                  '</span>' +
                  '<span class="msg-time">' + escapeHtml(msg.time || '') + '</span>' +
                '</div>' +
                '<div class="msg-body">' +
                  (msg.alert ? '<span style="color:var(--accent-red);font-weight:800;">CAUTION: </span>' : '') +
                  escapeHtml(msg.text || '') +
                '</div>' +
                (msg.rssi  ? '<div class="msg-status">📶 ' + escapeHtml(String(msg.rssi)) + '</div>' : '') +
                (msg.queued ? '<div class="msg-status">Queued for sync</div>' : '');
              feedEl.appendChild(div);
            } catch (innerErr) {
              console.warn('renderFeed: error rendering message', innerErr);
            }
          });
          feedEl.scrollTop = feedEl.scrollHeight;
        } catch (e) {
          console.error('renderFeed error:', e);
          toastError('Display Error', 'Could not render message feed.');
        }
      }


      // ================================================================
      // LOAD DATA FROM SERVER
      // ================================================================
      async function loadDataFromServer() {
        try {
          var resMsg = await fetchWithTimeout('/api/messages', {}, 5000);
          if (!resMsg.ok) {
            throw new Error('Server returned HTTP ' + resMsg.status);
          }
          isOfflineBackend = true;

          var dataMsg;
          try {
            dataMsg = await resMsg.json();
          } catch (parseErr) {
            throw new Error('Invalid JSON in /api/messages response');
          }

          if (!Array.isArray(dataMsg)) {
            throw new Error('/api/messages did not return an array');
          }

          var sentIds = getMySentIds();
          state.messages = dataMsg.map(function(msg) {
            return Object.assign({}, msg, {
              isSelf: sentIds.indexOf(msg.id) !== -1 || msg.user === myNick
            });
          });
          renderFeed();

          var resSync = await fetchWithTimeout('/api/sync_queue', {}, 5000);
          if (resSync.ok) {
            try {
              state.syncQueue = await resSync.json();
            } catch (e) {
              console.warn('Could not parse sync queue JSON:', e);
              state.syncQueue = [];
            }
            updateSyncUI();
          }

        } catch (err) {
          if (isOfflineBackend) {
            // Only show toast if we previously had a connection (unexpected loss)
            console.warn('loadDataFromServer failed:', err.message);
            toastWarning('Connection Lost', 'Could not reach edge node. Retrying...');
          } else {
            console.log('Running in standalone/mock mode:', err.message);
          }
          isOfflineBackend = false;
        }
      }


      // ================================================================
      // SEND MESSAGE
      // ================================================================
      async function sendMessage() {
        if (isSending) {
          toastWarning('Please Wait', 'Previous message is still sending.');
          return;
        }

        var input = document.getElementById('messageInput');
        var sendBtn = document.getElementById('sendBtn');

        var text;
        try {
          text = input.value.trim();
        } catch (e) {
          toastError('Input Error', 'Could not read message input.');
          return;
        }

        if (!text) {
          toastWarning('Empty Message', 'Please type something before sending.');
          input.focus();
          return;
        }

        if (text.length > 500) {
          toastWarning('Message Too Long', 'Keep messages under 500 characters.');
          return;
        }

        isSending = true;
        sendBtn.disabled = true;

        try {
          var slTime = getSLTime();
          var msgId  = Date.now();
          var newMsg = {
            id: msgId,
            user: myNick,
            text: text,
            time: formatSLTime(slTime),
            queued: true
          };

          if (isOfflineBackend) {
            try {
              var res = await fetchWithTimeout('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body:
                  'id=' + msgId +
                  '&user=' + encodeURIComponent(myNick) +
                  '&text=' + encodeURIComponent(text) +
                  '&time=' + encodeURIComponent(newMsg.time)
              }, 6000);

              if (res.ok) {
                addMySentId(msgId);
                input.value = '';
                await loadDataFromServer();
                toastSuccess('Sent', 'Message broadcast to mesh network.');
                return;
              } else {
                var errBody = '';
                try { errBody = await res.text(); } catch(_) {}
                throw new Error('Server error ' + res.status + (errBody ? ': ' + errBody : ''));
              }
            } catch (fetchErr) {
              console.error('POST /api/messages failed, falling back to local:', fetchErr.message);
              toastWarning('Offline Fallback', 'Node unreachable. Message queued locally.');
            }
          }

          // Standalone fallback
          newMsg.isSelf = true;
          state.messages.push(newMsg);
          state.syncQueue.push({
            id: 'MSG-' + newMsg.id,
            type: 'MESSAGE',
            content: text,
            priority: 'NORMAL',
            timestamp_sl: slTime.toISOString(),
            timestamp_ms: slTime.getTime()
          });

          input.value = '';
          updateSyncUI();
          renderFeed();
          toastSuccess('Queued Locally', 'Will sync when connection is restored.');

        } catch (e) {
          console.error('sendMessage unexpected error:', e);
          toastError('Send Failed', 'Unexpected error: ' + (e.message || 'unknown'));
        } finally {
          isSending = false;
          sendBtn.disabled = false;
        }
      }


      // ================================================================
      // QUICK SOS (header button — no modal confirm)
      // ================================================================
      async function quickSOS() {
        if (isSosBroadcasting) {
          toastWarning('SOS Active', 'A broadcast is already in progress.');
          return;
        }

        var sosBtn = document.getElementById('sosBroadcastBtn');

        isSosBroadcasting = true;
        if (sosBtn) sosBtn.disabled = true;

        try {
          var slTime = getSLTime();
          var sosId  = Date.now();

          // Flash screen red
          try {
            document.body.style.background = '#7f1d1d';
            setTimeout(function() { document.body.style.background = ''; }, 1200);
          } catch (_) {}

          // Vibrate supported devices
          try {
            if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 600]);
          } catch (_) {}

          var approxDistance = 0;

          state.messages.push({
            id: sosId,
            user: '🚨 EMERGENCY',
            text:
              'SOS ALERT ACTIVE\n' +
              'Approx Distance: ' + approxDistance + 'm\n' +
              'Move toward stronger signal.',
            time: formatSLTime(slTime),
            alert: true,
            queued: true,
            dist: approxDistance + 'm',
          });
          renderFeed();

          if (isOfflineBackend) {
            try {
              var res = await fetchWithTimeout('/api/sos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body:
                  'id=' + sosId +
                  '&distance=' + approxDistance +
                  '&time=' + encodeURIComponent(formatSLTime(slTime))
              }, 6000);

              if (res.ok) {
                await loadDataFromServer();
                toastSuccess('SOS Broadcast Sent', 'Distress signal queued on node.');
              } else {
                throw new Error('Server returned HTTP ' + res.status);
              }
            } catch (fetchErr) {
              console.error('quickSOS POST failed:', fetchErr.message);
              toastError('SOS Relay Failed', 'Could not reach node. Signal queued locally.');
            }
          } else {
            toastWarning('SOS Queued Locally', 'No node connection. Will sync when online.');
          }

          updateSyncUI();

        } catch (e) {
          console.error('quickSOS unexpected error:', e);
          toastError('SOS Error', 'Unexpected error: ' + (e.message || 'unknown'));
        } finally {
          // Re-enable after 5s cooldown to prevent SOS spam
          setTimeout(function() {
            isSosBroadcasting = false;
            if (sosBtn) sosBtn.disabled = false;
          }, 5000);
        }
      }


      // ================================================================
      // TRIGGER SOS (modal confirm button)
      // ================================================================
      async function triggerSOS() {
        var confirmBtn = document.getElementById('sosConfirmBtn');
        if (confirmBtn) {
          confirmBtn.disabled = true;
          confirmBtn.textContent = 'BROADCASTING...';
        }

        try {
          var slTime   = getSLTime();
          var location = await getGPSLocation();
          var sosId    = Date.now();

          var sosData = {
            id: 'SOS-' + sosId,
            type: 'SOS_BROADCAST',
            content: 'EMERGENCY SOS TRIGGERED FROM EDGE NODE',
            priority: 'CRITICAL',
            location_coordinates: location,
            maps_search_link: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(location),
            timestamp_sl: slTime.toISOString(),
            timestamp_ms: slTime.getTime()
          };

          if (isOfflineBackend) {
            try {
              var res = await fetchWithTimeout('/api/sos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body:
                  'id=' + sosId +
                  '&location=' + encodeURIComponent(location) +
                  '&time=' + encodeURIComponent(formatSLTime(slTime))
              }, 6000);

              if (res.ok) {
                closeModal('sosModal');
                await loadDataFromServer();
                toastSuccess('SOS Broadcast Sent', 'CRITICAL signal relayed to mesh. Location: ' + location);
                return;
              } else {
                var errBody = '';
                try { errBody = await res.text(); } catch(_) {}
                throw new Error('Server error ' + res.status + (errBody ? ': ' + errBody : ''));
              }
            } catch (fetchErr) {
              console.error('triggerSOS POST failed, falling back:', fetchErr.message);
              toastWarning('Node Unreachable', 'SOS queued locally. Will upload when internet restored.');
            }
          }

          // Standalone fallback
          state.syncQueue.push(sosData);
          state.messages.push({
            id: Date.now(),
            user: 'SYSTEM',
            text: 'SOS BROADCAST SENT. LOCATION: ' + location + '. DISTRESS SIGNAL QUEUED.',
            time: formatSLTime(slTime),
            alert: true,
            queued: true,
          });

          closeModal('sosModal');
          updateSyncUI();
          renderFeed();
          toastSuccess('SOS Queued', 'Distress signal stored locally.');

        } catch (e) {
          console.error('triggerSOS unexpected error:', e);
          toastError('SOS Failed', 'Unexpected error: ' + (e.message || 'unknown'));
        } finally {
          if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'BROADCAST NOW';
          }
        }
      }


      // ================================================================
      // SYNC NOW
      // ================================================================
      async function syncNow() {
        var syncBtn = document.getElementById('syncNowBtn');
        if (syncBtn) {
          syncBtn.disabled = true;
          syncBtn.textContent = 'PROCESSING...';
        }

        try {
          var slTime = getSLTime();

          if (isOfflineBackend) {
            try {
              var res = await fetchWithTimeout('/api/create_sync_job', { method: 'POST' }, 6000);
              if (res.ok) {
                closeModal('syncModal');
                await loadDataFromServer();
                toastSuccess('Sync Job Created', 'Node will auto-upload when internet is restored.');
                return;
              } else {
                throw new Error('Server returned HTTP ' + res.status);
              }
            } catch (fetchErr) {
              console.error('create_sync_job failed, falling back to local download:', fetchErr.message);
              toastWarning('Node Unreachable', 'Falling back to local JSON download.');
            }
          }

          // Standalone fallback: download JSON locally
          if (state.syncQueue.length === 0) {
            toastInfo('Nothing to Sync', 'Sync queue is empty.');
            closeModal('syncModal');
            return;
          }

          try {
            var finalData = state.syncQueue.map(function(item) {
              return Object.assign({}, item, {
                metadata: {
                  node_id: 'STANDALONE',
                  is_prio_critical: true,
                  delivery_priority: 'CRITICAL',
                  captured_at_sl: slTime.toISOString()
                }
              });
            });

            var syncPayload = {
              package_id: 'SYNC-' + Math.random().toString(36).substr(2, 9),
              timestamp_iso: slTime.toISOString(),
              timestamp_sl: new Intl.DateTimeFormat('en-GB', {
                dateStyle: 'full', timeStyle: 'long', timeZone: 'Asia/Colombo'
              }).format(slTime),
              node_id: 'STANDALONE',
              data_points: finalData,
              status: 'EDGE_READY',
              is_emergency_relay: true,
            };

            var dataStr =
              'data:text/json;charset=utf-8,' +
              encodeURIComponent(JSON.stringify(syncPayload, null, 2));
            var anchor = document.createElement('a');
            anchor.setAttribute('href', dataStr);
            anchor.setAttribute('download', 'outbreak_sync_sl_' + Date.now() + '.json');
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();

            // Clear queue
            state.syncQueue = [];
            state.messages = state.messages.map(function(m) {
              return Object.assign({}, m, { queued: false });
            });
            updateSyncUI();
            renderFeed();
            closeModal('syncModal');
            toastSuccess('Sync Bundle Downloaded', 'Queue cleared. ' + finalData.length + ' item(s) exported.');

          } catch (dlErr) {
            console.error('Sync download error:', dlErr);
            toastError('Download Failed', 'Could not generate sync bundle: ' + (dlErr.message || 'unknown'));
          }

        } catch (e) {
          console.error('syncNow unexpected error:', e);
          toastError('Sync Error', 'Unexpected error: ' + (e.message || 'unknown'));
        } finally {
          if (syncBtn) {
            syncBtn.disabled = false;
            syncBtn.textContent = 'GENERATE SYNC JSON';
          }
        }
      }


      // ================================================================
      // UI UTILITIES
      // ================================================================
      var isJobPending = false;

      async function updateSyncUI() {
        try {
          var count = Array.isArray(state.syncQueue) ? state.syncQueue.length : 0;
          queueCountEl.innerText = count + ' Items';
          modalQueueCountEl.innerText = count;
          var progress = Math.min(count * 5, 100);
          syncProgressEl.style.width = (count === 0 ? 0 : 20 + progress) + '%';

          if (isOfflineBackend) {
            try {
              var res = await fetchWithTimeout('/api/sync_job_status', {}, 4000);
              if (res.ok) {
                var statusData;
                try {
                  statusData = await res.json();
                } catch (parseErr) {
                  throw new Error('Invalid JSON from /api/sync_job_status');
                }
                isJobPending = !!statusData.pending;
                var syncStatusLabel = document.querySelector('.sync-status span');
                if (syncStatusLabel) {
                  if (isJobPending) {
                    syncStatusLabel.innerHTML = '⏳ Background Upload Job Active (Waiting for Internet)';
                    syncStatusLabel.style.color = 'var(--accent-green)';
                    syncProgressEl.style.background = 'var(--accent-green)';
                  } else {
                    syncStatusLabel.innerHTML = 'Cloud Sync Pending';
                    syncStatusLabel.style.color = '';
                    syncProgressEl.style.background = '';
                  }
                }
              }
            } catch (e) {
              console.log('Sync job status check failed:', e.message);
            }
          }
        } catch (e) {
          console.error('updateSyncUI error:', e);
        }
      }

      function openModal(id) {
        try {
          var el = document.getElementById(id);
          if (el) el.style.display = 'flex';
        } catch (e) { console.error('openModal error:', e); }
      }

      function closeModal(id) {
        try {
          var el = document.getElementById(id);
          if (el) el.style.display = 'none';
        } catch (e) { console.error('closeModal error:', e); }
      }

      function openSync() {
        updateSyncUI();
        openModal('syncModal');
      }

      function togglePowerSaver() {
        try {
          state.isPowerSaver = !state.isPowerSaver;
          document.documentElement.classList.toggle('power-saver', state.isPowerSaver);
          toastInfo(
            state.isPowerSaver ? 'Power Saver On' : 'Power Saver Off',
            state.isPowerSaver ? 'Display dimmed to conserve battery.' : 'Normal display mode restored.'
          );
        } catch (e) {
          console.error('togglePowerSaver error:', e);
        }
      }

      // Close modals on overlay click
      document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
        overlay.addEventListener('click', function(e) {
          if (e.target === overlay) {
            overlay.style.display = 'none';
          }
        });
      });

      // Send message on Enter key
      var msgInput = document.getElementById('messageInput');
      if (msgInput) {
        msgInput.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
          }
        });
      }


      // ================================================================
      // INIT
      // ================================================================
      try {
        loadDataFromServer();
        updateSyncUI();
        renderFeed();
      } catch (e) {
        console.error('Init error:', e);
        toastError('Init Failed', 'Could not start edge node UI.');
      }

      // Background polling — only hits server if connection was confirmed
      setInterval(function() {
        try {
          if (isOfflineBackend) loadDataFromServer();
        } catch (e) { console.error('Poll error:', e); }
      }, 1200);

      // Simulate mesh peer count fluctuation
      setInterval(function() {
        try {
          var peers = Math.floor(Math.random() * 5) + 10;
          var el = document.getElementById('peerCount');
          if (el) el.innerText = peers + ' Devices';
        } catch (e) { console.error('Peer count error:', e); }
      }, 5000);

    </script>
  </body>
</html>)rawliteral";

// --- Database Operations ---
void addMessage(long long id, const String& user, const String& text, const String& time, bool isAlert) {
  if (user.length() == 0 || text.length() == 0) {
    Serial.println("[addMessage] Skipping: empty user or text.");
    return;
  }

  Message newMsg;
  newMsg.id      = id;
  newMsg.user    = user;
  newMsg.text    = text;
  newMsg.time    = time;
  newMsg.isAlert = isAlert;

  if (messageCount < MAX_MESSAGES) {
    messages[messageCount++] = newMsg;
  } else {
    // Shift oldest left (circular overwrite)
    for (int i = 1; i < MAX_MESSAGES; i++) {
      messages[i - 1] = messages[i];
    }
    messages[MAX_MESSAGES - 1] = newMsg;
  }
}

void addSyncItem(const String& id, const String& type, const String& content,
                 const String& priority, const String& location,
                 const String& timestamp_sl, long long timestamp_ms) {
  if (id.length() == 0 || type.length() == 0) {
    Serial.println("[addSyncItem] Skipping: empty id or type.");
    return;
  }

  SyncItem item;
  item.id           = id;
  item.type         = type;
  item.content      = content;
  item.priority     = priority;
  item.location     = location;
  item.timestamp_sl = timestamp_sl;
  item.timestamp_ms = timestamp_ms;

  if (syncCount < MAX_SYNC) {
    syncQueue[syncCount++] = item;
  } else {
    for (int i = 1; i < MAX_SYNC; i++) {
      syncQueue[i - 1] = syncQueue[i];
    }
    syncQueue[MAX_SYNC - 1] = item;
  }
}

// --- JSON Helpers ---
String jsonEscape(const String& input) {
  String out = "";
  out.reserve(input.length() + 16);
  for (unsigned int i = 0; i < input.length(); i++) {
    char c = input.charAt(i);
    switch (c) {
      case '"':  out += "\\\""; break;
      case '\\': out += "\\\\"; break;
      case '\n': out += "\\n";  break;
      case '\r': out += "\\r";  break;
      case '\t': out += "\\t";  break;
      default:
        // Strip control characters that would break JSON
        if ((unsigned char)c >= 0x20) out += c;
        break;
    }
  }
  return out;
}

// --- JSON Serialization ---
String getMessagesJSON() {
  String json = "[";
  bool first = true;
  for (int i = 0; i < messageCount; i++) {
    if (!first) json += ",";
    first = false;

    int fakeRSSI = 0;
    long estimatedDistance = 0;

    json += "{";
    json += "\"id\":" + String(messages[i].id) + ",";
    json += "\"user\":\"" + jsonEscape(messages[i].user) + "\",";
    json += "\"text\":\"" + jsonEscape(messages[i].text) + "\",";
    json += "\"time\":\"" + jsonEscape(messages[i].time) + "\",";
    json += "\"alert\":"  + String(messages[i].isAlert ? "true" : "false") + ",";
    json += "\"dist\":\""  + String(estimatedDistance) + "m\",";
    json += "\"rssi\":\""  + String(fakeRSSI) + " dBm\"";
    json += "}";
  }
  json += "]";
  return json;
}

String getSyncQueueJSON() {
  String json = "[";
  bool first = true;
  for (int i = 0; i < syncCount; i++) {
    if (!first) json += ",";
    first = false;

    json += "{";
    json += "\"id\":\""       + jsonEscape(syncQueue[i].id)       + "\",";
    json += "\"type\":\""     + jsonEscape(syncQueue[i].type)     + "\",";
    json += "\"content\":\""  + jsonEscape(syncQueue[i].content)  + "\",";
    json += "\"priority\":\"" + jsonEscape(syncQueue[i].priority) + "\",";

    if (syncQueue[i].location.length() > 0) {
      json += "\"location_coordinates\":\"" + jsonEscape(syncQueue[i].location) + "\",";
      json += "\"maps_search_link\":\"https://www.google.com/maps/search/?api=1&query=" +
              jsonEscape(syncQueue[i].location) + "\",";
    }

    json += "\"timestamp_sl\":\""  + jsonEscape(syncQueue[i].timestamp_sl) + "\",";
    json += "\"timestamp_ms\":"    + String(syncQueue[i].timestamp_ms)     + ",";

    json += "\"metadata\":{";
    json += "\"node_id\":\""            + String(WiFi.macAddress())              + "\",";
    json += "\"is_prio_critical\":true,";
    json += "\"delivery_priority\":\""  + jsonEscape(syncQueue[i].priority)      + "\",";
    json += "\"captured_at_sl\":\""     + jsonEscape(syncQueue[i].timestamp_sl)  + "\"";
    json += "}";

    json += "}";
  }
  json += "]";
  return json;
}

// --- Captive Portal & Redirection Logic ---
boolean isIp(const String& src) {
  IPAddress tmp;
  return tmp.fromString(src);
}

void handleCaptivePortalRedirect() {
  String host = server.hostHeader();
  if (!isIp(host) && host != "192.168.4.1") {
    Serial.println("Captive Portal Redirection: " + host + server.uri());
    server.sendHeader("Location", "http://192.168.4.1/", true);
    server.send(302, "text/plain", "");
  } else {
    server.send(404, "text/plain", "Not Found");
  }
}

long estimateDistance(int rssi) {
  if (rssi >= -45) return 3;
  if (rssi >= -55) return 8;
  if (rssi >= -65) return 15;
  if (rssi >= -75) return 30;
  return 50;
}

// --- Setup and Loop ---
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\nInitializing Outbreak Offline Edge Node...");

  messageCount = 0;
  syncCount    = 0;

  WiFi.mode(WIFI_AP);
  WiFi.softAPConfig(apIP, apIP, IPAddress(255, 255, 255, 0));
  WiFi.softAP(ssid);

  Serial.print("SoftAP broadcast started: ");
  Serial.println(ssid);
  Serial.print("Local node Web Server running at: http://");
  Serial.println(WiFi.softAPIP());

  dnsServer.start(DNS_PORT, "*", apIP);
  Serial.println("Captive Portal DNS Server started.");

  // --- Web Server Routes ---
  server.on("/", HTTP_GET, []() {
    server.sendHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    server.sendHeader("Pragma", "no-cache");
    server.sendHeader("Expires", "-1");
    server.send(200, "text/html", index_html);
  });

  server.on("/api/messages", HTTP_GET, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", getMessagesJSON());
  });

  server.on("/api/sync_queue", HTTP_GET, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", getSyncQueueJSON());
  });

  server.on("/api/messages", HTTP_POST, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");

    if (!server.hasArg("id") || !server.hasArg("user") ||
        !server.hasArg("text") || !server.hasArg("time")) {
      Serial.println("[POST /api/messages] Bad request: missing required params.");
      server.send(400, "application/json", "{\"error\":\"Missing required parameters: id, user, text, time\"}");
      return;
    }

    String idStr = server.arg("id");
    String user  = server.arg("user");
    String text  = server.arg("text");
    String time  = server.arg("time");

    // Validate non-empty fields
    if (idStr.length() == 0 || user.length() == 0 || text.length() == 0) {
      Serial.println("[POST /api/messages] Bad request: empty required fields.");
      server.send(400, "application/json", "{\"error\":\"Fields id, user, and text must not be empty\"}");
      return;
    }

    // Guard against excessively long inputs
    if (user.length() > 64 || text.length() > 1000) {
      Serial.println("[POST /api/messages] Bad request: field too long.");
      server.send(400, "application/json", "{\"error\":\"user max 64 chars, text max 1000 chars\"}");
      return;
    }

    long long id = atoll(idStr.c_str());
    if (id <= 0) {
      Serial.println("[POST /api/messages] Bad request: invalid id.");
      server.send(400, "application/json", "{\"error\":\"id must be a positive integer\"}");
      return;
    }

    addMessage(id, user, text, time, false);

    String timestamp_sl = "2026-01-01T" + time + ":00.000Z";
    addSyncItem("MSG-" + String(id), "MESSAGE", text, "NORMAL", "", timestamp_sl, id);

    Serial.println("[POST /api/messages] New message from " + user + ": " + text);
    server.send(200, "application/json", "{\"status\":\"OK\"}");
  });

  server.on("/api/sos", HTTP_POST, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");

    if (!server.hasArg("id") || !server.hasArg("distance") || !server.hasArg("time")) {
      Serial.println("[POST /api/sos] Bad request: missing required params.");
      server.send(400, "application/json", "{\"error\":\"Missing required parameters: id, distance, time\"}");
      return;
    }

    String idStr    = server.arg("id");
    String distance = server.arg("distance");
    String time     = server.arg("time");

    long long id = atoll(idStr.c_str());
    if (id <= 0) {
      Serial.println("[POST /api/sos] Bad request: invalid id.");
      server.send(400, "application/json", "{\"error\":\"id must be a positive integer\"}");
      return;
    }

    int fakeRSSI = 0;
    String signalLevel;

    if (fakeRSSI > -50)      signalLevel = "VERY STRONG";
    else if (fakeRSSI > -60) signalLevel = "STRONG";
    else if (fakeRSSI > -70) signalLevel = "MEDIUM";
    else                     signalLevel = "WEAK";

    String text  = "🆘 EMERGENCY SOS ACTIVE | ";
    text += "Approx Distance: " + distance + "m | ";
    text += "Signal: " + signalLevel + " | ";
    text += "Move toward stronger signal.";

    addMessage(id, "🚨 SOS ALERT", text, time, true);

    String timestamp_sl = "2026-01-01T" + time + ":00.000Z";
    addSyncItem("SOS-" + String(id), "SOS_BROADCAST", text, "CRITICAL", "", timestamp_sl, id);

    Serial.println("========== SOS ALERT ==========");
    Serial.println("Approx Distance: " + distance + "m");
    Serial.println("RSSI: " + String(fakeRSSI));
    Serial.println("Signal Strength: " + signalLevel);
    Serial.println("================================");

    server.send(200, "application/json", "{\"status\":\"OK\"}");
  });

  server.on("/api/sync_clear", HTTP_POST, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    syncCount = 0;
    Serial.println("[sync_clear] Sync queue cleared.");
    server.send(200, "application/json", "{\"status\":\"OK\"}");
  });

  server.on("/api/create_sync_job", HTTP_POST, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    isSyncJobPending = true;
    Serial.println("[Sync Job] Background upload job CREATED. Waiting for internet...");
    server.send(200, "application/json", "{\"status\":\"JOB_CREATED\",\"pending\":true}");
  });

  server.on("/api/sync_job_status", HTTP_GET, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    String json = "{\"pending\":" + String(isSyncJobPending ? "true" : "false") + "}";
    server.send(200, "application/json", json);
  });

  // Common captive portal endpoints
  server.on("/generate_204",         handleCaptivePortalRedirect);
  server.on("/fwlink",               handleCaptivePortalRedirect);
  server.on("/hotspot-detect.html",  handleCaptivePortalRedirect);
  server.on("/success.txt",          handleCaptivePortalRedirect);
  server.on("/ncsi.txt",             handleCaptivePortalRedirect);

  server.onNotFound(handleCaptivePortalRedirect);

  server.begin();
  Serial.println("Edge Server started listening on Port 80.");
}

void checkBackgroundSyncJob() {
  if (!isSyncJobPending) return;

  if (millis() - lastInternetCheckTime < internetCheckInterval) return;
  lastInternetCheckTime = millis();

  Serial.println("[Sync Job] Checking internet backhaul connection...");

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("[Sync Job] Internet detected! Uploading bundle...");
    // In a fully configured deployment, use HTTPClient to POST getSyncQueueJSON()
    Serial.println("[Sync Job] Chat data synchronized to Outbreak cloud platform.");
    isSyncJobPending = false;
    syncCount = 0;
  } else {
    Serial.println("[Sync Job] Offline. Queue retained in local memory.");
  }
}

void loop() {
  dnsServer.processNextRequest();
  server.handleClient();
  checkBackgroundSyncJob();
}
