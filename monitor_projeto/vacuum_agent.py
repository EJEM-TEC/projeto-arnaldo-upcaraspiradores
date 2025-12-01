#!/usr/bin/env python3
"""
vacuum_agent.py - Versão FINAL (Lógica Comando -> Estado)
- Monitora coluna 'command'.
- Executa ação nos relés (Pinos 19 e 21).
- Atualiza coluna 'state' para refletir a realidade.
- Limpa a coluna 'command' após execução.
"""

import os
import time
import logging
from datetime import datetime, timezone
from dotenv import load_dotenv
from gpiozero import OutputDevice
from supabase import create_client, Client

load_dotenv()

# --- Configurações ---
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
DEVICE_ID = os.getenv("DEVICE_ID", "pi-default")
TABLE_NAME = "machines"
HISTORY_TABLE_NAME = "activation_history"

# Potência (2 Motores = 2400W = 2.4kW)
VACUUM_POWER_KW = 2.4

# GPIOs
RELAY_MOTOR_A_PIN = int(os.getenv("RELAY_MOTOR_A_PIN", "19"))
RELAY_MOTOR_B_PIN = int(os.getenv("RELAY_MOTOR_B_PIN", "21"))

# AJUSTE DE LÓGICA DO RELÉ
# False = Active Low (Liga com 0V). Use este se o relé ligava sozinho antes.
# True = Active High (Liga com 3.3V).
RELAY_ACTIVE_HIGH = False 

# Timers
COMMAND_POLL_INTERVAL = 3.0 # Checa comandos a cada 3s
TELEMETRY_INTERVAL = 30.0   # Envia dados a cada 30s

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# --- Inicialização ---
logging.info(f"Iniciando AspiraCar Agent. ActiveHigh: {RELAY_ACTIVE_HIGH}")

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    logging.error(f"Erro fatal ao conectar Supabase: {e}")
    raise e

# Inicializa Relés
relay_a = OutputDevice(RELAY_MOTOR_A_PIN, active_high=RELAY_ACTIVE_HIGH, initial_value=False)
relay_b = OutputDevice(RELAY_MOTOR_B_PIN, active_high=RELAY_ACTIVE_HIGH, initial_value=False)

# Variáveis de Estado
current_state = "off"
current_activation_id = None
activation_start_time = 0.0
current_user_id = None

def enforce_hardware_state():
    """Garante que o hardware esteja sincronizado com a variável current_state."""
    if current_state == "on":
        if not relay_a.is_active: relay_a.on()
        if not relay_b.is_active: relay_b.on()
    else:
        if relay_a.is_active: relay_a.off()
        if relay_b.is_active: relay_b.off()

def set_relay_logic(should_be_on: bool, user_id: str = None):
    """Aplica a mudança de estado e gerencia o histórico."""
    global current_state, current_activation_id, activation_start_time, current_user_id
    
    now_utc = datetime.now(timezone.utc).isoformat()

    # --- LIGAR ---
    if should_be_on and current_state != "on":
        logging.info(f">>> ATIVANDO MOTORES (Usuário: {user_id})")
        current_state = "on"
        current_user_id = user_id
        activation_start_time = time.time()
        enforce_hardware_state()
        
        # Inicia Histórico
        try:
            data = {
                "machine_id": DEVICE_ID,
                "user_id": user_id,
                "command": "on",
                "started_at": now_utc,
                "status": "em_andamento"
            }
            res = supabase.table(HISTORY_TABLE_NAME).insert(data).execute()
            if res.data:
                current_activation_id = res.data[0]["id"]
            else:
                # Fallback para encontrar o ID
                rec = supabase.table(HISTORY_TABLE_NAME).select("id").eq("machine_id", DEVICE_ID).order("started_at", desc=True).limit(1).execute()
                if rec.data: current_activation_id = rec.data[0]["id"]
        except Exception as e:
            logging.error(f"Erro histórico (ON): {e}")

    # --- DESLIGAR ---
    elif not should_be_on and current_state != "off":
        logging.info(">>> DESATIVANDO MOTORES")
        current_state = "off"
        enforce_hardware_state()
        
        # Finaliza Histórico e Salva Consumo
        if current_activation_id:
            try:
                duration_min = int((time.time() - activation_start_time) / 60)
                consumo_final = round((duration_min / 60) * VACUUM_POWER_KW, 4)
                
                update_data = {
                    "ended_at": now_utc,
                    "status": "concluído",
                    "duration_minutes": duration_min,
                    "consumo_kwh": consumo_final
                }
                supabase.table(HISTORY_TABLE_NAME).update(update_data).eq("id", current_activation_id).execute()
            except Exception as e:
                logging.error(f"Erro histórico (OFF): {e}")
        
        current_activation_id = None
        current_user_id = None
        activation_start_time = 0.0

