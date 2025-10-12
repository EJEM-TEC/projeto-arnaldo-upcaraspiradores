import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "UpCarAspiradores - Home",
    description: "Aspiradores Inteligentes - Página Principal",
};

export default function HomeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-900">
            {children}
        </div>
    );
}
