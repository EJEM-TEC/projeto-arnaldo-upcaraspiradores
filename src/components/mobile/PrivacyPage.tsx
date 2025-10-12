'use client';

export default function PrivacyPage() {
    return (
        <div className="px-4 py-6">
            <h1 className="text-white text-2xl font-bold text-center mb-8 uppercase">
                POLÍTICA DE PRIVACIDADE
            </h1>

            <div className="space-y-4 text-sm text-gray-300">
                <p>
                    <strong className="text-white">1. Coleta de Dados</strong><br />
                    Coletamos apenas os dados necessários para prestar nossos serviços.
                </p>

                <p>
                    <strong className="text-white">2. Uso dos Dados</strong><br />
                    Seus dados são utilizados exclusivamente para melhorar nossos serviços.
                </p>

                <p>
                    <strong className="text-white">3. Compartilhamento</strong><br />
                    Não compartilhamos seus dados pessoais com terceiros.
                </p>

                <p>
                    <strong className="text-white">4. Segurança</strong><br />
                    Implementamos medidas de segurança para proteger seus dados.
                </p>
            </div>
        </div>
    );
}
