#!/usr/bin/env python3
"""
vacuum_agent.py - Versão SEM SENSOR DE TEMPERATURA
Controle de aspirador via GPIO com integração no supabase por POLLING.
"""

import os
import time
import logging
# Corrigido: importando datetime e timezone
from datetime import datetime, timezone
from dotenv import load_dotenv
# collections.deque removido

from gpiozero import OutputDevice
from supabase import create_client, Client
# board e adafruit_dht removidos
from typing import Optional

load_dotenv()

# --- Config Supabase (Lido do .env) ---
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
DEVICE_ID = os.getenv("DEVICE_ID", "pi-default")
TABLE_NAME = "machines"
HISTORY_TABLE_NAME = "activation_history"

if not SUPABASE_URL or not SUPABASE_KEY:
    raise SystemExit("Defina SUPABASE_URL e SUPABASE_KEY no .env")

# --- Config GPIO (Lido do .env) ---
RELAY_PIN = int(os.getenv("RELAY_PIN", "17")) # <- Mantido como no seu script
RELAY_ACTIVE_HIGH = os.getenv("RELAY_ACTIVE_HIGH", "true").lower() in ("1", "true", "yes")

# --- Config de Tempo ---
COMMAND_POLL_INTERVAL = 5.0 # Segundos (checa comandos a cada 5s)
TELEMETRY_INTERVAL = 60.0  # Segundos (envia dados a cada 60s)
# TEMP_READING_INTERVAL removido

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# --- Inicialização ---
logging.info("Iniciando serviço de polling do Supabase...")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Inicializa relé
relay = OutputDevice(RELAY_PIN, active_high=RELAY_ACTIVE_HIGH, initial_value=False)

# Inicialização do sensor DHT removida

current_state = "off"
current_activation_id = None  # ID do registro de activation_history atual
# temperature_readings e last_temp_reading removidos

def set_relay(state_on: bool) -> None:
    """Ativa ou desativa o relé e atualiza o estado global."""
    global current_state, current_activation_id
    
    if state_on and current_state != "on":
        relay.on()
        current_state = "on"
        logging.info("Relay set to ON")
        
        # Cria registro de activation_history quando liga
        try:
            # Corrigido: .now(timezone.utc)
            now = datetime.now(timezone.utc).isoformat()
            response = supabase.table(HISTORY_TABLE_NAME).insert({
                "machine_id": int(DEVICE_ID),
                "command": "on",
                "started_at": now,
                "status": "em_andamento"
            }).select("id").execute()
            
            if response.data and len(response.data) > 0:
                current_activation_id = response.data[0]["id"]
                # temperature_readings.clear() removido
                logging.info(f"Registro de activation criado com ID: {current_activation_id}")
        except Exception as e:
            logging.error(f"Erro ao criar registro de activation: {e}")
            
    elif not state_on and current_state != "off":
        relay.off()
        
        # Finaliza registro de activation_history quando desliga
        if current_activation_id:
            try:
                # Corrigido: .now(timezone.utc)
                now = datetime.now(timezone.utc).isoformat()
                
                # Bloco de cálculo de temperatura média removido
                
                # Calcula duração
                activation_record = supabase.table(HISTORY_TABLE_NAME).select("started_at").eq("id", current_activation_id).single().execute()
                if activation_record.data:
                    start_time = datetime.fromisoformat(activation_record.data["started_at"].replace('Z', '+00:00'))
                    end_time = datetime.fromisoformat(now.replace('Z', '+00:00'))
                    duration_seconds = (end_time - start_time).total_seconds()
                    duration_minutes = int(duration_seconds / 60)
                else:
                    duration_minutes = None
                
                # Atualiza o registro
                update_data = {
                    "ended_at": now,
                    "status": "concluído",
                    "duration_minutes": duration_minutes
                }
                
                # Bloco 'if avg_temp' removido
                
                supabase.table(HISTORY_TABLE_NAME).update(update_data).eq("id", current_activation_id).execute()
                logging.info(f"Registro de activation atualizado: {current_activation_id}")
                
                # Cria registro de desligamento
                supabase.table(HISTORY_TABLE_NAME).insert({
                    "machine_id": int(DEVICE_ID),
                    "command": "off",
                    "started_at": now,
                    "status": "concluído"
                }).execute()
                
            except Exception as e:
                logging.error(f"Erro ao finalizar registro de activation: {e}")
        
        current_state = "off"
        current_activation_id = None
        # temperature_readings.clear() removido
        logging.info("Relay set to OFF")