def process_commands():
    """Lê a coluna 'command', executa e atualiza 'state'."""
    try:
        # Busca comando pendente
        res = supabase.table(TABLE_NAME).select("command, command_user_id").eq("id", DEVICE_ID).limit(1).execute()
        
        if res.data and res.data[0].get("command"):
            row = res.data[0]
            cmd = row.get("command").lower().strip()
            user = row.get("command_user_id")
            
            logging.info(f"Comando recebido: {cmd}")

            if cmd == "on":
                # 1. Liga Hardware
                set_relay_logic(True, user_id=user)
                # 2. Atualiza Banco: Limpa comando e define state='on'
                supabase.table(TABLE_NAME).update({
                    "command": None,
                    "command_user_id": None,
                    "state": "on"
                }).eq("id", DEVICE_ID).execute()
                logging.info("DB Atualizado: state='on'.")

            elif cmd == "off":
                # 1. Desliga Hardware
                set_relay_logic(False)
                # 2. Atualiza Banco: Limpa comando e define state='off'
                supabase.table(TABLE_NAME).update({
                    "command": None, 
                    "state": "off"
                }).eq("id", DEVICE_ID).execute()
                logging.info("DB Atualizado: state='off'.")
            
            # Se for outro comando, apenas limpa para não travar
            else:
                 supabase.table(TABLE_NAME).update({"command": None}).eq("id", DEVICE_ID).execute()
                
    except Exception as e:
        logging.error(f"Erro polling: {e}")

def send_telemetry():
    """Envia heartbeat e dados em tempo real."""
    global activation_start_time, current_user_id
    
    tempo_uso_atual_min = 0
    consumo_sessao_kwh = 0.0

    if current_state == "on" and activation_start_time > 0:
        tempo_uso_atual_min = int((time.time() - activation_start_time) / 60)
        horas = tempo_uso_atual_min / 60
        consumo_sessao_kwh = round(horas * VACUUM_POWER_KW, 4)
    
    payload = {
        "id": DEVICE_ID,
        "status": "online",
        "state": current_state, # Confirmação do estado físico
        "last_seen": datetime.now(timezone.utc).isoformat(),
        "tempo_uso_sessao_atual": tempo_uso_atual_min,
        "consumo_sessao_kwh": consumo_sessao_kwh,
        "current_user_id": current_user_id
    }
    
    try:
        supabase.table(TABLE_NAME).upsert(payload).execute()
    except Exception as e:
        logging.error(f"Erro telemetria: {e}")

def main():
    global current_state
    # Inicia desligado por segurança
    current_state = "off"
    enforce_hardware_state()
    
    logging.info("Sistema pronto.")
    
    # Envia 'oi' inicial e garante state='off' no boot se estava online antes
    try:
        supabase.table(TABLE_NAME).upsert({
            "id": DEVICE_ID, 
            "status": "online", 
            "state": "off"
        }).execute()
    except: pass
    
    last_check = 0
    last_telemetry = 0
    
    try:
        while True:
            now = time.time()
            enforce_hardware_state() # Segurança contínua
            
            # Verifica Comandos
            if now - last_check >= COMMAND_POLL_INTERVAL:
                process_commands()
                last_check = now
            
            # Envia Telemetria
            if now - last_telemetry >= TELEMETRY_INTERVAL:
                send_telemetry()
                last_telemetry = now
                
            time.sleep(1)
            
    except KeyboardInterrupt:
        logging.info("Encerrando...")
        current_state = "off"
        enforce_hardware_state()
        try:
            supabase.table(TABLE_NAME).upsert({"id": DEVICE_ID, "status": "offline", "state": "off"}).execute()
        except: pass

if __name__ == "__main__":
    main()
