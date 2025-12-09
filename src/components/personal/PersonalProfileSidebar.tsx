import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { UserProfile } from '../../../types';
import { NexusMemberPassCard } from './NexusMemberPassCard';

interface PersonalProfileSidebarProps {
    profile: Partial<UserProfile>;
    onEditProfile: () => void;
    onUploadAvatar: () => void;
    onSaveProfile: () => void;
    newAvatarPreview: string | null;
}

export const PersonalProfileSidebar: React.FC<PersonalProfileSidebarProps> = ({
    profile,
    onEditProfile,
    onUploadAvatar,
    onSaveProfile,
    newAvatarPreview
}) => {
    const [showLevelDetails, setShowLevelDetails] = React.useState(false);

    return (
        <div className="h-full flex flex-col gap-6">
            <Card className="flex flex-col items-center p-8 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-slate-200 dark:border-slate-800">
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                    <img
                        src={newAvatarPreview || profile.photoURL || `https://ui-avatars.com/api/?name=${profile.displayName || 'U'}&background=random`}
                        alt="Profile"
                        className="relative w-32 h-32 rounded-full object-cover border-4 border-white dark:border-slate-900 shadow-xl"
                    />
                    <button
                        onClick={onUploadAvatar}
                        className="absolute bottom-0 right-0 p-2 bg-indigo-600 rounded-full text-white shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-500"
                    >
                        <Icon svg={ICONS.edit} className="w-4 h-4" />
                    </button>
                </div>

                <h2 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white text-center">
                    {profile.displayName || 'Usuario Nexus'}
                </h2>
                <p className="text-indigo-500 font-medium text-sm text-center">
                    {profile.jobTitle || 'Mixólogo'}
                </p>

                <div className="mt-6 w-full flex justify-center gap-2">
                    {profile.instagramHandle && (
                        <div className="flex items-center text-slate-400 text-sm bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                            <Icon svg={ICONS.tag} className="w-3 h-3 mr-1" />
                            {profile.instagramHandle}
                        </div>
                    )}
                </div>

                <div className="mt-8 w-full">
                    <Button variant="outline" className="w-full" onClick={onEditProfile}>
                        Editar Perfil
                    </Button>
                    <Button variant="default" className="w-full mt-2" onClick={onSaveProfile}>
                        Guardar Cambios
                    </Button>
                </div>
            </Card>

            <NexusMemberPassCard
                level={12}
                xpCurrent={3450}
                xpMax={5000}
            />
        </div>
    );
};
