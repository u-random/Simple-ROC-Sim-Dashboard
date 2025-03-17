// src/hooks/useEscapeKey.tsx - My custom hook for triggering a callback function by pressing ESC button


// TODO: Consider waiting a bit, as it can trigger several callbacks at once, like deselect ship and close settings


import { useEffect } from 'react';


const useEscapeKey = (callback: () => void) => {
    useEffect(() => {
        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                callback();
            }
        };

        document.addEventListener('keydown', handleEscapeKey);
        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [callback]);
};

export default useEscapeKey;