#!/usr/bin/env python3
"""
vacuum_agent.py
Controle de aspirador (2 MOTORES) via GPIO com integração no supabase por POLLING.
"""

import os
import time
import logging
from datetime import datetime
from dotenv import load_dotenv

from gpiozero import OutputDevice
from supabase import create_client, Client
import board # Para o sensor
import adafruit_dht # Para o sensor
from typing import Optional

load_dotenv()

# --- Config Supabase (Lido do .env) ---
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
DEVICE_ID = os.getenv("DEVICE_ID", "pi-default")
TABLE_NAME = "machines"

if not SUPABASE_URL or not SUPABASE_KEY:
    raise SystemExit("Defina SUPABASE_URL e SUPABASE_KEY no .env")

# --- Config GPIO (Lido do .env) ---
### ESTA PARTE AGORA LÊ "19" E "21" DO SEU .ENV ###
RELAY_MOTOR_A_PIN = int(os.getenv("RELAY_MOTOR_A_PIN")) # (IN1)
RELAY_MOTOR_B_PIN = int(os.getenv("RELAY_MOTOR_B_PIN")) # (IN2)
RELAY_ACTIVE_HIGH = os.getenv("RELAY_ACTIVE_HIGH", "true").lower() in ("1", "true", "yes")

# --- Config de Tempo ---
COMMAND_POLL_INTERVAL = 5.0 # Segundos (checa comandos a cada 5s)
TELEMETRY_INTERVAL = 60.0  # Segundos (envia dados a cada 60s)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# --- Inicialização ---
logging.info("Iniciando serviço de polling do Supabase...")
# O python é tão buxa q tem q inicializar o supabase no código kkk
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Inicializa relé ai meu fi
### ESTA PARTE AGORA USA OS PINOS 19 E 21 ###
logging.info(f"Iniciando Relé Motor A (GPIO{RELAY_MOTOR_A_PIN}) e B (GPIO{RELAY_MOTOR_B_PIN})")
relay_a = OutputDevice(RELAY_MOTOR_A_PIN, active_high=RELAY_ACTIVE_HIGH, initial_value=False)
relay_b = OutputDevice(RELAY_MOTOR_B_PIN, active_high=RELAY_ACTIVE_HIGH, initial_value=False)

# Inicializa o sensor DHT (use_pulseio=False é importante no Pi 4/Zero 2)
SENSOR_PIN_BCM = int(os.getenv("DHT_SENSOR_PIN", "4"))
dht_sensor = adafruit_dht.DHT11(getattr(board, f"D{SENSOR_PIN_BCM}"), use_pulseio=False)

current_state = "off" # Estado da "máquina" como um todo

### NENHUMA MUDANÇA NECESSÁRIA AQUI ###
# Esta função já comanda relay_a e relay_b
def set_relay(state_on: bool) -> None:
    """Ativa ou desativa AMBOS os relés e atualiza o estado global."""
    global current_state
    
    if state_on and current_state != "on":
        logging.info("Ligando Motor A e Motor B")
        relay_a.on()
        relay_b.on()
        current_state = "on"
        logging.info("Relés set to ON")
        
    elif not state_on and current_state != "off":
        logging.info("Desligando Motor A e Motor B")
        relay_a.off()
        relay_b.off()
        current_state = "off"
        logging.info("Relés set to OFF")

# --- O RESTANTE DO CÓDIGO PERMANECE IGUAL ---
# (Sua lógica de telemetria e polling já usa a função 'set_relay',
# então não precisamos mudar mais nada)

def get_telemetry_data() -> dict:
    """Lê os sensores e retorna um dicionário de dados."""
    try:
        # Tenta ler o sensor. Isso pode falhar (é normal com DHT)
        temp = dht_sensor.temperature
        # Filtra leituras irreais se o sensor falhar
        if temp is None or temp < -10 or temp > 80:
            temp = None # Define como Nulo se a leitura for ruim
            logging.warning("Falha ao ler temperatura (Leitura inválida)")
        else:
            logging.info(f"Leitura do sensor: {temp}°C")
            
    except RuntimeError as error:
        # Erros de Runtime são comuns com DHT, o script não deve parar.
        logging.warning(f"Erro ao ler sensor DHT: {error.args[0]}")
        temp = None
    except Exception as e:
        logging.error(f"Erro inesperado no sensor: {e}")
        temp = None
        
    return {
        "temperatura": temp,
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
                logging.info("Comando ON -> Ativando relés")
                set_relay(True)
            elif cmd_lower == "off" and current_state != "off":
                logging.info("Comando OFF -> Desativando relés")
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
        "status": "online", # Status do script
        "temperatura": telemetry.get("temperatura"),
        "horas_de_uso_desde_limpeza": telemetry.get("horas_de_uso_desde_limpeza"),
        "last_seen": datetime.utcnow().isoformat(), # O "Heartbeat"
    }
    
    try:
        # upsert: é pra tabela, ele já bota as coisa caso não existe e se existir atualiza também
        supabase.table(TABLE_NAME).upsert(payload).execute()
        logging.info(f"Telemetria e Heartbeat enviados: state={current_state}")
    except Exception as e:
        logging.error(f"Erro ao reportar telemetria: {e}")

def main_loop():
    """Loop principal que gerencia o Polling e a Telemetria."""
    last_command_check = 0
    last_telemetry_report = 0

    logging.info("Iniciando loop principal (Polling). Pressione CTRL+C para sair.")
    
    # Reporta o estado inicial "offline" (ou o estado atual)
    set_relay(False)
    report_telemetry_and_heartbeat() # Reporta o estado inicial 'online'
    
    try:
        while True:
            current_time = time.time()
            
            # --- Bloco de Checagem de Comandos (Polling) ---
            if current_time - last_command_check > COMMAND_POLL_INTERVAL:
                check_for_commands()
                last_command_check = current_time
            
            # --- Bloco de Envio de Telemetria (Report) ---
            if current_time - last_telemetry_report > TELEMETRY_INTERVAL:
                report_telemetry_and_heartbeat()
                last_telemetry_report = current_time
                
            # Dorme por 1 segundo para não fritar o processador
            time.sleep(1) 
            
    except KeyboardInterrupt:
        logging.info("Interrupção detectada. Desligando...")
        set_relay(False)
        # Tenta enviar um último status "offline" antes de morrer
        try:
            supabase.table(TABLE_NAME).upsert({
                "id": DEVICE_ID,
                "state": "off",
                "status": "offline",
                "last_seen": datetime.utcnow().isoformat()
            }).execute()
        except Exception:
            pass # Ignora erros ao sair
        logging.info("Desligamento concluído.")
    finally:
        dht_sensor.exit() # Libera o pino do sensor

if __name__ == "__main__":
    main_loop()
