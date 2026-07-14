#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <LoRa.h>
#include <math.h>
#include <time.h>
#include <esp_wifi.h>
#include <esp_netif.h>

// --- Configuration ---
const char* ssid = "Outbreak-WIFI-AP";

// --- LoRa Ra-02 (SX1278, 433 MHz) SPI wiring ---
// ESP32-S3-DevKitC-1 safe GPIOs: avoids strapping pins (0/3/45/46), the
// native USB D+/D- (19/20), flash SPI (26-32) and octal-PSRAM (33-37).
// Rewiring to a different board only requires editing these six defines.
#define LORA_SCK            12
#define LORA_MISO           13
#define LORA_MOSI           11
#define LORA_NSS            10
#define LORA_RST             9
#define LORA_DIO0           14
#define LORA_FREQ           433E6
#define LORA_SYNC_WORD      0x4F   // 'O' - isolates the Outbreak LoRa network
#define LORA_TX_POWER_DBM   10     // benchtop-safe; raise toward 17 for range tests
#define BEACON_INTERVAL_MS  15000UL
#define PEER_TIMEOUT_MS     45000UL
#define LORA_MIN_TX_GAP_MS  2000UL
// Hardware note: the Ra-02/SX1278 module is 3.3V-ONLY on VCC and every logic
// pin - never power it from 5V. TX bursts draw ~120mA; add a 100uF capacitor
// across VCC/GND if the board resets while transmitting. NEVER key the
// transmitter with the antenna disconnected (it will damage the PA).

// --- Backhaul WiFi (AP+STA mode — connects to router for internet) ---
const char* STA_SSID     = "Galaxy M33 5G 720F";
const char* STA_PASSWORD = "ihan1111";

// --- Supabase Configuration ---
const char* SUPABASE_URL = "https://cemupemxchhgtqtsgats.supabase.co";
const char* SUPABASE_KEY = "sb_publishable_4dwwLlhgfRhaWGFPPLfbmg_3JR5dff2";
const char* NODE_USER_ID = "00000000-0000-0000-0000-000000000001";
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
  int rssi;       // 0 = posted locally (not received via LoRa)
  long distM;      // 0 = posted locally
  String origin;  // "" = local, else the LoRa node4 of the sender
};

struct SyncItem {
  String id;
  String type;
  String content;
  String priority;
  String location;
  String timestamp_sl;
  long long timestamp_ms;
  String user;        // nickname of the sender (edge_messages.peer_nick)
  String originNode;  // LoRa origin node4 if relayed, else "" for local
  int rssi;
  long distM;
};

const int MAX_MESSAGES = 50;
Message messages[MAX_MESSAGES];
int messageCount = 0;

const int MAX_SYNC = 100;
SyncItem syncQueue[MAX_SYNC];
int syncCount = 0;

// --- LoRa Peer & Dedup State ---
struct Peer {
  String node4;
  int rssi;
  long distM;
  unsigned long lastSeenMs;
};
const int MAX_PEERS = 8;
Peer peers[MAX_PEERS];
int peerRecordCount = 0;

const int MAX_SEEN_IDS = 16;
String seenFrameIds[MAX_SEEN_IDS];
int seenFrameIdx = 0;

// --- WiFi peer nicknames (browser nick registered per DHCP client IP) ---
struct PeerNickEntry {
  String ip;
  String nick;
  unsigned long lastSeenMs;
};
const int MAX_NICKS = 12;
PeerNickEntry peerNicks[MAX_NICKS];
int peerNickCount = 0;

bool loraOk = false;
unsigned long lastBeaconMs = 0;
unsigned long lastLoraTxMs = 0;
unsigned int beaconSeq = 0;

// --- Background Sync Job State ---
bool isSyncJobPending = false;
bool forceSyncCheck = false;
unsigned long lastInternetCheckTime = 0;
const unsigned long internetCheckInterval = 10000;

