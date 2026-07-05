// Companion test transmitter for the Outbreak LoRa mesh demo.
//
// Flash this onto a second ESP32 + Ra-02 module (any ESP32 board works; it
// doesn't need to be an S3). It sends a beacon and a canned chat message
// every 10 seconds so the main offlineMode.ino node has a real peer to show
// in its "Peers Connected" / "Signal Strength" / "Broadcast Range" metrics
// and its message feed, without needing a second full edge node running.
//
// Wiring: same SPI pin roles as offlineMode.ino's LORA_* defines below -
// rewire these six pins if your test board's GPIOs differ.

#include <SPI.h>
#include <LoRa.h>

#define LORA_SCK    12
#define LORA_MISO   13
#define LORA_MOSI   11
#define LORA_NSS    10
#define LORA_RST     9
#define LORA_DIO0   14
#define LORA_FREQ   433E6
#define LORA_SYNC_WORD 0x4F
#define LORA_TX_POWER_DBM 10

const char* TEST_NODE_ID = "TEST";
unsigned int seq = 0;
unsigned long lastSendMs = 0;
const unsigned long SEND_INTERVAL_MS = 10000;

void setup() {
  Serial.begin(115200);
  delay(1000);

  SPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_NSS);
  LoRa.setPins(LORA_NSS, LORA_RST, LORA_DIO0);

  if (!LoRa.begin(LORA_FREQ)) {
    Serial.println("[LoRa] Init FAILED - check wiring.");
    while (true) delay(1000);
  }

  LoRa.setSyncWord(LORA_SYNC_WORD);
  LoRa.enableCrc();
  LoRa.setSpreadingFactor(7);
  LoRa.setSignalBandwidth(125E3);
  LoRa.setTxPower(LORA_TX_POWER_DBM);
  Serial.println("[LoRa] Test transmitter ready.");
}

void loop() {
  if (millis() - lastSendMs < SEND_INTERVAL_MS) return;
  lastSendMs = millis();
  seq++;

  // Beacon: lets the main node count this as a peer and read its RSSI.
  LoRa.beginPacket();
  LoRa.print("OB1|B|" + String(TEST_NODE_ID) + "|" + String(seq));
  LoRa.endPacket();
  Serial.println("[TX] Beacon seq=" + String(seq));

  delay(300); // stay under the main node's minimum RX gap between frames

  // Canned chat message so the demo has something in the message feed.
  long long msgId = (long long)millis() + seq;
  String frame = "OB1|M|" + String(TEST_NODE_ID) + "|" + String(msgId) +
                 "|TestNode|00:00|Hello from the LoRa test transmitter (seq " + String(seq) + ")";
  LoRa.beginPacket();
  LoRa.print(frame);
  LoRa.endPacket();
  Serial.println("[TX] Message seq=" + String(seq));
}
