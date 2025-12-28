import React, { createContext, useContext, useState } from 'react';

const LoadingContext = createContext({
    isAppLoading: true,
    setIsAppLoading: () => { },
});

export const useAppLoading = () => useContext(LoadingContext);

export const LoadingProvider = ({ children }) => {
    const [isAppLoading, setIsAppLoading] = useState(true);

    return (
        <LoadingContext.Provider value={{ isAppLoading, setIsAppLoading }}>
            {children}
        </LoadingContext.Provider>
    );
};
