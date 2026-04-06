import serial
import serial.tools.list_ports
import json
import requests
import time
import sys
import argparse

# Configuration
API_URL   = "http://localhost:3000/api/local-db"
Baud_RATE = 115200
BAUD_RATE = 115200

COLOR_RED    = "\033[91m"
COLOR_GREEN  = "\033[92m"
COLOR_YELLOW = "\033[93m"
COLOR_CYAN   = "\033[96m"
COLOR_RESET  = "\033[0m"
COLOR_BOLD   = "\033[1m"

def print_banner():
    print(f"{COLOR_CYAN}{COLOR_BOLD}")
    print("╔══════════════════════════════════════════╗")
    print("║   AyuLink Serial-to-API Gateway Bridge   ║")
    print("║   Version 2.0  |  LoRa 433MHz  |  ESP32  ║")
    print("╚══════════════════════════════════════════╝")
    print(f"{COLOR_RESET}")
    print(f"{COLOR_YELLOW}  Supported OLED Commands (send via serial):{COLOR_RESET}")
    print(f"  [SIM:ON]       → Activate simulation mode on OLED")
    print(f"  [SIM:OFF]      → Deactivate simulation mode")
    print(f"  [PAGE:NEXT]    → Manually advance to next OLED page")
    print(f"  [RESET:ALERTS] → Clear all alerts on OLED")
    print(f"  [CMD]{{json}}   → Relay command to LoRa mesh node")
    print()

def find_esp32_port():
    # Check for CH9102 (the exact chip on this gateway)
    ports = serial.tools.list_ports.comports()
    for port in ports:
        desc = port.description.upper()
        if any(x in desc for x in ["CP210", "CH34", "CH910", "USB SERIAL", "UART"]):
            return port.device
    return None

def post_to_api(data):
    try:
        # 1. Update Patient Status/Vitals
        # Based on the received JSON from Gateway
        payload = {
            "table": "vitals",
            "action": "insert",
            "data": {
                "patient_id": data.get("node", "P-001"),
                "heart_rate": data.get("hr", 0),
                "spo2": data.get("oxy", 0),
                "temperature": data.get("gatewayTemp", 36.5), # Using gateway temp as placeholder if wristband doesn't send it
                "timestamp": data.get("timestamp") or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            }
        }
        res = requests.post(API_URL, json=payload, timeout=2)
        
        # 2. Update Patient overall status if SOS or Fall
        if data.get("sos") or data.get("fall"):
            status_payload = {
                "table": "patients",
                "action": "update",
                "eqCol": "id",
                "eqVal": data.get("node"),
                "data": {
                    "status": "critical" if data.get("sos") else "warning"
                }
            }
            requests.post(API_URL, json=status_payload, timeout=2)

        print(f"[BRIDGE] Successfully synced data for {data.get('node')}")
    except Exception as e:
        print(f"[BRIDGE] API Error: {e}")

def check_commands(ser):
    """Checks the database for pending commands and sends them to the hardware."""
    try:
        # 1. Fetch pending commands
        res = requests.get(f"{API_URL}?table=commands&eqCol=status&eqVal=pending", timeout=1)
        if res.ok:
            commands = res.json().get("data", [])
            for cmd in commands:
                # Dynamic Command Relay: Forward all fields from the DB to the hardware
                cmd_json = cmd.copy()
                # Remove internal DB fields before sending
                for field in ["id", "status", "created_at"]:
                    cmd_json.pop(field, None)
                
                # Ensure device_id is mapped to 'target' for the firmware
                if "device_id" in cmd_json:
                    cmd_json["target"] = cmd_json.pop("device_id")

                payload = f"[CMD]{json.dumps(cmd_json)}\n"
                ser.write(payload.encode('utf-8'))
                print(f"[BRIDGE] TX: {payload.strip()}")
                
                # 2. Mark as relayed
                update_payload = {
                    "table": "commands",
                    "action": "update",
                    "eqCol": "id",
                    "eqVal": cmd.get("id"),
                    "data": { "status": "relayed" }
                }
                requests.post(API_URL, json=update_payload, timeout=1)
    except Exception as e:
        pass # Silently handle polling errors

