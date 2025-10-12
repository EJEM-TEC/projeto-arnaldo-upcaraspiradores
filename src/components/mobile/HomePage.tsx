'use client';

export default function HomePage() {
    return (
        <div className="px-4 py-6">
            {/* Instruction */}
            <h1 className="text-white text-2xl font-bold text-center mb-8 uppercase">
                INFORME O NÚMERO DO ASPIRADOR ABAIXO
            </h1>

            {/* Input Field */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Digite o número aqui"
                    className="w-full px-4 py-4 bg-white rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg"
                />
            </div>

            {/* Next Button */}
            <button className="w-full bg-orange-500 text-white py-4 rounded-lg font-bold text-lg uppercase hover:bg-orange-600 transition-colors flex items-center justify-center">
                PRÓXIMO →
            </button>
        </div>
    );
}
