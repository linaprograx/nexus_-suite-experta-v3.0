import React from 'react';
import { motion } from 'framer-motion';
import { PageName, NavigationProps } from '../types';

const BottomNav: React.FC<NavigationProps> = ({ currentPage, onNavigate }) => {
    const tabs = [
        { name: PageName.Dashboard, icon: 'home' },
        { name: PageName.Pizarron, icon: 'dashboard' },
        { name: PageName.CerebritySynthesis, icon: 'auto_awesome', center: true },
        { name: PageName.GrimorioRecipes, icon: 'auto_stories' },
        { name: PageName.AvatarCore, icon: 'face' },
    ];

    return (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-[92%] z-[100]">
            <div className="neu-flat rounded-[2.5rem] p-2 flex justify-between items-center relative overflow-hidden bg-[#EFEEEE]">
                {tabs.map((tab) => {
                    const isActive = currentPage === tab.name;

                    if (tab.center) {
                        return (
                            <motion.button
                                key={tab.name}
                                onClick={() => onNavigate(tab.name)}
                                className={`relative -top-8 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 z-20 
                  ${isActive ? 'neu-btn text-[#6D28D9]' : 'neu-flat text-neu-sec'}`}
                                whileTap={{ scale: 0.9 }}
                                animate={isActive ? { y: -5 } : { y: 0 }}
                            >
                                <span className={`material-symbols-outlined text-3xl ${isActive ? 'filled' : ''}`}>
                                    {tab.icon}
                                </span>
                            </motion.button>
                        );
                    }

                    return (
                        <motion.button
                            key={tab.name}
                            onClick={() => onNavigate(tab.name)}
                            className="relative flex flex-col items-center justify-center w-12 h-12 rounded-2xl z-10"
                            whileTap={{ scale: 0.9 }}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 neu-pressed rounded-2xl"
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}
                            <span className={`material-symbols-outlined text-2xl relative z-20 ${isActive ? 'text-[#6D28D9] filled' : 'text-neu-sec'}`}>
                                {tab.icon}
                            </span>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};

export default BottomNav;
