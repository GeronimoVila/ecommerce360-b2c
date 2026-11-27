import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#0B1120] text-slate-400 border-t border-slate-800/80 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div className="space-y-3 max-w-sm">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white">
                LEGADO HOGAR
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-slate-400">
              © 2026 LEGADO HOGAR Inc. Todos los derechos reservados.
              Distribuidor autorizado de electrónica y línea blanca.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {['Mercado Pago', 'Visa', 'Mastercard', 'Transferencia Bancaria'].map(
                (method) => (
                  <span
                    key={method}
                    className="px-2.5 py-1 text-[11px] font-medium text-slate-300 bg-slate-800/90 border border-slate-700/70 rounded-md"
                  >
                    {method}
                  </span>
                )
              )}
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <Link
                href="/?offers=true"
                className="font-semibold text-[#10B981] hover:text-emerald-400 transition-colors"
              >
                Garantía Oficial y Servicio Técnico
              </Link>
              <Link
                href="/mis-compras"
                className="hover:text-white transition-colors"
              >
                Mis compras
              </Link>
              <Link
                href="/"
                className="hover:text-white transition-colors"
              >
                Políticas de Privacidad
              </Link>
            </div>
            <div>
              <a
                href="https://wa.me/5492640000000"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Contactar Soporte
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}