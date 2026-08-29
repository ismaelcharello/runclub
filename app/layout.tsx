import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata={title:"Pace Orbit — Biblioteca de movimentos",description:"Movimentos que acompanham o seu ritmo."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>}
