import { Firestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { BoardTemplate, PIZARRON_TEMPLATES } from './templates';

export const createBoardFromTemplate = async (
  db: Firestore,
  appId: string,
  templateId: string,
  customName?: string
) => {
  const template = PIZARRON_TEMPLATES.find(t => t.id === templateId);
  if (!template) {
    throw new Error(`Template with ID ${templateId} not found`);
  }

  const boardsColPath = `artifacts/${appId}/public/data/pizarron-boards`;

  const newBoardData = {
    name: customName || template.name,
    filters: {},
    category: 'general', // Default category, could be mapped from template if needed
    themeColor: template.color,
    icon: template.icon,
    description: template.description,
    createdAt: serverTimestamp(),
    templateId: template.id,
    columns: template.columns,
    automations: template.automations,
    linkedViews: template.linkedViews,
    isTemplateBased: true
  };

  try {
    const docRef = await addDoc(collection(db, boardsColPath), newBoardData);
    console.log("Board created successfully with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating board from template:", error);
    throw error;
  }
};
