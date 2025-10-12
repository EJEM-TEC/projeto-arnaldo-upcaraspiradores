'use client';

export default function HistoryPage() {


    return (
        <div className="px-4 py-6">
            <h1 className="text-white text-2xl font-bold text-center mb-8 uppercase">
                HISTÓRICO
            </h1>

            <div className="space-y-4">
                <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-semibold">Aspirador #001</span>
                        <span className="text-orange-500 font-bold">R$ 25,00</span>
                    </div>
                    <p className="text-gray-400 text-sm">15/01/2024 - 14:30</p>
                    <p className="text-gray-400 text-sm">Duração: 25 minutos</p>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-semibold">Aspirador #002</span>
                        <span className="text-orange-500 font-bold">R$ 18,00</span>
                    </div>
                    <p className="text-gray-400 text-sm">15/01/2024 - 15:45</p>
                    <p className="text-gray-400 text-sm">Duração: 18 minutos</p>
                </div>
            </div>
        </div>
    );
}
