import React, { useEffect } from 'react';
import { PageName } from '../types';
import { useApp } from '../../../context/AppContext';
import { AuthComponent } from '../../../components/auth/AuthComponent';

interface LoginProps {
    onNavigate: (page: PageName) => void;
}

const Login: React.FC<LoginProps> = ({ onNavigate }) => {
    const { user } = useApp();

    useEffect(() => {
        if (user) {
            onNavigate(PageName.Dashboard);
        }
    }, [user, onNavigate]);

    return (
        <div className="w-full h-full">
            <AuthComponent />
        </div>
    );
};

export default Login;
