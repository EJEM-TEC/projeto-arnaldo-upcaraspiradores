'use client';

export default function TermosDeUso() {
  const termosDeUso = `TERMOS DE USO / E CONDIÇÕES
Termos de Uso - UpCarAspiradores

Estes Termos de Uso regem o seu acesso e uso do site e dos serviços fornecidos pela UpCarAspiradores.

Ao criar uma conta ou usar nossos Serviços, você concorda em cumprir estes Termos.


1. Descrição do Serviço
A UpCarAspiradores fornece acesso a equipamentos de aspiração de veículos. Os usuários devem criar uma conta em nosso site e adicionar créditos ("Saldo") à sua conta. O Saldo é utilizado para pagar pelo tempo de uso dos aspiradores.


2. Elegibilidade e Conta de Usuário
Você deve ter pelo menos 18 anos para criar uma conta.

Você concorda em fornecer informações verdadeiras e completas (Nome, E-mail) durante o cadastro.

Você é o único responsável por manter a confidencialidade da sua senha e por todas as atividades que ocorrem em sua conta. Notifique-nos imediatamente sobre qualquer uso não autorizado.


3. Pagamentos e Saldo
Processador de Pagamento: Todos os pagamentos para adicionar Saldo são processados exclusivamente através do nosso parceiro, Mercado Pago. Ao realizar um pagamento, você estará sujeito aos termos e condições do Mercado Pago. Não armazenamos seus dados financeiros.

Uso do Saldo: O Saldo em sua conta é usado para pagar pelo tempo de uso dos aspiradores, conforme as tarifas exibidas no local ou no site.

O Saldo adquirido não é reembolsável, só é reembolsável em caso de falha comprovada do sistema.

Expiração do Saldo: O Saldo não expira.

4. Obrigações do Usuário
Ao usar os Serviços e os equipamentos (aspiradores), você concorda em:

Utilizar os equipamentos de forma segura e adequada, seguindo eventuais instruções no local.

Não causar danos intencionais aos equipamentos ou à propriedade.

Não utilizar o Serviço para fins ilegais ou fraudulentos.

Pagar por todo o tempo de uso registrado em sua conta.


5. Limitação de Responsabilidade
Falhas no Equipamento: Nossos aspiradores são mantidos regularmente. No entanto, não garantimos que estarão operacionais 100% do tempo. Em caso de falha durante o uso, entre em contato com nosso suporte para análise.

Serviço "Como Está": Nossos Serviços são fornecidos "como estão". Na extensão máxima permitida pela lei, isentamo-nos de todas as garantias, expressas ou implícitas.

Danos: Não nos responsabilizamos por quaisquer danos ao seu veículo ou pertences pessoais que possam ocorrer durante o uso dos aspiradores, a menos que causados por negligência comprovada de nossa parte.

Pagamentos: Não somos responsáveis por quaisquer problemas, taxas ou disputas decorrentes da sua transação com o Mercado Pago.


6. Encerramento
Pelo Usuário: Você pode encerrar sua conta a qualquer momento, entrando em contato conosco.

Por Nós: Podemos suspender ou encerrar sua conta se você violar estes Termos, usar a conta para atividades fraudulentas ou ficar inativo por um longo período.


7. Propriedade Intelectual
Nosso software é de nossa propriedade exclusiva e protegido por leis de direitos autorais.

8. Alterações nos Termos
Podemos modificar estes Termos a qualquer momento. Se fizermos alterações significativas, notificaremos você por e-mail.

9. Lei Aplicável e Foro
Estes Termos serão regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca de Guarulhos, Estado de São Paulo, para dirimir quaisquer controvérsias decorrentes destes Termos.

10. Contato
Dúvidas sobre estes Termos? Entre em contato: E-mail: arnaldfirst@gmail.com`;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Termos de Uso e Condições</h1>
        <div className="prose prose-sm max-w-none">
          {termosDeUso.split('\n').map((line, index) => {
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