def run_bridge(force_sim=False, port_override=None):
    port = port_override or find_esp32_port()
    if not port:
        print(f"{COLOR_RED}[BRIDGE] Error: ESP32 not found. Check drivers and USB.{COLOR_RESET}")
        sys.exit(1)

    print(f"{COLOR_GREEN}[BRIDGE] ✓ Connected to {port} @ {BAUD_RATE} baud{COLOR_RESET}")
    print(f"{COLOR_GREEN}[BRIDGE] ✓ API Target: {API_URL}{COLOR_RESET}")
    
    try:
        ser = serial.Serial(port, BAUD_RATE, timeout=0.1)
        ser.flush()
        time.sleep(1.5) # Let ESP32 finish booting

        # Reset stale emergency state on OLED at startup
        ser.write(b"[RESET:ALERTS]\n")
        print(f"{COLOR_YELLOW}[BRIDGE] Sent [RESET:ALERTS] to clear OLED on boot.{COLOR_RESET}")

        # Sync simulation mode
        if force_sim:
            ser.write(b"[SIM:ON]\n")
            print(f"{COLOR_CYAN}[BRIDGE] Sent [SIM:ON] → OLED Sim Mode activated.{COLOR_RESET}")

        last_poll = 0
        last_sim_state = force_sim  # Track to avoid spamming the serial port

        while True:
            # 1. Handle RX (Hardware → API)
            if ser.in_waiting > 0:
                line = ser.readline().decode('utf-8', errors='replace').strip()
                if line.startswith("[DATA]"):
                    json_str = line[6:].strip()
                    try:
                        data = json.loads(json_str)
                        node = data.get('node', '?')
                        hr   = data.get('hr', '--')
                        oxy  = data.get('oxy', '--')
                        rssi = data.get('rssi', '?')
                        sim  = data.get('simMode', False)
                        print(f"{COLOR_GREEN}[RX]{COLOR_RESET} Node:{node} HR:{hr} O2:{oxy}% RSSI:{rssi}dBm SIM:{sim}")
                        post_to_api(data)

                        # Auto-sync OLED sim state (only send if changed)
                        if sim != last_sim_state:
                            cmd = b"[SIM:ON]\n" if sim else b"[SIM:OFF]\n"
                            ser.write(cmd)
                            last_sim_state = sim
                            print(f"{COLOR_CYAN}[BRIDGE] OLED Sim Mode → {'ON' if sim else 'OFF'}{COLOR_RESET}")

                    except json.JSONDecodeError:
                        print(f"{COLOR_RED}[BRIDGE] Malformed JSON: {json_str}{COLOR_RESET}")

                elif line.startswith("[SOS]"):
                    print(f"{COLOR_RED}{COLOR_BOLD}[BRIDGE] !!! SOS RECEIVED !!!{COLOR_RESET}")
                    node_id = line[5:].strip() or "P-001"
                    post_to_api({"node": node_id, "sos": True, "hr": 0, "oxy": 0})

                elif line.startswith("[FALL]"):
                    print(f"{COLOR_RED}{COLOR_BOLD}[BRIDGE] !!! FALL DETECTED !!!{COLOR_RESET}")
                    node_id = line[6:].strip() or "P-001"
                    post_to_api({"node": node_id, "fall": True, "hr": 0, "oxy": 0})

                elif line:
                    # Print all other firmware logs
                    print(f"{COLOR_YELLOW}[FW]{COLOR_RESET} {line}")

            # 2. Handle TX (API → Hardware) every 1 second
            if time.time() - last_poll > 1.0:
                check_commands(ser)
                last_poll = time.time()

            time.sleep(0.01)
            
    except KeyboardInterrupt:
        print(f"\n{COLOR_YELLOW}[BRIDGE] Stopped by user. Gateway still running.{COLOR_RESET}")
    except serial.SerialException as e:
        print(f"{COLOR_RED}[BRIDGE] Serial Error: {e}{COLOR_RESET}")
        print(f"{COLOR_YELLOW}  → Is the COM port in use by another program? Close PlatformIO monitor first.{COLOR_RESET}")
    except Exception as e:
        print(f"{COLOR_RED}[BRIDGE] Runtime Error: {e}{COLOR_RESET}")
    finally:
        if 'ser' in locals() and ser.is_open:
            ser.close()
            print(f"{COLOR_YELLOW}[BRIDGE] Serial port closed cleanly.{COLOR_RESET}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AyuLink Serial-API Bridge")
    parser.add_argument("port",  nargs="?", help="COM port override (e.g. COM3)")
    parser.add_argument("--sim", action="store_true", help="Activate OLED Simulation Mode on startup")
    args = parser.parse_args()

    print_banner()
    run_bridge(force_sim=args.sim, port_override=args.port)
