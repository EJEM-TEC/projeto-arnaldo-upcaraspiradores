// pages/api/process-payment.js
import mercadopago from "mercadopago";

// --- ESTA É A LINHA QUE VOCÊ DESTACou ---
// Configura o SDK do Mercado Pago com sua Chave Secreta (lida do .env)
mercadopago.configurations.setAccessToken(process.env.MERCADOPAGO_ACCESS_TOKEN);
// -----------------------------------------

export default async function handler(req, res) {
  // Garante que só aceite requisições POST
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  try {
    // Extrai os dados enviados pelo seu frontend (pelo Brick)
    const { token, issuer_id, payment_method_id, transaction_amount, installments, payer } = req.body;

    // (Opcional) Verifique o valor (transaction_amount) com seu banco de dados
    // para garantir que não foi manipulado no frontend.

    const paymentData = {
      transaction_amount: Number(transaction_amount),
      token: token,
      description: "Descrição do seu produto/serviço", // Ex: "Créditos UpAspiradores"
      installments: Number(installments),
      payment_method_id: payment_method_id,
      issuer_id: issuer_id,
      payer: {
        email: payer.email,
        // (Opcional) Adicione mais dados do pagador se você os coletou
        // first_name: payer.first_name, 
        // identification: {
        //   type: payer.identification.type,
        //   number: payer.identification.number,
        // },
      },
    };

    // Log para depuração (MUITO importante para testes)
    console.log("ENVIANDO PARA O MERCADO PAGO:", JSON.stringify(paymentData, null, 2));

    // Salva e processa o pagamento
    const { response } = await mercadopago.payment.save(paymentData);

    // Log da resposta do MP
    console.log("RESPOSTA DO MERCADO PAGO:", response);

    // Retorna o status do pagamento para o frontend
    res.status(201).json({
      status: response.status,
      status_detail: response.status_detail,
      id: response.id,
    });

  } catch (error) {
    console.error("ERRO AO PROCESSAR PAGAMENTO:", error);

    // Envia uma resposta de erro mais detalhada para o frontend
    const errorMessage = error.cause ? JSON.stringify(error.cause) : error.message;
    res.status(500).json({ 
      error: "Falha ao processar o pagamento",
      details: errorMessage 
    });
  }
}