// --- WiFi Reconnection State ---
unsigned long lastReconnectAttempt = 0;
const unsigned long RECONNECT_INTERVAL = 15000; // 15 seconds between auto attempts
bool isReconnecting = false;

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
        <!-- Backhaul status indicator -->
        <div id="connIndicator" class="node-tag" style="display:flex;align-items:center;gap:6px;padding:6px 12px;font-weight:600;font-size:12px;">
          <span style="color:#94a3b8;font-size:16px;line-height:1">●</span>
          <span>Checking...</span>
        </div>
        <!-- ADDED: manual reconnect button -->
        <button class="btn btn-ghost" id="reconnectBtn" onclick="manualReconnect()" title="Force backhaul reconnect">
          🔄 Reconnect
        </button>
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
        <div class="metric-card">
          <div class="metric-label">This Node</div>
          <div class="metric-value" id="nodeIdValue">--</div>
          <div class="metric-sub" id="nodeApValue" style="color: var(--text-muted)">Waiting for node...</div>
          <div class="metric-sub" id="nodeUptimeValue" style="color: var(--text-muted)">Uptime: --</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">WiFi Peers</div>
          <div class="metric-value" id="wifiPeerCount">--</div>
          <div class="metric-sub">Devices on this hotspot</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Peer Map</div>
          <svg id="peerRadar" viewBox="0 0 200 200" width="100%" style="display:block;margin-top:8px;"></svg>
          <div id="peerList" style="margin-top:8px;"></div>
          <div class="metric-sub" style="color: var(--text-muted); font-weight: 400">
            Distance from edge node, estimated via WiFi signal. Direction on
            the map is illustrative — move toward the node to find peers.
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-label">LoRa Signal</div>
          <div class="metric-value" id="signalStrengthValue">--</div>
          <div class="metric-sub" id="signalStrengthSub">Waiting for node...</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Broadcast Range</div>
          <div class="metric-value" id="broadcastRangeValue">--</div>
          <div class="metric-sub" id="broadcastRangeSub">Waiting for node...</div>
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
      <div style="display:flex;gap:8px;">
        <button class="btn btn-ghost" id="manualSyncBtn" onclick="manualCloudSync()" style="color:#0f172a;border-color:#0f172a;">
          ☁️ Sync to Cloud
        </button>
        <button
          class="btn btn-ghost"
          onclick="openSync()"
          style="color: var(--accent-red); border-color: var(--accent-red)"
        >
          Sync Manager
        </button>
      </div>
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
            id="modalManualSyncBtn"
            style="background:var(--accent-green);color:#fff;box-shadow:0 4px 12px rgba(34,197,94,0.3);"
            onclick="manualCloudSync()"
          >
            ☁️ SYNC TO CLOUD NOW
          </button>
          <button
            class="btn btn-ghost btn-lg"
            id="syncNowBtn"
            onclick="syncNow()"
          >
            GENERATE OFFLINE JSON
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

          requestAnimationFrame(function() {
            requestAnimationFrame(function() {
              toast.classList.add('show');
            });
          });

          var ms = duration || TOAST_DURATION[type] || 4000;
          var timer = setTimeout(function() { dismissToast(toast); }, ms);

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
      var isSending = false;
      var isSosBroadcasting = false;

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
      // Polls overlap on slow captive-portal links; the in-flight guard plus
      // a consecutive-failure threshold stops connect/disconnect toast spam.
      var isPollingFeed = false;
      var feedFailStreak = 0;
      var FEED_FAIL_THRESHOLD = 3;
      var everConnected = false;

      async function loadDataFromServer() {
        if (isPollingFeed) return;
        isPollingFeed = true;
        try {
          var resMsg = await fetchWithTimeout('/api/messages', {}, 5000);
          if (!resMsg.ok) {
            throw new Error('Server returned HTTP ' + resMsg.status);
          }
          feedFailStreak = 0;
          if (!isOfflineBackend) {
            isOfflineBackend = true;
            if (everConnected) {
              toastSuccess('Edge Node Reconnected', 'Connection to the node restored.');
            } else {
              toastSuccess('Connected to Edge Node', 'Live message feed active.');
            }
            everConnected = true;
          }

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
          var serverIds = new Set();
          var serverMessages = dataMsg.map(function(msg) {
            serverIds.add(msg.id);
            return Object.assign({}, msg, {
              isSelf: sentIds.indexOf(msg.id) !== -1 || msg.user === myNick
            });
          });

          if (Array.isArray(state.messages)) {
            state.messages.forEach(function(localMsg) {
              if (localMsg && localMsg.id && !serverIds.has(localMsg.id)) {
                serverMessages.push(localMsg);
              }
            });
          }

          serverMessages.sort(function(a, b) { return (a.id || 0) - (b.id || 0); });
          state.messages = serverMessages;
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
          feedFailStreak++;
          if (isOfflineBackend && feedFailStreak >= FEED_FAIL_THRESHOLD) {
            isOfflineBackend = false;
            console.warn('loadDataFromServer failed:', err.message);
            toastWarning('Edge Node Unreachable', 'Lost contact with the node. Retrying in the background...');
          } else if (!isOfflineBackend) {
            console.log('Edge node not reachable yet:', err.message);
          }
        } finally {
          isPollingFeed = false;
        }
      }

      // Poll node status for the backhaul indicator and sidebar metrics.
      // lastNodeStatus is cached so updateSyncUI() can reuse it without
      // firing its own /api/status request.
      var isPollingStatus = false;
      var lastNodeStatus = null;

      async function loadNodeStatus() {
        if (isPollingStatus) return;
        isPollingStatus = true;
        try {
          var res = await fetchWithTimeout('/api/status', {}, 4000);
          if (!res.ok) throw new Error('HTTP ' + res.status);
          var status = await res.json();
          lastNodeStatus = status;
          updateConnectionIndicator(status);
          updateNodeMetrics(status);
          updateSyncUI();
        } catch (err) {
          lastNodeStatus = null;
          updateConnectionIndicator(null);
          updateNodeMetrics(null);
        } finally {
          isPollingStatus = false;
        }
      }

      // Estimated distance from RSSI using the same log-distance path-loss
      // model as the firmware's estimateDistance() (see offlineMode.ino).
      function estimateDistanceJs(rssi) {
        var exponent = (10 - rssi - 31) / (10 * 2.7);
        var d = Math.pow(10, exponent);
        return Math.max(1, Math.min(5000, Math.round(d)));
      }

      function formatUptime(ms) {
        var s = Math.floor(ms / 1000);
        var d = Math.floor(s / 86400);
        var h = Math.floor((s % 86400) / 3600);
        var m = Math.floor((s % 3600) / 60);
        if (d > 0) return d + 'd ' + h + 'h';
        if (h > 0) return h + 'h ' + m + 'm';
        return m + 'm';
      }

      function setMetric(id, text) {
        var el = document.getElementById(id);
        if (el) el.innerText = text;
      }

      function updateNodeMetrics(status) {
        if (!status) {
          setMetric('nodeIdValue', 'Unreachable');
          setMetric('nodeApValue', 'No response from edge node');
          setMetric('nodeUptimeValue', 'Uptime: --');
          setMetric('wifiPeerCount', '--');
          setMetric('signalStrengthValue', '--');
          setMetric('signalStrengthSub', 'Node unreachable');
          setMetric('broadcastRangeValue', '--');
          setMetric('broadcastRangeSub', 'Node unreachable');
          return;
        }

        setMetric('nodeIdValue', 'Node ' + (status.node_id || '----'));
        setMetric('nodeApValue', 'AP ' + (status.ap_ip || '192.168.4.1'));
        setMetric('nodeUptimeValue', 'Uptime: ' + formatUptime(status.uptime_ms || 0));

        var wifiClients = status.wifi_clients || 0;
        setMetric('wifiPeerCount', wifiClients + (wifiClients === 1 ? ' Device' : ' Devices'));

        if (!status.lora_ok) {
          setMetric('signalStrengthValue', '--');
          setMetric('signalStrengthSub', 'LoRa radio offline');
          setMetric('broadcastRangeValue', '--');
          setMetric('broadcastRangeSub', 'LoRa radio offline');
          return;
        }

        var peerCount = status.lora_peers || 0;
        var rssi = status.lora_best_rssi || 0;

        if (peerCount === 0) {
          setMetric('signalStrengthValue', 'No Signal');
          setMetric('signalStrengthSub', 'No mesh nodes in range');
          setMetric('broadcastRangeValue', '--');
          setMetric('broadcastRangeSub', 'No mesh nodes in range');
        } else {
          setMetric('signalStrengthValue', rssi + ' dBm');
          setMetric('signalStrengthSub', 'Strongest of ' + peerCount + ' node(s)');
          setMetric('broadcastRangeValue', '~' + estimateDistanceJs(rssi) + 'm');
          setMetric('broadcastRangeSub', 'Estimated from RSSI');
        }
      }

      // ================================================================
      // WIFI PEER MAP
      // ================================================================
      // Radar-style view centered on the edge node. Radius = estimated
      // distance from the node (RSSI path-loss model on the firmware side).
      // RSSI has no bearing information, so each device gets a stable
      // placeholder angle derived from its id — direction is NOT real.
      var isPollingPeers = false;

      function peerAngle(id) {
        var h = 0;
        for (var i = 0; i < id.length; i++) {
          h = ((h << 5) - h + id.charCodeAt(i)) | 0;
        }
        return (Math.abs(h) % 360) * Math.PI / 180;
      }

      function renderPeerMap(peers) {
        var svg = document.getElementById('peerRadar');
        var list = document.getElementById('peerList');
        if (!svg || !list) return;

        if (!peers) {
          svg.innerHTML = '<text x="100" y="100" text-anchor="middle" font-size="11" fill="#94a3b8">Node unreachable</text>';
          list.innerHTML = '';
          return;
        }

        var maxDist = 10;
        peers.forEach(function(p) { if (p.dist_m > maxDist) maxDist = p.dist_m; });
        maxDist = Math.ceil(maxDist / 10) * 10;

        var rMax = 88;
        var parts = '';

        // Range rings with meter labels
        [1/3, 2/3, 1].forEach(function(frac) {
          var r = rMax * frac;
          parts += '<circle cx="100" cy="100" r="' + r.toFixed(1) + '" fill="none" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="3,3"/>';
          parts += '<text x="100" y="' + (100 - r - 2).toFixed(1) + '" text-anchor="middle" font-size="8" fill="#94a3b8">' + Math.round(maxDist * frac) + 'm</text>';
        });

        // Edge node at center
        parts += '<circle cx="100" cy="100" r="6" fill="#ef4444"/>';
        parts += '<text x="100" y="115" text-anchor="middle" font-size="8" font-weight="bold" fill="#64748b">EDGE NODE</text>';

        var listHtml = '';
        peers.forEach(function(p) {
          var angle = peerAngle(p.device);
          // Floor keeps very close peers from overlapping the center label
          var r = Math.max(0.22, Math.min(p.dist_m / maxDist, 1)) * rMax;
          var x = 100 + r * Math.cos(angle);
          var y = 100 + r * Math.sin(angle);
          var isSelf = !!p.self;
          var color = isSelf ? '#3b82f6' : '#22c55e';
          var label = p.nick ? p.nick : 'Device-' + p.device.replace(':', '');
          if (isSelf) label += ' (You)';

          parts += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="5" fill="' + color + '" stroke="white" stroke-width="1.5"/>';
          parts += '<text x="' + x.toFixed(1) + '" y="' + (y - 8).toFixed(1) + '" text-anchor="middle" font-size="8" font-weight="bold" fill="#334155">' + escapeHtml(label) + '</text>';

          listHtml +=
            '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--border);font-size:12px;">' +
              '<span style="font-weight:600;color:' + (isSelf ? '#3b82f6' : 'var(--text-main)') + '">' + escapeHtml(label) + '</span>' +
              '<span style="color:var(--text-muted)">~' + p.dist_m + 'm ∙ ' + p.rssi + ' dBm</span>' +
            '</div>';
        });

        if (peers.length === 0) {
          parts += '<text x="100" y="140" text-anchor="middle" font-size="10" fill="#94a3b8">No devices connected</text>';
          listHtml = '';
        }

        svg.innerHTML = parts;
        list.innerHTML = listHtml;
      }

      async function loadPeers() {
        if (isPollingPeers) return;
        isPollingPeers = true;
        try {
          var res = await fetchWithTimeout('/api/peers', {}, 4000);
          if (!res.ok) throw new Error('HTTP ' + res.status);
          var peers = await res.json();
          if (!Array.isArray(peers)) throw new Error('bad payload');
          renderPeerMap(peers);
        } catch (err) {
          renderPeerMap(null);
        } finally {
          isPollingPeers = false;
        }
      }

      // Registers this browser's nickname with the node so the peer map can
      // label this device instead of showing a bare MAC suffix.
      async function sayHello() {
        try {
          await fetchWithTimeout('/api/hello', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'nick=' + encodeURIComponent(myNick)
          }, 4000);
        } catch (e) {
          // Harmless: the device shows as Device-XXXX until the next attempt.
        }
      }

      function updateConnectionIndicator(status) {
        var el = document.getElementById('connIndicator');
        if (!el) return;
        if (!status) {
          el.innerHTML = '<span style="color:#ef4444;font-size:16px;line-height:1">●</span> <span>Node Offline</span>';
          el.style.borderColor = '#fca5a5';
          el.style.color = '#ef4444';
          el.style.background = '#fef2f2';
          return;
        }
        if (status.reconnecting) {
          el.innerHTML = '<span style="color:#f59e0b;font-size:16px;line-height:1">⟳</span> <span>Reconnecting...</span>';
          el.style.borderColor = '#fcd34d';
          el.style.color = '#92400e';
          el.style.background = '#fffbeb';
          return;
        }
        if (status.sta_connected) {
          el.innerHTML = '<span style="color:#22c55e;font-size:16px;line-height:1">●</span> <span>Backhaul: ' + escapeHtml(status.sta_ssid) + '</span>';
          el.style.borderColor = '#86efac';
          el.style.color = '#166534';
          el.style.background = '#f0fdf4';
        } else {
          el.innerHTML = '<span style="color:#f59e0b;font-size:16px;line-height:1">●</span> <span>AP Only (No Internet)</span>';
          el.style.borderColor = '#fcd34d';
          el.style.color = '#92400e';
          el.style.background = '#fffbeb';
        }
      }

      // ADDED: manual reconnect handler
      async function manualReconnect() {
        var btn = document.getElementById('reconnectBtn');
        if (btn) {
          btn.disabled = true;
          btn.textContent = 'Reconnecting...';
        }
        try {
          var res = await fetchWithTimeout('/api/reconnect', { method: 'POST' }, 8000);
          var data = await res.json();
          if (res.ok) {
            toastInfo('Reconnecting', data.message || 'Backhaul reconnect initiated...');
            // Poll status faster for a few seconds to show live feedback
            var checks = 0;
            var interval = setInterval(async function() {
              checks++;
              if (checks > 6) clearInterval(interval);
              await loadNodeStatus();
            }, 1500);
          } else {
            toastError('Reconnect Failed', data.error || 'Could not trigger reconnect.');
          }
        } catch (e) {
          console.error('manualReconnect error:', e);
          toastError('Reconnect Failed', 'Could not reach node. ' + (e.message || ''));
        } finally {
          if (btn) {
            btn.disabled = false;
            btn.textContent = '🔄 Reconnect';
          }
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
                toastSuccess('Message Sent', 'Shared with all devices connected to this node.');
                return;
              } else {
                var errBody = '';
                try { errBody = await res.text(); } catch(_) {}
                throw new Error('Server error ' + res.status + (errBody ? ': ' + errBody : ''));
              }
            } catch (fetchErr) {
              console.error('POST /api/messages failed, falling back to local:', fetchErr.message);
              toastWarning('Node Unreachable', 'Message saved on this device — will sync when reconnected.');
            }
          }

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
          toastInfo('Message Saved Locally', 'It will be delivered when the node connection is restored.');

        } catch (e) {
          console.error('sendMessage unexpected error:', e);
          toastError('Send Failed', 'Unexpected error: ' + (e.message || 'unknown'));
        } finally {
          isSending = false;
          sendBtn.disabled = false;
        }
      }


      // ================================================================
      // QUICK SOS
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

          try {
            document.body.style.background = '#7f1d1d';
            setTimeout(function() { document.body.style.background = ''; }, 1200);
          } catch (_) {}

          try {
            if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 600]);
          } catch (_) {}

          var deliveredToNode = false;

          if (isOfflineBackend) {
            try {
              var res = await fetchWithTimeout('/api/sos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body:
                  'id=' + sosId +
                  '&time=' + encodeURIComponent(formatSLTime(slTime))
              }, 6000);

              if (res.ok) {
                deliveredToNode = true;
                await loadDataFromServer();
                toastSuccess('SOS Broadcast Sent', 'Alert stored on the edge node and queued for cloud sync.');
              } else {
                throw new Error('Server returned HTTP ' + res.status);
              }
            } catch (fetchErr) {
              console.error('quickSOS POST failed:', fetchErr.message);
              toastError('SOS Not Delivered', 'Edge node unreachable — alert saved on this device instead.');
            }
          } else {
            toastWarning('SOS Saved on This Device', 'No connection to the edge node. It will sync once reconnected.');
          }

          if (!deliveredToNode) {
            state.messages.push({
              id: sosId,
              user: '🚨 EMERGENCY',
              text: 'SOS ALERT — saved on this device, waiting for edge node connection.',
              time: formatSLTime(slTime),
              alert: true,
              queued: true,
            });
            state.syncQueue.push({
              id: 'SOS-' + sosId,
              type: 'SOS_BROADCAST',
              content: 'EMERGENCY SOS TRIGGERED (edge node unreachable at send time)',
              priority: 'CRITICAL',
              timestamp_sl: slTime.toISOString(),
              timestamp_ms: slTime.getTime()
            });
            renderFeed();
          }

          updateSyncUI();

        } catch (e) {
          console.error('quickSOS unexpected error:', e);
          toastError('SOS Error', 'Unexpected error: ' + (e.message || 'unknown'));
        } finally {
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
                toastSuccess('SOS Broadcast Sent', 'Alert stored on the edge node. Location: ' + location);
                return;
              } else {
                var errBody = '';
                try { errBody = await res.text(); } catch(_) {}
                throw new Error('Server error ' + res.status + (errBody ? ': ' + errBody : ''));
              }
            } catch (fetchErr) {
              console.error('triggerSOS POST failed, falling back:', fetchErr.message);
              toastError('SOS Not Delivered', 'Edge node unreachable — alert saved on this device instead.');
            }
          }

          state.syncQueue.push(sosData);
          state.messages.push({
            id: Date.now(),
            user: '🚨 EMERGENCY',
            text: 'SOS ALERT — saved on this device with location ' + location + ', waiting for edge node connection.',
            time: formatSLTime(slTime),
            alert: true,
            queued: true,
          });

          closeModal('sosModal');
          updateSyncUI();
          renderFeed();
          toastWarning('SOS Saved on This Device', 'It will sync once the node connection is restored.');

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
      // SYNC NOW  (offline JSON fallback)
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
            syncBtn.textContent = 'GENERATE OFFLINE JSON';
          }
        }
      }

      // ADDED: manual cloud sync handler
      async function manualCloudSync() {
        var btn = document.getElementById('manualSyncBtn');
        var modalBtn = document.getElementById('modalManualSyncBtn');
        if (btn) { btn.disabled = true; btn.textContent = 'Syncing...'; }
        if (modalBtn) { modalBtn.disabled = true; modalBtn.textContent = 'Syncing...'; }

        try {
          var res = await fetchWithTimeout('/api/manual_sync', { method: 'POST' }, 10000);
          var data = await res.json();
          if (res.ok) {
            toastSuccess('Cloud Sync Started', data.message || 'Upload job active. Data will be sent to Supabase shortly.');
            await loadNodeStatus();
            updateSyncUI();
          } else {
            toastError('Sync Failed', data.error || 'Server could not start sync job.');
          }
        } catch (e) {
          console.error('manualCloudSync error:', e);
          toastError('Sync Failed', 'Could not reach edge node. ' + (e.message || ''));
        } finally {
          if (btn) { btn.disabled = false; btn.textContent = '☁️ Sync to Cloud'; }
          if (modalBtn) { modalBtn.disabled = false; modalBtn.textContent = '☁️ SYNC TO CLOUD NOW'; }
        }
      }


      // ================================================================
      // UI UTILITIES
      // ================================================================
      // Reads the status cached by loadNodeStatus() — never fetches on its own.
      function updateSyncUI() {
        try {
          var count = Array.isArray(state.syncQueue) ? state.syncQueue.length : 0;
          if (lastNodeStatus && typeof lastNodeStatus.queue_count === 'number') {
            count = lastNodeStatus.queue_count;
          }
          queueCountEl.innerText = count + ' Items';
          modalQueueCountEl.innerText = count;
          var progress = Math.min(count * 5, 100);
          syncProgressEl.style.width = (count === 0 ? 0 : 20 + progress) + '%';

          var isJobPending = !!(lastNodeStatus && lastNodeStatus.sync_job_pending);
          var syncStatusLabel = document.querySelector('.sync-status span');
          if (syncStatusLabel) {
            if (isJobPending) {
              syncStatusLabel.innerHTML = '⏳ Upload job active — uploads when internet is available';
              syncStatusLabel.style.color = 'var(--accent-green)';
              syncProgressEl.style.background = 'var(--accent-green)';
            } else {
              syncStatusLabel.innerHTML = 'Cloud Sync Pending';
              syncStatusLabel.style.color = '';
              syncProgressEl.style.background = '';
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

      document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
        overlay.addEventListener('click', function(e) {
          if (e.target === overlay) {
            overlay.style.display = 'none';
          }
        });
      });

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
        sayHello().then(loadPeers);
        loadDataFromServer();
        loadNodeStatus();
        updateSyncUI();
        renderFeed();
      } catch (e) {
        console.error('Init error:', e);
        toastError('Init Failed', 'Could not start edge node UI.');
      }

      // The ESP32 web server handles one request at a time (and also serves
      // captive-portal probes), so keep polling modest to avoid timeouts.
      setInterval(function() {
        try {
          loadDataFromServer();
        } catch (e) { console.error('Poll error:', e); }
      }, 2500);

      setInterval(function() {
        try {
          loadNodeStatus();
        } catch (e) { console.error('Status poll error:', e); }
      }, 5000);

      setInterval(function() {
        try {
          loadPeers();
        } catch (e) { console.error('Peer poll error:', e); }
      }, 6000);

      // Re-register the nickname periodically (covers node reboots and
      // DHCP lease changes).
      setInterval(function() {
        try {
          sayHello();
        } catch (e) { console.error('Hello error:', e); }
      }, 30000);

    </script>
  </body>
</html>)rawliteral";

