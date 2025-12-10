import React from 'react';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';
import { ViewName, Recipe, Ingredient, PizarronTask, UserProfile } from '../../types';
import DashboardView from './DashboardView';
import GrimoriumView from './GrimoriumView';
import PizarronView from './PizarronView';
import CerebrityView from './CerebrityView';
import LabView from './LabView';
import TrendLocatorView from './TrendLocatorView';
import ZeroWasteView from './ZeroWasteView';
import EscandallatorView from './EscandallatorView';
import MakeMenuView from './MakeMenuView';
import ColegiumView from './ColegiumView';
import PersonalView from './PersonalView';
import UnleashView from './UnleashView';
import AvatarView from './AvatarView';
import { PlaceholderView } from '../components/ui/PlaceholderView';

interface ContentViewProps {
  currentView: ViewName;
  setCurrentView: (view: ViewName) => void;
  db: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
  userId: string;
  appId: string;
  allRecipes: Recipe[];
  allIngredients: Ingredient[];
  allPizarronTasks: PizarronTask[];
  onOpenRecipeModal: (recipe: Partial<Recipe> | null) => void;
  taskToOpen: string | null;
  onTaskOpened: () => void;
  draggingRecipe: Recipe | null;
  draggingTask: string | null;
  onDropEnd: () => void;
  onDragTaskStart: (taskId: string) => void;
  onAnalyze: (text: string) => void;
  initialText: string | null;
  onAnalysisDone: () => void;
  onDragRecipeStart: (recipe: Recipe) => void;
  userProfile: Partial<UserProfile>;
}

export const ContentView: React.FC<ContentViewProps> = (props) => {
  const { currentView, ...rest } = props;

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView allRecipes={rest.allRecipes} allPizarronTasks={rest.allPizarronTasks} allIngredients={rest.allIngredients} auth={rest.auth} setCurrentView={props.setCurrentView} />;
      case 'unleash':
        return <UnleashView allRecipes={rest.allRecipes} allIngredients={rest.allIngredients} db={rest.db} userId={rest.userId} />;
      case 'avatar':
        return <AvatarView />;
      case 'grimorium':
        return <GrimoriumView
          db={rest.db}
          userId={rest.userId}
          appId={rest.appId}
          allIngredients={rest.allIngredients}
          allRecipes={rest.allRecipes}
          onOpenRecipeModal={rest.onOpenRecipeModal}
          onDragRecipeStart={rest.onDragRecipeStart}
          setCurrentView={props.setCurrentView}
        />;
      case 'pizarron':
        return <PizarronView db={rest.db} userId={rest.userId} appId={rest.appId} auth={rest.auth} storage={rest.storage} allPizarronTasks={rest.allPizarronTasks} taskToOpen={rest.taskToOpen} onTaskOpened={rest.onTaskOpened} draggingRecipe={rest.draggingRecipe} draggingTask={rest.draggingTask} onDropEnd={rest.onDropEnd} onDragTaskStart={rest.onDragTaskStart} onAnalyze={rest.onAnalyze} userProfile={rest.userProfile} />;
      case 'cerebrIty':
        return <CerebrityView {...rest} initialText={rest.initialText} onAnalysisDone={rest.onAnalysisDone} />;
      case 'makeMenu':
        return <MakeMenuView db={rest.db} userId={rest.userId} appId={rest.appId} allRecipes={rest.allRecipes} allPizarronTasks={rest.allPizarronTasks} />;
      case 'colegium':
        return <ColegiumView db={rest.db} userId={rest.userId} allRecipes={rest.allRecipes} allPizarronTasks={rest.allPizarronTasks} />;
      case 'personal':
        return <PersonalView db={rest.db} userId={rest.userId} storage={rest.storage} auth={rest.auth} allRecipes={rest.allRecipes} allPizarronTasks={rest.allPizarronTasks} />;

      case 'trendLocator':
        return <TrendLocatorView db={rest.db} userId={rest.userId} appId={rest.appId} />;
      default:
        // Handle sub-views or legacy cases safely
        return <PlaceholderView title={currentView} />;
    }
  };

  return <div className="w-full h-full">{renderView()}</div>;
};
