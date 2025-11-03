/**
 * Utilitários para detecção de bandeira de cartão
 */

/**
 * Detecta a bandeira do cartão baseado no número
 * Retorna o payment_method_id do MercadoPago
 */
export function detectCardBrand(cardNumber: string): string {
  // Remove espaços e caracteres não numéricos
  const cleaned = cardNumber.replace(/\D/g, '');
  
  if (!cleaned || cleaned.length < 4) {
    return 'visa'; // Default
  }

  const firstDigit = cleaned[0];
  const firstTwoDigits = cleaned.substring(0, 2);

  // Verifica prefixos de 4 dígitos primeiro (mais específicos)
  // Elo: vários prefixos de 4 dígitos
  const eloPrefixes = [
    '4011', '4312', '4389', '4514', '4573', '5041', '5066', '5090', '5091',
    '5092', '5093', '5094', '5095', '5096', '5097', '5098', '5099', '6362',
    '6363', '6369', '6500', '6501', '6502', '6503', '6504', '6505', '6506',
    '6507', '6508', '6509', '6510', '6511', '6512', '6513', '6514', '6515',
    '6516', '6517', '6518', '6519', '6520', '6521', '6522', '6523', '6524',
    '6525', '6526', '6527', '6528', '6529', '6530', '6531', '6532', '6533',
    '6534', '6535', '6536', '6537', '6538', '6539', '6540', '6541', '6542',
    '6543', '6544', '6545', '6546', '6547', '6548', '6549', '6550', '6551',
    '6552', '6553', '6554', '6555', '6556', '6557', '6558', '6559'
  ];
  
  if (eloPrefixes.some(prefix => cleaned.startsWith(prefix))) {
    return 'elo';
  }

  // Amex: prefixos de 2 dígitos (34 ou 37)
  if (cleaned.startsWith('34') || cleaned.startsWith('37')) {
    return 'amex';
  }

  // Hipercard: prefixos 38 ou 60 (prioridade sobre Hiper e Diners para 38)
  if (cleaned.startsWith('38') || cleaned.startsWith('60')) {
    return 'hipercard';
  }

  // Diners: prefixos 30 ou 36 (38 já foi tratado como Hipercard)
  if (cleaned.startsWith('30') || cleaned.startsWith('36')) {
    return 'diners';
  }

  // Hiper: prefixo 38 (mas já foi tratado como Hipercard acima, então não chegará aqui)
  // Mantido para compatibilidade caso precise de lógica diferente no futuro
  if (cleaned.startsWith('38')) {
    return 'hiper';
  }

  // Visa: começa com 4
  if (firstDigit === '4') {
    return 'visa';
  }

  // Mastercard: começa com 5 ou 2 (alguns novos começam com 2)
  if (firstDigit === '5' || (firstDigit === '2' && parseInt(firstTwoDigits) >= 22 && parseInt(firstTwoDigits) <= 27)) {
    return 'master';
  }

  // Default para Visa se não conseguir identificar
  return 'visa';
}

/**
 * Valida o número do cartão usando algoritmo de Luhn
 */
export function validateCardNumber(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/\D/g, '');
  
  if (cleaned.length < 13 || cleaned.length > 19) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Formata o número do cartão com espaços
 */
export function formatCardNumber(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\D/g, '');
  const formatted = cleaned.replace(/(.{4})/g, '$1 ').trim();
  return formatted;
}

