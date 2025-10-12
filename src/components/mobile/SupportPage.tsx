'use client';

export default function SupportPage() {
    return (
        <div className="px-4 py-6">
            <h1 className="text-white text-2xl font-bold text-center mb-8 uppercase">
                SUPORTE
            </h1>

            <div className="space-y-6">
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-white font-semibold mb-2">Contato</h3>
                    <p className="text-gray-400 text-sm mb-2">Email: suporte@upcaraspiradores.com</p>
                    <p className="text-gray-400 text-sm">Telefone: (11) 99999-9999</p>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-white font-semibold mb-2">Horário de Atendimento</h3>
                    <p className="text-gray-400 text-sm">Segunda a Sexta: 8h às 18h</p>
                    <p className="text-gray-400 text-sm">Sábado: 8h às 12h</p>
                </div>

                <button className="w-full bg-orange-500 text-white py-4 rounded-lg font-bold text-lg uppercase hover:bg-orange-600 transition-colors">
                    ENVIAR MENSAGEM
                </button>
            </div>
        </div>
    );
}
