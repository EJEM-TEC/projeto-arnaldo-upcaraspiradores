'use client';

export default function PoliticaPrivacidade() {
  const politicaPrivacidade = `POLÍTICA DE PRIVACIDADE
Bem-vindo ao UpCarAspiradores. Nós levamos sua privacidade a sério. Esta Política de Privacidade explica como coletamos, usamos, compartilhamos e protegemos suas informações pessoais.

Ao usar nossos serviços, você concorda com a coleta e uso de informações de acordo com esta política.


1. Informações que Coletamos
Coletamos diferentes tipos de informações para fornecer e melhorar nosso serviço:

Informações Fornecidas por Você:

Dados de Cadastro: Quando você cria uma conta, coletamos seu Nome e Endereço de e-mail.

Comunicações: Se você entrar em contato conosco (por exemplo, para suporte), podemos guardar um registro dessa comunicação.

Dados de Pagamento (Processados por Terceiros):

Para adicionar saldo à sua conta, você será redirecionado para o nosso provedor de pagamentos, o Mercado Pago.

O Mercado Pago coletará seus dados de pagamento (como nome completo, CPF, dados do cartão de crédito ou informações bancárias).

Nós, da UpCarAspiradores, não coletamos, armazenamos ou temos acesso direto aos seus dados financeiros completos. Apenas recebemos do Mercado Pago a confirmação de que o pagamento foi aprovado e o valor creditado.

Recomendamos que você leia a Política de Privacidade do Mercado Pago.


Informações de Uso e Técnicas:

Dados de Saldo: Mantemos um registro do seu saldo, seus gastos e o tempo de uso dos nossos aspiradores.

Cookies e Dados de Acesso: Podemos usar cookies e tecnologias semelhantes para manter sua sessão ativa, entender como você usa nosso site e melhorar sua experiência.


2. Como Usamos Suas Informações
Usamos as informações coletadas para:

Fornecer e gerenciar nosso serviço: Criar sua conta, processar seus pagamentos (via Mercado Pago), creditar seu saldo e permitir o uso dos aspiradores.

Comunicação: Enviar e-mails transacionais (confirmação de pagamento, redefinição de senha) e informativos sobre o serviço.

Suporte ao Cliente: Responder às suas perguntas e solicitações.

Melhoria: Analisar como os serviços são usados para corrigir problemas e desenvolver novos recursos.

Segurança e Obrigações Legais: Proteger contra fraudes e cumprir obrigações legais.


3. Compartilhamento de Informações
Não vendemos suas informações pessoais. Podemos compartilhar seus dados nas seguintes circunstâncias:

Com Provedores de Pagamento: Compartilhamos as informações necessárias (como valor da transação e identificação básica) com o Mercado Pago para processar seu pagamento.

Por Obrigação Legal: Se formos obrigados por lei, intimação ou processo legal a divulgar suas informações.

Para Proteger Nossos Direitos: Para aplicar nossos Termos de Uso e proteger a segurança da nossa plataforma e de outros usuários.


4. Seus Direitos (LGPD)
De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem o direito de:

Acessar os dados que temos sobre você.

Corrigir dados incompletos, inexatos ou desatualizados.

Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários.

Solicitar a portabilidade dos seus dados a outro fornecedor.

Solicitar a eliminação dos dados tratados com seu consentimento.

Para exercer seus direitos, entre em contato conosco pelo e-mail: arnaldfirst@gmail.com


5. Segurança dos Dados
Empregamos medidas de segurança técnicas e administrativas para proteger seus dados. No entanto, nenhum sistema é 100% seguro. Embora façamos o nosso melhor, não podemos garantir a segurança absoluta das suas informações.


6. Alterações nesta Política
Podemos atualizar nossa Política de Privacidade periodicamente. Notificaremos você sobre quaisquer alterações publicando a nova política nesta página.


7. Contato
Se você tiver alguma dúvida sobre esta Política de Privacidade, entre em contato: E-mail: arnaldfirst@gmail.com`;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Política de Privacidade</h1>
        <div className="prose prose-sm max-w-none">
          {politicaPrivacidade.split('\n').map((line, index) => {
            if (line.match(/^\d+\./)) {
              return (
                <h2 key={index} className="text-xl font-semibold text-gray-800 mt-6 mb-3">
                  {line}
                </h2>
              );
            }
            if (line.match(/^[A-Z][a-z]+.*:/)) {
              return (
                <h3 key={index} className="text-lg font-semibold text-gray-700 mt-4 mb-2">
                  {line}
                </h3>
              );
            }
            if (line.trim() === '') {
              return <div key={index} className="my-2"></div>;
            }
            return (
              <p key={index} className="text-gray-700 leading-relaxed mb-2">
                {line}
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
}
