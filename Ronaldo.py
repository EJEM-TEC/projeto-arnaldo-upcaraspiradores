#!/usr/bin/env python3
"""
vacuum_agent_mqtt.py
Controle de aspirador via GPIO com integração MQTT e Supabase (telemetria).
"""

import os
import time
import logging
import json
from datetime import datetime
from dotenv import load_dotenv

from gpiozero import OutputDevice
from supabase import create_client, Client
import paho.mqtt.client as mqtt

load_dotenv()

Config Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
TABLE_NAME = "machines" # Nome da tabela que criamos
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

#264e387e6db345b988f186fa75eafdb5.s1.eu.hivemq.cloud URL 
#264e387e6db345b988f186fa75eafdb5.s1.eu.hivemq.cloud:8883 mqqt
#264e387e6db345b988f186fa75eafdb5.s1.eu.hivemq.cloud:8884/mqtt websocket
Config Broker MQTT
MQTT_HOST = os.getenv("MQTT_HOST_URL")
MQTT_PORT = int(os.getenv("MQTT_PORT", "8883"))
MQTT_USER = os.getenv("MQTT_USER")
MQTT_PASS = os.getenv("MQTT_PASS")
DEVICE_ID = os.getenv("DEVICE_ID") # ex: "22027"
COMMAND_TOPIC = f"upaspiradores/maquinas/{DEVICE_ID}/comandos"
TELEMETRY_TOPIC = f"upaspiradores/maquinas/{DEVICE_ID}/telemetria" # O Ronaldo vai publicar bagui na tabela

#Config GPIO
RELAY_PIN = int(os.getenv("RELAY_PIN", "17"))
RELAY_ACTIVE_HIGH = os.getenv("RELAY_ACTIVE_HIGH", "true").lower() in ("1", "true", "yes")
relay = OutputDevice(RELAY_PIN, active_high=RELAY_ACTIVE_HIGH, initial_value=False)
current_state = "off"

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

#Funções do Relé meu fi, o relé
def set_relay(state_on: bool):
    global current_state
    if state_on:
        relay.on()
        current_state = "on"
    else:
        relay.off()
        current_state = "off"
    logging.info(f"Relay set to {current_state}")

#Funções do Supabase (Se tem python tem q ter funçaum)
def report_telemetry_to_supabase(temp, status, horas_uso):
    """Atualiza a telemetria no Supabase."""
    payload = {
        "id": DEVICE_ID,
        "state": current_state,
        "status": status,
        "temperatura": temp,
        "horas_de_uso_desde_limpeza": horas_uso,
        "last_seen": datetime.utcnow().isoformat(),
    }
    try:
        supabase.table(TABLE_NAME).upsert(payload).execute()
        logging.info(f"Reported telemetry {payload} to supabase")
    except Exception as e:
        logging.error(f"Erro ao reportar telemetria: {e}")

#Funções MQTT

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        logging.info(f"Conectado ao Broker MQTT! Subscrito em {COMMAND_TOPIC}")
        client.subscribe(COMMAND_TOPIC)
    else:
        logging.error(f"Falha ao conectar ao MQTT, código {rc}")

def on_message(client, userdata, msg):
    """Callback chamado quando uma mensagem chega no tópico de comando."""
    logging.info(f"Comando recebido! Tópico: {msg.topic}")
    try:
        payload = json.loads(msg.payload.decode("utf-8"))
        acao = payload.get("acao", "").lower()
        duracao_s = payload.get("duracao_s", 0)

        if acao == "ligar":
            logging.info(f"Ação: LIGAR por {duracao_s} segundos.")
            set_relay(True)
            # Você pode usar 'threading.Timer' aqui para desligar após 'duracao_s'
            # Por simplicidade, este exemplo apenas liga.
            # Lógica para desligar depois:
            # threading.Timer(duracao_s, set_relay, args=[False]).start()
            
        elif acao == "desligar":
            logging.info("Ação: DESLIGAR")
            set_relay(False)
        
        # Reporta o novo estado imediatamente
        report_telemetry_to_supabase(get_temp(), "online", get_horas_uso())

    except Exception as e:
        logging.error(f"Erro ao processar mensagem MQTT: {e}")

#Funções de Leitura(Nois tem q ter os bagui pra testar kkkkk)
def get_temp():
    return 42.5 # TODO: Implementar leitura do sensor DHT22

def get_horas_uso():
    return 8.5 # TODO: Implementar lógica de contagem de tempo

#Loop Principal
def main():
    mqtt_client = mqtt.Client()
    mqtt_client.username_pw_set(MQTT_USER, MQTT_PASS)
    mqtt_client.on_connect = on_connect
    mqtt_client.on_message = on_message
    
    # Configura MQTTS (Conexão Segura)
    if MQTT_PORT == 8883:
        mqtt_client.tls_set()

    mqtt_client.connect(MQTT_HOST, MQTT_PORT, 60)
    
    # Inicia o loop de rede MQTT em uma thread separada
    mqtt_client.loop_start() 
    
    logging.info("Serviço de MQTT iniciado. Entrando no loop de telemetria.")
    
    try:
        while True:
            # Loop principal agora só cuida da Telemetria
            temp = get_temp()
            horas_uso = get_horas_uso()
            
            # Reporta telemetria para o Supabase (e/ou publica no MQTT)
            report_telemetry_to_supabase(temp, "online", horas_uso)
            
            # (Opcional) Publica telemetria no MQTT também dá pra tentar implementar isso daí mais pra frente
            # telemetry_payload = json.dumps({"status": "online", "temperatura": temp, "horas_de_uso_desde_limpeza": horas_uso})
            # mqtt_client.publish(TELEMETRY_TOPIC, telemetry_payload)

            time.sleep(60) # Envia telemetria a cada 60 segundos
            
    except KeyboardInterrupt:
        logging.info("Interrompido. Desligando...")
    finally:
        set_relay(False)
        report_telemetry_to_supabase(get_temp(), "offline", get_horas_uso())
        mqtt_client.loop_stop()
        mqtt_client.disconnect()
        logging.info("Serviços finalizados.")
# até parece que eu sou um bom garoto de programa escrevendo assim kkkkkk
if __name__ == "__main__":
    main()
#made by Molotov
