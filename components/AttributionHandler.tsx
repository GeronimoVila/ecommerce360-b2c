'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';

function AttributionLogic() {
    const searchParams = useSearchParams();
    const refId = searchParams.get('ref');

    useEffect(() => {
        if (!refId) return;

        const currentCookie = Cookies.get('seller_attribution');
        if (currentCookie === refId) return;

        const validateSeller = async () => {
            try {
                const response = await fetch(`http://localhost:8080/api/v1/users/validate/${refId}`);
                
                if (response.ok) {
                    Cookies.set('seller_attribution', refId, { 
                        expires: 30,
                        path: '/',
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax'
                    });
                    console.log(`[Atribución] Vendedor ${refId} registrado en sesión.`);
                } else {
                    console.warn('[Atribución] Enlace de referido inválido o vendedor inactivo.');
                }
            } catch (error) {
                console.error('[Atribución] Error validando el referido:', error);
            }
        };

        validateSeller();
    }, [refId]);

    return null;
}

export default function AttributionHandler() {
    return (
        <Suspense fallback={null}>
            <AttributionLogic />
        </Suspense>
    );
}