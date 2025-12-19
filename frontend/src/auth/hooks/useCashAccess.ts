import { useState, useEffect } from 'react';
import { getCashes } from '../../services/cashService';

export const useCashAccess = () => {
    const [hasCashAccess, setHasCashAccess] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkCashAccess = async () => {
            try {
                const cashes = await getCashes();
                setHasCashAccess(cashes.length > 0);
            } catch (error) {
                console.error('Error checking cash access:', error);
                setHasCashAccess(false);
            } finally {
                setLoading(false);
            }
        };

        checkCashAccess();
    }, []);

    return { hasCashAccess, loading };
};