// --- Database Operations ---
// Note: default arguments are deliberately NOT used here. Arduino's
// auto-prototype generator emits a forward declaration copied from this
// signature; if defaults were specified here, the compiler sees them twice
// (once in the generated prototype, once here) and errors with "default
// argument given for parameter N ... after previous specification".
// Every call site below passes all arguments explicitly instead.
void addMessage(long long id, const String& user, const String& text, const String& time, bool isAlert,
                int rssi, long distM, const String& origin) {
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
  newMsg.rssi    = rssi;
  newMsg.distM   = distM;
  newMsg.origin  = origin;

  if (messageCount < MAX_MESSAGES) {
    messages[messageCount++] = newMsg;
  } else {
    for (int i = 1; i < MAX_MESSAGES; i++) {
      messages[i - 1] = messages[i];
    }
    messages[MAX_MESSAGES - 1] = newMsg;
  }
}

// Same rationale as addMessage() above: no default arguments, all call
// sites pass every parameter explicitly.
void addSyncItem(const String& id, const String& type, const String& content,
                 const String& priority, const String& location,
                 const String& timestamp_sl, long long timestamp_ms,
                 const String& user, const String& originNode,
                 int rssi, long distM) {
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
  item.user         = user;
  item.originNode   = originNode;
  item.rssi         = rssi;
  item.distM        = distM;

  if (syncCount < MAX_SYNC) {
    syncQueue[syncCount++] = item;
  } else {
    for (int i = 1; i < MAX_SYNC; i++) {
      syncQueue[i - 1] = syncQueue[i];
    }
    syncQueue[MAX_SYNC - 1] = item;
  }
}

