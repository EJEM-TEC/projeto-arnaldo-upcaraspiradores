'use client';

export default function PrivacyPage() {
    return (
        <div className="px-4 py-6">
            <h1 className="text-white text-2xl font-bold text-center mb-8 uppercase">
                POLÍTICA DE PRIVACIDADE
            </h1>

            <div className="space-y-6 text-sm text-gray-300">
                <div>
                    <p className="font-bold text-white mb-2">BEM-VINDO AO UPCARASPIRADORES</p>
                    <p>Nós levamos sua privacidade a sério. Esta Política de Privacidade explica como coletamos, usamos, compartilhamos e protegemos suas informações pessoais.</p>
                    <p className="mt-2">Ao usar nossos serviços, você concorda com a coleta e uso de informações de acordo com esta política.</p>
                </div>

                <div>
                    <p className="font-bold text-white mb-2">1. INFORMAÇÕES QUE COLETAMOS</p>
                    <p>Coletamos diferentes tipos de informações para fornecer e melhorar nosso serviço:</p>
                    <p className="mt-2 font-bold text-white">Informações Fornecidas por Você:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-1">
                        <li><strong>Dados de Cadastro:</strong> Quando você cria uma conta, coletamos seu Nome e Endereço de e-mail.</li>
                        <li><strong>Comunicações:</strong> Se você entrar em contato conosco, podemos guardar um registro dessa comunicação.</li>
                    </ul>
                    <p className="mt-2 font-bold text-white">Dados de Pagamento (Processados por Terceiros):</p>
                    <ul className="list-disc pl-5 space-y-1 mt-1">
                        <li>Para adicionar saldo à sua conta, você será redirecionado para o nosso provedor de pagamentos, o Mercado Pago.</li>
                        <li>O Mercado Pago coletará seus dados de pagamento.</li>
                        <li>Nós não coletamos, armazenamos ou temos acesso direto aos seus dados financeiros completos.</li>
                    </ul>
                    <p className="mt-2 font-bold text-white">Informações de Uso e Técnicas:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-1">
                        <li><strong>Dados de Saldo:</strong> Mantemos um registro do seu saldo, seus gastos e o tempo de uso dos nossos aspiradores.</li>
                        <li><strong>Cookies:</strong> Podemos usar cookies e tecnologias semelhantes para manter sua sessão ativa.</li>
                    </ul>
                </div>

                <div>
                    <p className="font-bold text-white mb-2">2. COMO USAMOS SUAS INFORMAÇÕES</p>
                    <p>Usamos as informações coletadas para:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li>Fornecer e gerenciar nosso serviço</li>
                        <li>Comunicação transacional e informativa</li>
                        <li>Suporte ao Cliente</li>
                        <li>Melhoria de serviços</li>
                        <li>Segurança e Obrigações Legais</li>
                    </ul>
                </div>

                <div>
                    <p className="font-bold text-white mb-2">3. COMPARTILHAMENTO DE INFORMAÇÕES</p>
                    <p>Não vendemos suas informações pessoais. Podemos compartilhar seus dados nas seguintes circunstâncias:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li><strong>Com Provedores de Pagamento:</strong> Compartilhamos informações necessárias com o Mercado Pago.</li>
                        <li><strong>Por Obrigação Legal:</strong> Se formos obrigados por lei.</li>
                        <li><strong>Para Proteger Nossos Direitos:</strong> Para aplicar nossos Termos de Uso.</li>
                    </ul>
                </div>

                <div>
                    <p className="font-bold text-white mb-2">4. SEUS DIREITOS (LGPD)</p>
                    <p>De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem o direito de:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li>Acessar os dados que temos sobre você</li>
                        <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
                        <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários</li>
                        <li>Solicitar a portabilidade dos seus dados</li>
                        <li>Solicitar a eliminação dos dados</li>
                    </ul>
                    <p className="mt-2">Para exercer seus direitos, entre em contato: <strong>arnaldfirst@gmail.com</strong></p>
                </div>

                <div>
                    <p className="font-bold text-white mb-2">5. SEGURANÇA DOS DADOS</p>
                    <p>Empregamos medidas de segurança técnicas e administrativas para proteger seus dados. No entanto, nenhum sistema é 100% seguro. Embora façamos o nosso melhor, não podemos garantir a segurança absoluta das suas informações.</p>
                </div>

                <div>
                    <p className="font-bold text-white mb-2">6. ALTERAÇÕES NESTA POLÍTICA</p>
                    <p>Podemos atualizar nossa Política de Privacidade periodicamente. Notificaremos você sobre quaisquer alterações publicando a nova política nesta página.</p>
                </div>

                <div>
                    <p className="font-bold text-white mb-2">7. CONTATO</p>
                    <p>Se você tiver alguma dúvida sobre esta Política de Privacidade, entre em contato: <strong>E-mail: arnaldfirst@gmail.com</strong></p>
                </div>
            </div>
        </div>
    );
}
