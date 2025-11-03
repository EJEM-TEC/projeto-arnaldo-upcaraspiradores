// supabase/functions/activateMachine/index.ts

import { connect } from "mqtt";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Credenciais do seu Broker MQTT (HiveMQ Cloud)
// Bote isso nas "Secrets" do seu projeto Supabase, não aqui direto!
const MQTT_HOST = Deno.env.get("MQTT_HOST_URL")!; // ex: 'xxxxxxxx.s1.eu.hivemq.cloud'
const MQTT_PORT = parseInt(Deno.env.get("MQTT_PORT") || "8883");
const MQTT_USER = Deno.env.get("MQTT_USER")!;
const MQTT_PASS = Deno.env.get("MQTT_PASS")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    // Handle CORS preflight
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" } });
  }

  try {
    const { machine_id, acao, duracao_s } = await req.json();

    // 1. Validar (ex: checar saldo, etc.) - Você implementa isso
    // ...

    // 2. Conectar ao Broker MQTT
    const client = await connect({
      host: MQTT_HOST,
      port: MQTT_PORT,
      username: MQTT_USER,
      password: MQTT_PASS,
      protocol: "mqtts" // 'mqtts' para porta 8883 (seguro)
    });

    // 3. Montar a mensagem e o tópico
    const topic = `upaspiradores/maquinas/${machine_id}/comandos`;
    const message = JSON.stringify({
      acao: acao, // "LIGAR" ou "DESLIGAR"
      duracao_s: duracao_s // ex: 300
    });

    // 4. Publicar a mensagem
    await client.publish(topic, message);
    console.log(`Comando publicado no tópico ${topic}: ${message}`);

    // 5. Desconectar e retornar sucesso
    await client.disconnect();
    
    return new Response(JSON.stringify({ success: true, message: "Comando enviado." }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      status: 500,
    });
  }
});