def get_telemetry_data() -> dict:
    """Lê os sensores e retorna um dicionário de dados."""
    # Toda a lógica do sensor foi removida.
    
    return {
        "temperatura": None, # Retorna Nulo pois não há sensor
        "horas_de_uso_desde_limpeza": 0.0 # TODO: Implementar esta lógica
    }

def check_for_commands():
    """Lê o comando do Supabase e age."""
    global current_state
    try:
        resp = supabase.table(TABLE_NAME).select("command").eq("id", DEVICE_ID).limit(1).execute()
        data = resp.data
        if data and len(data) > 0:
            cmd = data[0].get("command")
            
            if not cmd: # Se o comando for None ou "", não faz nada
                return

            cmd_lower = cmd.lower().strip()
            logging.info(f"Comando recebido do Supabase: {cmd_lower}")

            if cmd_lower == "on" and current_state != "on":
                logging.info("Comando ON -> Ativando relé")
                set_relay(True)
            elif cmd_lower == "off" and current_state != "off":
                logging.info("Comando OFF -> Desativando relé")
                set_relay(False)
            
            # MUITO IMPORTANTE: Limpa o comando no banco para não rodar de novo
            supabase.table(TABLE_NAME).update({"command": None}).eq("id", DEVICE_ID).execute()
            logging.info("Comando 'command' limpo no Supabase.")

    except Exception as e:
        logging.error(f"Erro ao checar comandos no Supabase: {e}")

def report_telemetry_and_heartbeat():
    """Envia os dados dos sensores e o estado atual para o Supabase (Fluxo 2)."""
    logging.debug("Reportando telemetria e heartbeat...")
    telemetry = get_telemetry_data()
    
    payload = {
        "id": DEVICE_ID,
        "state": current_state,
        "status": "online",
        "temperatura": telemetry.get("temperatura"), # Sempre será None
        "horas_de_uso_desde_limpeza": telemetry.get("horas_de_uso_desde_limpeza"),
        # Corrigido: .now(timezone.utc)
        "last_seen": datetime.now(timezone.utc).isoformat(),
    }
    
    try:
        supabase.table(TABLE_NAME).upsert(payload).execute()
        logging.info(f"Telemetria e Heartbeat enviados: state={current_state}")
    except Exception as e:
        logging.error(f"Erro ao reportar telemetria: {e}")

def main_loop():
    """Loop principal que gerencia o Polling e a Telemetria."""
    # last_temp_reading removido
    
    last_command_check = 0
    last_telemetry_report = 0
    # last_temp_reading = time.time() removido

    logging.info("Iniciando loop principal (Polling). Pressione CTRL+C para sair.")
    
    # Reporta o estado inicial "offline" (ou o estado atual)
    set_relay(False)
    report_telemetry_and_heartbeat()
    
    try:
        while True:
            current_time = time.time()
            
            # --- Bloco de Checagem de Comandos (Polling) ---
            if current_time - last_command_check >= COMMAND_POLL_INTERVAL:
                check_for_commands()
                last_command_check = current_time
            
            # --- Bloco de Envio de Telemetria (Report) ---
            if current_time - last_telemetry_report >= TELEMETRY_INTERVAL:
                report_telemetry_and_heartbeat()
                last_telemetry_report = current_time
            
            # --- Bloco de Leitura de Temperatura (durante execução) ---
            # Removido
                
            # Dorme por 1 segundo para não fritar o processador
            time.sleep(1) 
            
    except KeyboardInterrupt:
        logging.info("Interrupção detectada. Desligando...")
        set_relay(False)
        try:
            supabase.table(TABLE_NAME).upsert({
                "id": DEVICE_ID,
                "state": "off",
                "status": "offline",
                # Corrigido: .now(timezone.utc)
                "last_seen": datetime.now(timezone.utc).isoformat()
            }).execute()
        except Exception:
            pass
        logging.info("Desligamento concluído.")
    finally:
        # dht_sensor.exit() removido
        pass # Não há mais nada para limpar aqui

if __name__ == "__main__":
    main_loop()