// Message ids are the sending client's Date.now() (Unix epoch ms), so a valid
// ISO-8601 UTC timestamp can be derived from them. Postgres rejects the
// locale-formatted wall-clock time ("11:47 AM") the UI sends, so this is the
// only reliable source for the captured_at_sl column.
String isoFromEpochMs(long long ms) {
  if (ms < 100000000000LL) return "1970-01-01T00:00:00.000Z"; // not epoch ms
  time_t secs = (time_t)(ms / 1000);
  int msPart = (int)(ms % 1000);
  struct tm t;
  gmtime_r(&secs, &t);
  char buf[32];
  snprintf(buf, sizeof(buf), "%04d-%02d-%02dT%02d:%02d:%02d.%03dZ",
           t.tm_year + 1900, t.tm_mon + 1, t.tm_mday,
           t.tm_hour, t.tm_min, t.tm_sec, msPart);
  return String(buf);
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

    json += "{";
    json += "\"id\":" + String(messages[i].id) + ",";
    json += "\"user\":\"" + jsonEscape(messages[i].user) + "\",";
    json += "\"text\":\"" + jsonEscape(messages[i].text) + "\",";
    json += "\"time\":\"" + jsonEscape(messages[i].time) + "\",";
    json += "\"alert\":"  + String(messages[i].isAlert ? "true" : "false") + ",";
    // "" (falsy in JS) for messages posted locally on this node; real
    // RSSI/distance for messages received over LoRa from another node.
    if (messages[i].origin.length() > 0) {
      json += "\"dist\":\"~" + String(messages[i].distM) + "m via LoRa\",";
      json += "\"rssi\":\"" + String(messages[i].rssi) + " dBm\"";
    } else {
      json += "\"dist\":\"\",";
      json += "\"rssi\":\"\"";
    }
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

// Log-distance path-loss estimate for 433MHz LoRa: d = 10^((Tx + Gant - RSSI - PL0) / (10*n))
// PL0 ~= 31dB @ 1m for 433MHz, n = 2.7 (semi-rural/mixed terrain). This is an
// order-of-magnitude estimate, not a precise measurement - cite the model
// (not the module) when reporting distances.
long estimateDistance(int rssi) {
  float exponent = (LORA_TX_POWER_DBM - rssi - 31.0) / (10.0 * 2.7);
  float distance = pow(10.0, exponent);
  if (distance < 1) distance = 1;
  if (distance > 5000) distance = 5000;
  return (long)distance;
}

// --- WiFi Peer Map (users connected to the SoftAP) ---
// Log-distance path-loss for 2.4GHz WiFi: PL0 ~= 40dB @ 1m, n = 3.0 (indoor,
// bodies and walls). Same caveat as the LoRa model: order-of-magnitude
// estimate. RSSI carries no bearing, so this yields distance only.
long estimateWifiDistance(int rssi) {
  float exponent = (-40.0 - (float)rssi) / (10.0 * 3.0);
  float d = pow(10.0, exponent);
  if (d < 1) d = 1;
  if (d > 300) d = 300;
  return (long)d;
}

void upsertPeerNick(const String& ip, const String& nick) {
  unsigned long now = millis();
  for (int i = 0; i < peerNickCount; i++) {
    if (peerNicks[i].ip == ip) {
      peerNicks[i].nick = nick;
      peerNicks[i].lastSeenMs = now;
      return;
    }
  }
  if (peerNickCount < MAX_NICKS) {
    peerNicks[peerNickCount].ip = ip;
    peerNicks[peerNickCount].nick = nick;
    peerNicks[peerNickCount].lastSeenMs = now;
    peerNickCount++;
  } else {
    int oldestIdx = 0;
    unsigned long oldest = peerNicks[0].lastSeenMs;
    for (int i = 1; i < MAX_NICKS; i++) {
      if (peerNicks[i].lastSeenMs < oldest) { oldest = peerNicks[i].lastSeenMs; oldestIdx = i; }
    }
    peerNicks[oldestIdx].ip = ip;
    peerNicks[oldestIdx].nick = nick;
    peerNicks[oldestIdx].lastSeenMs = now;
  }
}

String nickForIp(const String& ip) {
  for (int i = 0; i < peerNickCount; i++) {
    if (peerNicks[i].ip == ip) return peerNicks[i].nick;
  }
  return "";
}

// Connected AP stations with per-client RSSI, estimated distance, and the
// nickname registered from that client's IP (via POST /api/hello). "self"
// marks the entry belonging to the requesting browser.
String getWifiPeersJSON(const String& requesterIp) {
  wifi_sta_list_t staList;
  if (esp_wifi_ap_get_sta_list(&staList) != ESP_OK) return "[]";

  esp_netif_t* apNetif = esp_netif_get_handle_from_ifkey("WIFI_AP_DEF");

  String json = "[";
  bool first = true;
  for (int i = 0; i < staList.num; i++) {
    char macBuf[18];
    snprintf(macBuf, sizeof(macBuf), "%02X:%02X:%02X:%02X:%02X:%02X",
             staList.sta[i].mac[0], staList.sta[i].mac[1], staList.sta[i].mac[2],
             staList.sta[i].mac[3], staList.sta[i].mac[4], staList.sta[i].mac[5]);
    String macStr(macBuf);

    // Resolve the station's DHCP lease so nick (keyed by IP) can be joined
    // with RSSI (keyed by MAC).
    String ipStr = "";
    if (apNetif != nullptr) {
      esp_netif_pair_mac_ip_t pair;
      memcpy(pair.mac, staList.sta[i].mac, 6);
      pair.ip.addr = 0;
      if (esp_netif_dhcps_get_clients_by_mac(apNetif, 1, &pair) == ESP_OK && pair.ip.addr != 0) {
        char ipBuf[16];
        snprintf(ipBuf, sizeof(ipBuf), IPSTR, IP2STR(&pair.ip));
        ipStr = ipBuf;
      }
    }

    int rssi = staList.sta[i].rssi;
    String nick = ipStr.length() > 0 ? nickForIp(ipStr) : "";

    if (!first) json += ",";
    first = false;
    json += "{";
    json += "\"device\":\"" + macStr.substring(12) + "\",";  // last 2 octets only
    json += "\"rssi\":" + String(rssi) + ",";
    json += "\"dist_m\":" + String(estimateWifiDistance(rssi)) + ",";
    json += "\"nick\":\"" + jsonEscape(nick) + "\",";
    json += "\"self\":" + String(ipStr.length() > 0 && ipStr == requesterIp ? "true" : "false");
    json += "}";
  }
  json += "]";
  return json;
}

// --- LoRa Identity, Peers & Dedup ---
String nodeId4() {
  String mac = WiFi.macAddress();
  mac.replace(":", "");
  return mac.substring(mac.length() - 4);
}

bool seenFrameBefore(const String& key) {
  for (int i = 0; i < MAX_SEEN_IDS; i++) {
    if (seenFrameIds[i] == key) return true;
  }
  return false;
}

void markFrameSeen(const String& key) {
  seenFrameIds[seenFrameIdx] = key;
  seenFrameIdx = (seenFrameIdx + 1) % MAX_SEEN_IDS;
}

void upsertPeer(const String& node4, int rssi, long distM) {
  unsigned long now = millis();
  for (int i = 0; i < peerRecordCount; i++) {
    if (peers[i].node4 == node4) {
      peers[i].rssi = rssi;
      peers[i].distM = distM;
      peers[i].lastSeenMs = now;
      return;
    }
  }
  if (peerRecordCount < MAX_PEERS) {
    peers[peerRecordCount].node4 = node4;
    peers[peerRecordCount].rssi = rssi;
    peers[peerRecordCount].distM = distM;
    peers[peerRecordCount].lastSeenMs = now;
    peerRecordCount++;
  } else {
    int oldestIdx = 0;
    unsigned long oldest = peers[0].lastSeenMs;
    for (int i = 1; i < MAX_PEERS; i++) {
      if (peers[i].lastSeenMs < oldest) { oldest = peers[i].lastSeenMs; oldestIdx = i; }
    }
    peers[oldestIdx].node4 = node4;
    peers[oldestIdx].rssi = rssi;
    peers[oldestIdx].distM = distM;
    peers[oldestIdx].lastSeenMs = now;
  }
}

int countActivePeers() {
  int count = 0;
  unsigned long now = millis();
  for (int i = 0; i < peerRecordCount; i++) {
    if (now - peers[i].lastSeenMs < PEER_TIMEOUT_MS) count++;
  }
  return count;
}

// Returns the strongest RSSI among currently-active peers, or 0 if none
// (0 dBm is not a valid LoRa reading, so it doubles as a "no peers" flag).
int bestPeerRssi() {
  int best = -999;
  bool found = false;
  unsigned long now = millis();
  for (int i = 0; i < peerRecordCount; i++) {
    if (now - peers[i].lastSeenMs < PEER_TIMEOUT_MS && peers[i].rssi > best) {
      best = peers[i].rssi;
      found = true;
    }
  }
  return found ? best : 0;
}

// --- LoRa TX (protocol: OB1|<type>|<node4>|...) ---
bool loraCanTransmit() {
  return loraOk && (millis() - lastLoraTxMs >= LORA_MIN_TX_GAP_MS);
}

void loraSendRaw(const String& frame) {
  if (!loraCanTransmit()) return;
  LoRa.beginPacket();
  LoRa.print(frame);
  LoRa.endPacket();
  lastLoraTxMs = millis();
}

void loraSendBeacon() {
  if (!loraCanTransmit()) return;
  beaconSeq++;
  loraSendRaw("OB1|B|" + nodeId4() + "|" + String(beaconSeq));
}

void loraBroadcastMessage(long long id, const String& nick, const String& text, const String& time) {
  if (!loraOk) return;
  String safeText = text.substring(0, 180);
  loraSendRaw("OB1|M|" + nodeId4() + "|" + String(id) + "|" + nick + "|" + time + "|" + safeText);
}

void loraBroadcastSOS(long long id, const String& time, const String& location, const String& text) {
  if (!loraOk) return;
  String safeText = text.substring(0, 160);
  String loc = location.length() > 0 ? location : "0,0";
  loraSendRaw("OB1|S|" + nodeId4() + "|" + String(id) + "|" + time + "|" + loc + "|" + safeText);
}

// Splits a '|'-delimited frame into up to maxParts pieces. The final piece
// keeps any remaining '|' characters intact (free-text message body).
int splitFrame(const String& frame, String* parts, int maxParts) {
  int count = 0;
  int start = 0;
  while (count < maxParts - 1) {
    int idx = frame.indexOf('|', start);
    if (idx < 0) break;
    parts[count++] = frame.substring(start, idx);
    start = idx + 1;
  }
  parts[count++] = frame.substring(start);
  return count;
}

// --- LoRa RX (polled from loop(), not an ISR - the sketch's heavy String
// use is not interrupt-safe with arduino-LoRa's onReceive callback) ---
void loraPoll() {
  if (!loraOk) return;
  int packetSize = LoRa.parsePacket();
  if (packetSize == 0) return;

  String frame = "";
  while (LoRa.available()) {
    frame += (char)LoRa.read();
  }
  int rssi = LoRa.packetRssi();

  String parts[8];
  int n = splitFrame(frame, parts, 8);
  if (n < 3 || parts[0] != "OB1") return;

  String type = parts[1];
  String origin = parts[2];
  if (origin == nodeId4()) return; // ignore our own echoes

  long distM = estimateDistance(rssi);
  upsertPeer(origin, rssi, distM);

  if (type == "B") return; // beacon: peer table already updated above

  if (type == "M" && n >= 7) {
    String msgId = parts[3];
    String nick  = parts[4];
    String time  = parts[5];
    String text  = parts[6];
    String dedupKey = origin + ":m:" + msgId;
    if (seenFrameBefore(dedupKey)) return;
    markFrameSeen(dedupKey);

    long long idNum = atoll(msgId.c_str());
    addMessage(idNum, nick + " (LoRa)", text, time, false, rssi, distM, origin);
    String timestamp_sl = isoFromEpochMs(idNum);
    addSyncItem("MSG-" + origin + "-" + msgId, "MESSAGE", text, "NORMAL", "", timestamp_sl, idNum, nick, origin, rssi, distM);
    Serial.println("[LoRa RX] Message relayed from " + origin + " (RSSI " + String(rssi) + ")");
  }

  if (type == "S" && n >= 7) {
    String msgId = parts[3];
    String time  = parts[4];
    String loc   = parts[5];
    String text  = parts[6];
    String dedupKey = origin + ":s:" + msgId;
    if (seenFrameBefore(dedupKey)) return;
    markFrameSeen(dedupKey);

    long long idNum = atoll(msgId.c_str());
    String fullText = "🆘 RELAYED SOS from " + origin + " | " + text;
    addMessage(idNum, "🚨 SOS ALERT (LoRa)", fullText, time, true, rssi, distM, origin);
    String timestamp_sl = isoFromEpochMs(idNum);
    addSyncItem("SOS-" + origin + "-" + msgId, "SOS_BROADCAST", fullText, "CRITICAL", loc, timestamp_sl, idNum, "", origin, rssi, distM);
    Serial.println("[LoRa RX] SOS relayed from " + origin + " (RSSI " + String(rssi) + ")");
  }
}

// --- WiFi AP client events (serial visibility for hotspot joins/leaves) ---
void onWiFiEvent(WiFiEvent_t event, WiFiEventInfo_t info) {
  switch (event) {
    case ARDUINO_EVENT_WIFI_AP_STACONNECTED:
      Serial.printf("[AP] Device joined hotspot. Connected clients: %d\n", WiFi.softAPgetStationNum());
      break;
    case ARDUINO_EVENT_WIFI_AP_STADISCONNECTED:
      Serial.printf("[AP] Device left hotspot. Connected clients: %d\n", WiFi.softAPgetStationNum());
      break;
    default:
      break;
  }
}

// --- WiFi Reconnection Logic ---
void handleWiFiReconnect() {
  if (WiFi.status() == WL_CONNECTED) {
    if (isReconnecting) {
      isReconnecting = false;
      Serial.println("[WiFi] Backhaul restored.");
    }
    return;
  }

  unsigned long now = millis();
  if (now - lastReconnectAttempt < RECONNECT_INTERVAL) return;

  lastReconnectAttempt = now;
  isReconnecting = true;

  Serial.println("[WiFi] Backhaul disconnected. Triggering reconnect...");
  WiFi.reconnect();
}

// --- Setup and Loop ---
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\nInitializing Outbreak Offline Edge Node...");

  messageCount = 0;
  syncCount    = 0;

  // AP+STA: broadcast local portal AND connect to router for internet backhaul
  WiFi.onEvent(onWiFiEvent);
  WiFi.mode(WIFI_AP_STA);
  WiFi.softAPConfig(apIP, apIP, IPAddress(255, 255, 255, 0));
  WiFi.softAP(ssid);

  Serial.print("SoftAP broadcast started: ");
  Serial.println(ssid);
  Serial.print("Local node Web Server running at: http://");
  Serial.println(WiFi.softAPIP());

  // Enable auto-reconnect so the ESP32 tries to rejoin automatically
  WiFi.setAutoReconnect(true);

  Serial.print("Connecting to backhaul WiFi: ");
  Serial.println(STA_SSID);
  WiFi.begin(STA_SSID, STA_PASSWORD);

  // --- LoRa Ra-02 (SX1278) init ---
  // ESP32-S3's default SPI pin mapping differs from classic ESP32 and from
  // most tutorials, so pins are always passed explicitly here.
  SPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_NSS);
  LoRa.setPins(LORA_NSS, LORA_RST, LORA_DIO0);
  loraOk = LoRa.begin(LORA_FREQ);
  if (loraOk) {
    LoRa.setSyncWord(LORA_SYNC_WORD);
    LoRa.enableCrc();
    LoRa.setSpreadingFactor(7);
    LoRa.setSignalBandwidth(125E3);
    LoRa.setTxPower(LORA_TX_POWER_DBM);
    LoRa.setSPIFrequency(8E6); // safe margin under the SX1278's 10MHz limit
    Serial.println("[LoRa] Init OK (433 MHz, node " + nodeId4() + ")");
  } else {
    // Module absent or miswired: the rest of the node (WiFi AP, web portal,
    // cloud sync) keeps working normally without LoRa.
    Serial.println("[LoRa] Init FAILED - module not detected. Continuing without LoRa.");
  }

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

  server.on("/api/status", HTTP_GET, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    String staIpStr = "null";
    if (WiFi.status() == WL_CONNECTED) {
      staIpStr = "\"" + WiFi.localIP().toString() + "\"";
    }
    String json = "{";
    json += "\"sta_connected\":" + String(WiFi.status() == WL_CONNECTED ? "true" : "false") + ",";
    json += "\"sta_ssid\":\"" + jsonEscape(String(STA_SSID)) + "\",";
    json += "\"sta_ip\":" + staIpStr + ",";
    json += "\"ap_ip\":\"" + WiFi.softAPIP().toString() + "\",";
    json += "\"node_id\":\"" + nodeId4() + "\",";
    json += "\"wifi_clients\":" + String(WiFi.softAPgetStationNum()) + ",";
    json += "\"mac\":\"" + WiFi.macAddress() + "\",";
    json += "\"queue_count\":" + String(syncCount) + ",";
    json += "\"sync_job_pending\":" + String(isSyncJobPending ? "true" : "false") + ",";
    json += "\"reconnecting\":" + String(isReconnecting ? "true" : "false") + ",";
    json += "\"lora_ok\":" + String(loraOk ? "true" : "false") + ",";
    json += "\"lora_peers\":" + String(countActivePeers()) + ",";
    json += "\"lora_best_rssi\":" + String(bestPeerRssi()) + ",";
    json += "\"uptime_ms\":" + String(millis());
    json += "}";
    server.send(200, "application/json", json);
  });

  server.on("/api/peers", HTTP_GET, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    String requesterIp = server.client().remoteIP().toString();
    server.send(200, "application/json", getWifiPeersJSON(requesterIp));
  });

  // Browsers register their nickname here so /api/peers can label devices.
  server.on("/api/hello", HTTP_POST, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    String nick = server.hasArg("nick") ? server.arg("nick") : "";
    if (nick.length() == 0 || nick.length() > 32) {
      server.send(400, "application/json", "{\"error\":\"nick must be 1-32 chars\"}");
      return;
    }
    upsertPeerNick(server.client().remoteIP().toString(), nick);
    server.send(200, "application/json", "{\"status\":\"OK\"}");
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

    if (idStr.length() == 0 || user.length() == 0 || text.length() == 0) {
      Serial.println("[POST /api/messages] Bad request: empty required fields.");
      server.send(400, "application/json", "{\"error\":\"Fields id, user, and text must not be empty\"}");
      return;
    }

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

    addMessage(id, user, text, time, false, 0, 0, "");
    loraBroadcastMessage(id, user, text, time);

    String timestamp_sl = isoFromEpochMs(id);
    addSyncItem("MSG-" + String(id), "MESSAGE", text, "NORMAL", "", timestamp_sl, id, user, "", 0, 0);

    Serial.println("[POST /api/messages] New message from " + user + ": " + text);
    server.send(200, "application/json", "{\"status\":\"OK\"}");
  });

  server.on("/api/sos", HTTP_POST, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");

    if (!server.hasArg("id") || !server.hasArg("time")) {
      Serial.println("[POST /api/sos] Bad request: missing required params.");
      server.send(400, "application/json", "{\"error\":\"Missing required parameters: id, time\"}");
      return;
    }

    String idStr    = server.arg("id");
    // "location" is optional: only triggerSOS() (GPS-confirmed modal flow) sends it.
    String location = server.hasArg("location") ? server.arg("location") : "";
    String time      = server.arg("time");

    long long id = atoll(idStr.c_str());
    if (id <= 0) {
      Serial.println("[POST /api/sos] Bad request: invalid id.");
      server.send(400, "application/json", "{\"error\":\"id must be a positive integer\"}");
      return;
    }

    // Alert text is composed entirely from real radio state on this node
    // (0 dBm = no LoRa peers heard, not a valid reading).
    int rssi = bestPeerRssi();
    String text = "🆘 EMERGENCY SOS ACTIVE | ";
    if (rssi == 0) {
      text += "No LoRa mesh nodes in range. Alert stored on this node and queued for cloud sync.";
    } else {
      String signalLevel;
      if (rssi > -50)      signalLevel = "VERY STRONG";
      else if (rssi > -60) signalLevel = "STRONG";
      else if (rssi > -70) signalLevel = "MEDIUM";
      else                 signalLevel = "WEAK";
      long distM = estimateDistance(rssi);
      text += "Relayed over LoRa mesh | Nearest node: ~" + String(distM) + "m | Signal: " + signalLevel + " (" + String(rssi) + " dBm)";
    }
    if (location.length() > 0) {
      text += " | GPS: " + location;
    }

    addMessage(id, "🚨 SOS ALERT", text, time, true, 0, 0, "");

    String timestamp_sl = isoFromEpochMs(id);
    addSyncItem("SOS-" + String(id), "SOS_BROADCAST", text, "CRITICAL", location, timestamp_sl, id, "", "", 0, 0);

    loraBroadcastSOS(id, time, location, text);

    Serial.println("========== SOS ALERT ==========");
    if (rssi == 0) {
      Serial.println("LoRa peers in range: none");
    } else {
      Serial.println("Best LoRa peer RSSI: " + String(rssi) + " dBm");
      Serial.println("Est. nearest node distance: ~" + String(estimateDistance(rssi)) + "m");
    }
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

  server.on("/api/manual_sync", HTTP_POST, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    if (WiFi.status() != WL_CONNECTED) {
      server.send(503, "application/json", "{\"error\":\"No internet backhaul. STA not connected to " + jsonEscape(String(STA_SSID)) + ".\"}");
      return;
    }
    isSyncJobPending = true;
    forceSyncCheck = true;
    Serial.println("[Manual Sync] Triggered by user via web UI.");
    server.send(200, "application/json", "{\"status\":\"SYNC_TRIGGERED\",\"message\":\"Upload job started. Check queue status for results.\"}");
  });

  // ADDED: manual reconnect endpoint
  server.on("/api/reconnect", HTTP_POST, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    Serial.println("[WiFi] Manual reconnect triggered via web UI.");
    
    lastReconnectAttempt = 0; // Reset throttle so handleWiFiReconnect runs immediately
    isReconnecting = true;
    WiFi.reconnect();
    
    server.send(200, "application/json", "{\"status\":\"RECONNECTING\",\"message\":\"Backhaul reconnect initiated.\"}");
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

// --- Supabase HTTP POST helper ---
// preferHeader: pass "" for a plain insert, or a PostgREST "Prefer" value
// (e.g. "resolution=ignore-duplicates") for idempotent upserts.
int supabasePost(const String& endpoint, const String& jsonBody, const String& preferHeader) {
  if (WiFi.status() != WL_CONNECTED) return -1;

  HTTPClient http;
  String url = String(SUPABASE_URL) + endpoint;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", "Bearer " + String(SUPABASE_KEY));
  if (preferHeader.length() > 0) {
    http.addHeader("Prefer", preferHeader);
  }

  int httpCode = http.POST(jsonBody);

  if (httpCode > 0) {
    Serial.printf("[Supabase] POST %s -> HTTP %d\n", endpoint.c_str(), httpCode);
    if (httpCode >= 400) {
      String response = http.getString();
      Serial.println("[Supabase] Error Response: " + response);
    }
  } else {
    Serial.printf("[Supabase] POST %s failed, HTTPClient error: %s\n", endpoint.c_str(), http.errorToString(httpCode).c_str());
  }

  http.end();
  return httpCode;
}

bool uploadMessagesToSupabase() {
  bool allOk = true;
  String macAddr = WiFi.macAddress();

  for (int i = 0; i < syncCount; i++) {
    if (syncQueue[i].type != "MESSAGE") continue;

    // Fix: peer_nick previously serialized the same field as message_text
    // (both read from syncQueue[i].content) because SyncItem had no
    // dedicated user field. It now does.
    String peerNick = syncQueue[i].user.length() > 0 ? syncQueue[i].user : "Unknown";

    String body = "{";
    body += "\"node_id\":\""        + jsonEscape(macAddr)                   + "\",";
    body += "\"peer_nick\":\""      + jsonEscape(peerNick)                  + "\",";
    body += "\"message_text\":\""   + jsonEscape(syncQueue[i].content)      + "\",";
    body += "\"priority\":\""       + jsonEscape(syncQueue[i].priority)     + "\",";
    body += "\"captured_at_sl\":\"" + jsonEscape(syncQueue[i].timestamp_sl) + "\",";
    body += "\"timestamp_ms\":"     + String(syncQueue[i].timestamp_ms)     + ",";
    if (syncQueue[i].originNode.length() > 0) {
      // Relayed from another node over LoRa - record provenance and signal quality.
      body += "\"origin_node_id\":\"" + jsonEscape(syncQueue[i].originNode) + "\",";
      body += "\"rssi\":"             + String(syncQueue[i].rssi)          + ",";
      body += "\"distance_m\":"       + String(syncQueue[i].distM)         + ",";
    }
    body += "\"synced_from_queue\":true";
    body += "}";

    // on_conflict + ignore-duplicates makes retries after a partial-failure
    // cycle idempotent instead of creating duplicate rows.
    int code = supabasePost("/rest/v1/edge_messages?on_conflict=node_id,timestamp_ms", body, "resolution=ignore-duplicates,return=minimal");
    if (code < 200 || code > 299) {
      allOk = false;
      Serial.printf("[Supabase] Message item %d failed (HTTP %d), will retry next cycle.\n", i, code);
    }
  }
  return allOk;
}

bool uploadSOSToSupabase() {
  bool allOk = true;

  for (int i = 0; i < syncCount; i++) {
    if (syncQueue[i].type != "SOS_BROADCAST") continue;

    String latStr = "0.0";
    String lngStr = "0.0";
    String loc = syncQueue[i].location;
    int commaIdx = loc.indexOf(',');
    if (commaIdx > 0) {
      latStr = loc.substring(0, commaIdx);
      lngStr = loc.substring(commaIdx + 1);
    }

    String provenance = " | node=" + jsonEscape(WiFi.macAddress()) + " | captured=" + jsonEscape(syncQueue[i].timestamp_sl);
    if (syncQueue[i].originNode.length() > 0) {
      provenance += " | relayed_from=" + jsonEscape(syncQueue[i].originNode) + " | rssi=" + String(syncQueue[i].rssi) + "dBm";
    }

    String body = "{";
    body += "\"user_id\":\""        + String(NODE_USER_ID)                  + "\",";
    // sos_requests.stype enum only allows: medical, rescue, supplies, fire.
    body += "\"stype\":\"rescue\",";
    body += "\"latitude\":"         + latStr                                 + ",";
    body += "\"longitude\":"        + lngStr                                 + ",";
    body += "\"additional_info\":\"" + jsonEscape(syncQueue[i].content)     + provenance + "\",";
    body += "\"status\":\"active\"";
    body += "}";

    int code = supabasePost("/rest/v1/sos_requests", body, "");
    if (code < 200 || code > 299) {
      allOk = false;
      Serial.printf("[Supabase] SOS item %d failed (HTTP %d), will retry next cycle.\n", i, code);
    }
  }
  return allOk;
}

void checkBackgroundSyncJob() {
  if (!isSyncJobPending) return;

  if (!forceSyncCheck && (millis() - lastInternetCheckTime < internetCheckInterval)) return;
  forceSyncCheck = false;
  lastInternetCheckTime = millis();

  Serial.println("[Sync Job] Checking internet backhaul (STA) connection...");
  Serial.printf("[Sync Job] WiFi STA status: %d | Items in queue: %d\n", WiFi.status(), syncCount);

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[Sync Job] Not connected to backhaul WiFi. Queue retained.");
    return;
  }

  Serial.println("[Sync Job] Internet connectivity confirmed. Starting Supabase upload...");
  Serial.print("[Sync Job] STA IP: ");
  Serial.println(WiFi.localIP());

  bool msgOk = uploadMessagesToSupabase();
  bool sosOk = uploadSOSToSupabase();

  if (msgOk && sosOk) {
    Serial.println("[Sync Job] All items uploaded successfully. Clearing queue.");
    isSyncJobPending = false;
    syncCount = 0;
  } else {
    Serial.println("[Sync Job] Some items failed. Queue retained — will retry in next interval.");
  }
}

void loop() {
  dnsServer.processNextRequest();
  server.handleClient();
  handleWiFiReconnect();   // ADDED: auto-reconnect logic
  checkBackgroundSyncJob();

  loraPoll(); // polled, not interrupt-driven - see loraPoll() comment above

  if (loraOk) {
    long elapsedMs = (long)(millis() - lastBeaconMs);
    long intervalMs = (long)BEACON_INTERVAL_MS + random(-2000, 2000); // jitter avoids synced collisions
    if (elapsedMs >= intervalMs) {
      lastBeaconMs = millis();
      loraSendBeacon();
    }
  }
}