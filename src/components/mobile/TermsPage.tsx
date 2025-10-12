'use client';

export default function TermsPage() {
    return (
        <div className="px-4 py-6">
            <h1 className="text-white text-2xl font-bold text-center mb-8 uppercase">
                TERMOS E CONDIÇÕES
            </h1>

            <div className="space-y-4 text-sm text-gray-300">
                <p>
                    <strong className="text-white">1. Aceitação dos Termos</strong><br />
                    Ao utilizar nossos serviços, você concorda com estes termos e condições.
                </p>

                <p>
                    <strong className="text-white">2. Uso dos Equipamentos</strong><br />
                    Os equipamentos devem ser utilizados conforme as instruções fornecidas.
                </p>

                <p>
                    <strong className="text-white">3. Pagamentos</strong><br />
                    Os pagamentos são processados conforme os métodos disponíveis na plataforma.
                </p>

                <p>
                    <strong className="text-white">4. Responsabilidades</strong><br />
                    O usuário é responsável pelo uso adequado dos equipamentos.
                </p>
            </div>
        </div>
    );
}
