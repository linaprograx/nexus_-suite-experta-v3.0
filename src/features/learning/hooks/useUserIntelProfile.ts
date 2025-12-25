
import { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { LearningEngine } from '../../../core/learning/learning.engine';
import { UserIntelProfile, DEFAULT_INTEL_PROFILE } from '../../../core/learning/learning.types';

export const useUserIntelProfile = () => {
    const { db, userId } = useApp();
    const [profile, setProfile] = useState<UserIntelProfile>(DEFAULT_INTEL_PROFILE as UserIntelProfile);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            if (db && userId) {
                const p = await LearningEngine.getProfile(db, userId);
                setProfile(p);
            }
            setLoading(false);
        };
        load();
    }, [db, userId]);

    return { profile, loading };
};
