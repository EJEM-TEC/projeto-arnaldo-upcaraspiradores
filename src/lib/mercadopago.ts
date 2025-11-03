import { MercadoPagoConfig, Payment, CardToken } from 'mercadopago';

// Cliente do Mercado Pago
export function getMercadoPagoClient() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  
  if (!accessToken) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado');
  }

  return new MercadoPagoConfig({
    accessToken,
    options: {
      timeout: 30000, // Aumentado para 30 segundos
      idempotencyKey: undefined, // Será definido por requisição se necessário
    },
  });
}

export function createPaymentClient() {
  const client = getMercadoPagoClient();
  return new Payment(client);
}

export function createCardTokenClient() {
  const client = getMercadoPagoClient();
  return new CardToken(client);
}

