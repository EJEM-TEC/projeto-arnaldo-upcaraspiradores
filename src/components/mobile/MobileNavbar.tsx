'use client';

import Image from 'next/image';

interface MobileNavbarProps {
    onMenuClick: () => void;
}

export default function MobileNavbar({ onMenuClick }: MobileNavbarProps) {
    return (
        <div className="px-4 py-4">
            {/* Hamburger Menu */}
            <button
                onClick={onMenuClick}
                className="mb-4 flex items-center justify-center w-10 h-10"
            >
                <div className="space-y-1">
                    <div className="w-6 h-0.5 bg-orange-500"></div>
                    <div className="w-6 h-0.5 bg-orange-500"></div>
                    <div className="w-6 h-0.5 bg-orange-500"></div>
                </div>
            </button>

            {/* Logo */}
            <div className="text-center mb-4">

                <Image
                    src="/upcar_preto_menor.png"
                    alt="UpCar Logo"
                    width={200}
                    height={40}
                    className="mx-auto mb-1"
                />
                <div className="text-center">
                    <div className="w-32 h-px bg-white mx-auto"></div>
                    <p className="text-gray-400 text-smitalic text-base mt-1">
                        Aspiradores <span className="font-bold">inteligentes</span>
                    </p>
                </div>
            </div>

            {/* Separator */}
            <div className="w-full h-px bg-orange-500"></div>
        </div>
    );
}
