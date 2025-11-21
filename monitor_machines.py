#!/usr/bin/env python3
"""
Script de Monitoramento de Máquinas
====================================

Este script monitora a tabela 'machines' no Supabase e simula o comportamento
das máquinas físicas (aspiradores), lendo os comandos e atualizando o status.

Em um sistema real, este código rodaria no hardware embarcado (Raspberry Pi, ESP32, etc.)
e controlaria fisicamente os aspiradores.

Para este exemplo, apenas imprime os comandos recebidos.
"""

import os
import time
from datetime import datetime
from supabase import create_client, Client

# Configuração do Supabase
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL', '')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ ERRO: Variáveis de ambiente não configuradas!")
    print("Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY")
    exit(1)

# Inicializa o cliente Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Estado anterior das máquinas (para detectar mudanças)
previous_state = {}

def get_timestamp():
    """Retorna timestamp formatado"""
    return datetime.now().strftime('%Y-%m-%d %H:%M:%S')

def check_machines():
    """Verifica o estado das máquinas e simula ações"""
    try:
        # Busca todas as máquinas
        response = supabase.table('machines').select('*').execute()
        machines = response.data
        
        if not machines:
            print(f"[{get_timestamp()}] ⚠️  Nenhuma máquina encontrada no banco")
            return
        
        for machine in machines:
            machine_id = machine['id']
            slug = machine.get('slug_id', f'machine-{machine_id}')
            command = machine.get('command', 'off')
            status = machine.get('status', 'offline')
            location = machine.get('location', 'Desconhecida')
            
            # Verifica se houve mudança no comando
            previous_command = previous_state.get(machine_id, {}).get('command')
            
            if previous_command != command:
                # Comando mudou!
                print(f"\n{'='*60}")
                print(f"[{get_timestamp()}] 🔔 COMANDO RECEBIDO!")
                print(f"  Máquina: {slug} (ID: {machine_id})")
                print(f"  Localização: {location}")
                print(f"  Comando: {previous_command or 'unknown'} → {command}")
                print(f"  Status: {status}")
                print(f"{'='*60}")
                
                if command == 'on':
                    print(f"✅ Ativando máquina {slug}...")
                    print(f"   → Motor ligado")
                    print(f"   → Sistema de aspiração iniciado")
                    
                    # Atualiza status para 'online'
                    supabase.table('machines').update({
                        'status': 'online'
                    }).eq('id', machine_id).execute()
                    
                elif command == 'off':
                    print(f"⏹️  Desativando máquina {slug}...")
                    print(f"   → Motor desligado")
                    print(f"   → Sistema de aspiração parado")
                    
                    # Atualiza status para 'offline'
                    supabase.table('machines').update({
                        'status': 'offline'
                    }).eq('id', machine_id).execute()
            
            # Atualiza estado anterior
            previous_state[machine_id] = {
                'command': command,
                'status': status
            }
    
    except Exception as e:
        print(f"[{get_timestamp()}] ❌ Erro ao verificar máquinas: {e}")

def main():
    """Função principal que monitora as máquinas"""
    print("="*60)
    print("🤖 Monitor de Máquinas - Sistema de Aspiradores UPCAR")
    print("="*60)
    print(f"Iniciado em: {get_timestamp()}")
    print(f"URL Supabase: {SUPABASE_URL}")
    print("="*60)
    print("\n👀 Monitorando comandos das máquinas...")
    print("   (Pressione Ctrl+C para parar)\n")
    
    try:
        # Loop infinito de monitoramento
        while True:
            check_machines()
            time.sleep(2)  # Verifica a cada 2 segundos
    
    except KeyboardInterrupt:
        print(f"\n\n[{get_timestamp()}] 🛑 Monitor interrompido pelo usuário")
        print("="*60)
    
    except Exception as e:
        print(f"\n\n[{get_timestamp()}] ❌ Erro fatal: {e}")
        print("="*60)

if __name__ == "__main__":
    main()

