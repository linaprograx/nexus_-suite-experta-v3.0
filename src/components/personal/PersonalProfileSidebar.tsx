import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { UserProfile } from '../../../types';

interface PersonalProfileSidebarProps {
    profile: Partial<UserProfile>;
    onEditProfile: () => void;
    onUploadAvatar: () => void;
    newAvatarPreview: string | null;
}

export const PersonalProfileSidebar: React.FC<PersonalProfileSidebarProps> = ({
    profile,
    onEditProfile,
    onUploadAvatar,
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
                </div>
            </Card>

            <Card
                className={`group relative overflow-hidden p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-xl cursor-pointer transition-all duration-300 ${showLevelDetails ? 'row-span-2' : ''}`}
                onClick={() => setShowLevelDetails(!showLevelDetails)}
            >
                <div className="flex items-center justify-between mb-4">
                    <span className="font-bold uppercase tracking-wider text-xs opacity-70">Nivel Actual</span>
                    <Icon svg={showLevelDetails ? ICONS.chevronUp : ICONS.star} className="w-5 h-5 text-yellow-300 transition-transform" />
                </div>
                <div className="text-4xl font-bold mb-2">12</div>
                <div className="w-full bg-black/20 rounded-full h-2 mb-2">
                    <div className="bg-white h-2 rounded-full w-[70%] shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                </div>
                <p className="text-xs opacity-80 text-right">3,450 / 5,000 XP</p>

                {/* Collapsible Details */}
                <div className={`grid transition-all duration-300 ease-in-out ${showLevelDetails ? 'grid-rows-[1fr] opacity-100 mt-6 pt-6 border-t border-white/20' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="opacity-80">Dominio</span>
                            <span className="font-bold">Coctelería Clásica</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="opacity-80">Completado</span>
                            <span className="font-bold">42 Módulos</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="opacity-80">Racha</span>
                            <span className="font-bold">5 Días 🔥</span>
                        </div>
                        <div className="mt-4 p-3 bg-white/10 rounded-xl text-xs text-center">
                            Próxima Recompensa: <br />
                            <strong className="text-yellow-300">Badge 'Mixólogo Master'</strong>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};
